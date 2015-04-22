# Copyright 2015 Dietrich Epp.
#
# This file is part of Chaos Tomb.  The Chaos Tomb source code is
# distributed under the terms of the 2-clause BSD license.
# See LICENSE.txt for details.
import base64
import hashlib
import json
import os
import pipes
import subprocess
import sys

class BuildFailure(Exception):
    pass

def all_files(root, *, exts=None):
    """List all files below the given root."""
    if exts is not None:
        if not exts:
            return
        exts = set(exts)
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [x for x in dirnames
                       if not x.startswith('.')]
        for filename in filenames:
            if filename.startswith('.'):
                continue
            if exts:
                ext = os.path.splitext(filename)[1]
                if ext not in exts:
                    continue
            yield os.path.join(dirpath, filename)

def latest_mtime(files):
    """Get the latest modification timestamp of the given files."""
    mtime = -1
    for file in files:
        mtime = max(mtime, os.stat(file).st_mtime)
    return mtime

def format_pipe(cmds):
    return ' | '.join(' '.join(pipes.quote(arg) for arg in cmd) for cmd in cmds)

def run_pipe(cmd, data=None):
    """Pipe data through a single command."""
    print('    ' + format_pipe([cmd]), file=sys.stderr)
    proc = subprocess.Popen(
        cmd,
        stdin=None if data is None else subprocess.PIPE,
        stdout=subprocess.PIPE)
    stdout, stderr = proc.communicate(data)
    if proc.returncode != 0:
        raise BuildFailure('Command failed: {}'.format(cmd[0]))
    return stdout

class CachedFile(object):
    __slots__ = ['path', 'hash', 'key']

def sort_key(path):
    base, ext = os.path.splitext(path)
    return ext, base

class BuildSystem(object):
    """The application build system."""
    __slots__ = ['cache']

    def __init__(self):
        self.cache = {}

    def copy(self, path, src, *, bust=False):
        """Copy a file and return the path."""
        def get_data():
            with open(src, 'rb') as fp:
                return fp.read()
        return self.build(path, get_data, deps=[src], bust=bust)

    def write(self, path, data, *, bust=False):
        """Write data and return the path."""
        return self.build(path, lambda x: x, args=[data], bust=bust)

    def build(self, path, builder, *,
              deps=[], args=(), kw={}, bust=False):
        """Build a file and return the corrected path."""
        mtime = latest_mtime(deps)
        key = mtime, args, kw
        try:
            cached = self.cache[path]
        except KeyError:
            cached = None
        else:
            if key == cached.key:
                return cached.path
        print('Rebuilding {}'.format(path), file=sys.stderr)
        data = builder(*args, **kw)
        obj = hashlib.new('SHA256')
        obj.update(data)
        hash = obj.digest()
        if cached is not None and cached.hash == hash:
            return cached.path
        dirname, basename = os.path.split(path)
        if bust:
            out_name = '{0[0]}.{1}{0[1]}'.format(
                os.path.splitext(basename),
                base64.b16encode(hash)[:8].lower().decode('UTF-8'))
            out_path = os.path.join(dirname, out_name)
        else:
            out_path = path
        cached = CachedFile()
        cached.path = out_path
        cached.hash = hash
        cached.key = key
        if dirname:
            os.makedirs(dirname, exist_ok=True)
        with open(out_path, 'wb') as fp:
            fp.write(data)
        self.cache[path] = cached
        return out_path

    def package(self, out_path, directory):
        """Create a package for all of the files."""
        if not directory:
            files = [c.path for c in self.cache.values()]
        else:
            if not directory.endswith('/'):
                directory += '/'
            files = [c.path[len(directory):] for c in self.cache.values()
                     if c.path.startswith(directory)]
        if not files:
            raise BuildFailure('No files')
        files.sort(key=sort_key)
        try:
            with open(out_path, 'wb') as fp:
                subprocess.check_call(['tar', 'cz'] + files,
                                      stdout=fp, cwd=directory)
        except:
            try:
                os.unlink(out_path)
            except FileNotFoundError:
                pass
            raise
        print('Created {}'.format(out_path))

def browserify(config, modules):
    """Bundle a JavaScript application using browserify."""
    try:
        env = dict(config['environment'])
    except KeyError:
        env = None
    sec = config['browserify']
    cmd = [sec.get('path', './node_modules/.bin/browserify')]
    cmd.extend(sec.get('flags', '').split())
    if env:
        cmd.extend(('-t', '[', 'envify'))
        for k, v in env.items():
            cmd.extend(('--' + k.upper(), v))
        cmd.append(']')
    cmd.extend(modules)
    return run_pipe(cmd)

def minify_js(config, data):
    """Minify a JavaScript document."""
    sec = config['uglifyjs']
    if sec.getboolean('enable', True):
        cmd = [sec.get('path', './node_modules/.bin/uglifyjs')]
        cmd.extend(sec.get('flags', '').split())
        data = run_pipe(cmd, data)
    return data

def minify_css(config, data):
    """Minify a CSS document."""
    sec = config['cleancss']
    if sec.getboolean('enable', True):
        cmd = [sec.get('path', './node_modules/.bin/cleancss')]
        cmd.extend(sec.get('flags', '').split())
        data = run_pipe(cmd, data)
    return data

def minify_html(config, data):
    """Minify an HTML document."""
    sec = config['html_minifier']
    if sec.getboolean('enable', True):
        cmd = [sec.get('path', './node_modules/.bin/html-minifier')]
        cmd.extend(sec.get('flags', '').split())
        data = run_pipe(cmd, data)
    return data

def minify_json(config, path):
    with open(path) as fp:
        obj = json.load(fp)
    return json.dumps(obj, separators=(',', ':')).encode('UTF-8')
