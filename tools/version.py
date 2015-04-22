# Copyright 2015 Dietrich Epp.
#
# This file is part of Chaos Tomb.  The Chaos Tomb source code is
# distributed under the terms of the 2-clause BSD license.
# See LICENSE.txt for details.
import re
import subprocess

VERSION_STRING = re.compile(
    r'v(\d+)(?:\.(\d+)(?:\.(\d+))?)?(?:-\d+(?:-.*)?)?')

def get_version(path):
    """Get the of the given Git repository."""
    proc = subprocess.Popen(
        ['git', 'describe'],
        cwd=path,
        stdout=subprocess.PIPE)
    stdout, stderr = proc.communicate()
    if proc.returncode == 0:
        return stdout.strip().decode('ASCII')

    proc = subprocess.Popen(
        ['git', 'rev-parse', 'HEAD'],
        cwd=path,
        stdout=subprocess.PIPE)
    stdout, stderr = proc.communicate()
    if proc.returncode != 0:
        print('Warning: Could not get SHA-1 for repository.',
              file=sys.stderr)
        return 'v0.0.0'
    sha1 = stdout.strip()

    proc = subprocess.Popen(
        ['git', 'rev-list', 'HEAD'],
        cwd=path,
        stdout=subprocess.PIPE)
    stdout, stderr = proc.communicate()
    if proc.returncode != 0:
        print('Warning: Could not list revisions.',
              file=sys.stderr)
        return 'v0.0.0'
    nrev = len(stdout.splitlines())

    return 'v0.0.0-{}-g{}'.format(nrev, sha1[:7].decode('ASCII'))
