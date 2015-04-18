from . import build
from . import version
from mako import template
import json
import os
import yaml

def bad_sprite(path):
    raise build.BuildFailure(
        'Invalid sprite description: {}'.format(path))

class App(object):
    __slots__ = ['config', 'system']

    def __init__(self, config, system):
        self.config = config
        self.system = system

    def build(self):
        ver = version.get_version('.')

        path_map = {}
        self.build_images(path_map)

        if self.config.getboolean('json', 'pretty', fallback=False):
            path_map = 'var PATH_MAP = {};\n'.format(
                json.dumps(path_map, indent=4, sort_keys=True))
        else:
            path_map = 'var PATH_MAP={};'.format(
                json.dumps(path_map, separators=(',', ':'), sort_keys=True))
        path_map = path_map.encode('UTF-8')
        path_map = self.system.write('build/path_map.js', path_map, bust=True)

        phaser_src = (
            'phaser.min.js'
            if self.config.getboolean('phaser', 'minify', fallback=True)
            else 'phaser.js')
        phaser_path = self.system.copy(
            'build/phaser.js',
            'node_modules/phaser/dist/' + phaser_src,
            bust=True)

        app_path = self.system.build(
            'build/app.js',
            self.app_js,
            deps=build.all_files('src', exts={'.js'}),
            bust=True)

        self.system.build(
            'build/index.html',
            self.index_html,
            deps=['static/index.mak', 'static/style.css'],
            args=[[phaser_path, path_map, app_path], ver])

    def build_images(self, path_map):
        images = {}
        spritesheets = {}
        path_map['images'] = images
        path_map['spritesheets'] = spritesheets
        for path in build.all_files('images', exts={'.png', '.jpg'}):
            img_path = self.system.copy(
                os.path.join('build', path),
                path,
                bust=True)
            ypath = os.path.splitext(path)[0] + '.yaml'
            path = os.path.splitext(path)[0]
            path = os.path.relpath(path, 'images')
            img_path = os.path.relpath(img_path, 'build/images')
            try:
                fp = open(ypath)
            except FileNotFoundError:
                info = {'type': 'image'}
            else:
                with fp:
                    info = yaml.safe_load(fp)
            if info['type'] == 'image':
                images[path] = img_path
            elif info['type'] == 'grid':
                try:
                    width, height = info['width'], info['height']
                except KeyError:
                    bad_sprite(ypath)
                if not isinstance(width, int) and isinstance(height, int):
                    bad_sprite(ypath)
                spritesheets[path] = {'path': img_path, 'w': width, 'h': height}
            else:
                bad_sprite(ypath)

    def app_js(self):
        return build.minify_js(
            self.config,
            build.browserify(self.config, ['./src/main']))

    def index_html(self, scripts, ver):
        with open('static/style.css', 'rb') as fp:
            css_data = build.minify_css(self.config, fp.read())
        def relpath(path):
            return os.path.relpath(path, 'build/')
        tmpl = template.Template(filename='static/index.mak')
        data = tmpl.render(
            relpath=relpath,
            scripts=scripts,
            css_data=css_data.decode('UTF-8'),
            app_name='Chaos Tomb',
            version=ver,
        )
        return build.minify_html(self.config, data.encode('UTF-8'))
