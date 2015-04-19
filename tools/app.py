from . import build
from . import version
from mako import template
import io
import json
import os
import PIL.Image
import yaml

def bad_sprite(path):
    raise build.BuildFailure(
        'Invalid sprite description: {}'.format(path))

def read_animation(animation):
    if isinstance(animation, int):
        return {'frames': [animation], 'fps': 0, 'loop': True}
    if isinstance(animation, str):
        parts = animation.split()
        frames = []
        loop = False
        fps = None
        parts.reverse()
        while parts:
            try:
                frame = int(parts[-1])
            except ValueError:
                break
            frames.append(frame)
            parts.pop()
        if not frames:
            return None
        parts.reverse()
        try:
            for part in parts:
                if parts[-1] == 'loop':
                    loop = True
                elif parts[-1].startswith('fps='):
                    fps = int(parts[-1][4:])
                else:
                    return None
        except ValueError:
            return None
        return {'frames': frames, 'fps': fps}
    return None

class App(object):
    __slots__ = ['config', 'system', 'scale']

    def __init__(self, config, system):
        self.config = config
        self.system = system
        self.scale = 2

    def build(self):
        ver = version.get_version('.')

        path_map = {}
        self.build_images(path_map)
        self.build_levels(path_map)

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
            img_path = self.system.build(
                os.path.join('build', path),
                self.scale_image,
                deps=[path],
                args=[path, self.scale],
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
                obj = {
                    'path': img_path,
                    'w': width * 2,
                    'h': height * 2,
                }
                if 'animations' in info:
                    anims = {}
                    obj['animations'] = anims
                    for k, anim in info['animations'].items():
                        anim_obj = read_animation(anim)
                        if anim_obj is None:
                            raise build.BuildFailure(
                                'Invalid animation: {!r}'.format(anim))
                        anims[k] = anim_obj
                if 'frames' in info:
                    obj['frames'] = info['frames']
                spritesheets[path] = obj
            else:
                bad_sprite(ypath)

    def scale_image(self, path, scale):
        img = PIL.Image.open(path)
        w, h = img.size
        img = img.resize((w * scale, h * scale), resample=PIL.Image.NEAREST)
        fp = io.BytesIO()
        img.save(fp, 'PNG')
        return fp.getvalue()

    def build_levels(self, path_map):
        levels = {}
        path_map['levels'] = levels
        for path in build.all_files('levels', exts={'.json'}):
            level_path = self.system.build(
                os.path.join('build', path),
                self.level,
                deps=[path],
                args=[path, self.scale],
                bust=True)
            path = os.path.splitext(path)[0]
            path = os.path.relpath(path, 'levels')
            level_path = os.path.relpath(level_path, 'build/levels')
            levels[path] = level_path

    def json(self, path):
        return build.minify_json(self.config, path)

    def level(self, path, scale):
        with open(path) as fp:
            obj = json.load(fp)
        obj['tilewidth'] *= scale
        obj['tileheight'] *= scale
        for t in obj['tilesets']:
            t['tilewidth'] *= scale
            t['tileheight'] *= scale
            t['imagewidth'] *= scale
            t['imageheight'] *= scale
        for t in obj['layers']:
            if t['type'] != 'objectgroup':
                continue
            t['height'] *= scale
            t['width'] *= scale
            for u in t['objects']:
                u['height'] *= scale
                u['width'] *= scale
                u['x'] *= scale
                u['y'] *= scale
        return json.dumps(obj, separators=(',', ':')).encode('UTF-8')

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
