from . import build
from wsgiref.simple_server import make_server, WSGIServer
from socketserver import ThreadingMixIn
import os
import re

class ThreadingServer(ThreadingMixIn, WSGIServer):
    pass

PLAIN_TEXT = ('Content-Type', 'text/plain;charset=UTF-8')

CONTENT_TYPE = {
    '.html': 'text/html;charset=UTF-8',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
}

def error_method_not_allowed(env, start_response):
    start_response('405 Method Not Allowed', [PLAIN_TEXT])
    body = '405 Method Not Allowed: {!r}'.format(env['REQUEST_METHOD'])
    yield body.encode('UTF-8')

def error_not_found(env, start_response):
    start_response('404 Not Found', [PLAIN_TEXT])
    body = '404 Not Found: {!r}'.format(env['PATH_INFO'])
    yield body.encode('UTF-8')

def error_internal(env, start_response, text):
    start_response('500 Internal Server Error', [PLAIN_TEXT])
    body = '500 Internal Server Error\n{}'.format(text)
    yield body.encode('UTF-8')

SAFE = re.compile('^[-_A-Za-z0-9][-_.A-Za-z0-9]*$')

class Handler(object):
    def __init__(self, app):
        self.app = app

    def __call__(self, env, start_response):
        if env['REQUEST_METHOD'] not in ('GET', 'HEAD'):
            return error_method_not_allowed(env, start_response)
        uri = env['PATH_INFO']
        if uri == '/':
            try:
                self.app.build()
            except build.BuildFailure as ex:
                return error_internal(env, start_response, ex)
            path = 'index.html'
            cache_control = 'no-cache'
        elif uri.startswith('/'):
            path = uri[1:]
            cache_control = 'max-age={}'.format(60*60*24)
            if not all(SAFE.match(part) for part in path.split('/')):
                return error_not_found(env, start_response)
        else:
            return error_not_found(env, start_response)
        i = path.rfind('.')
        content_type = None
        if i >= 0:
            ext = path[i:]
            content_type = CONTENT_TYPE.get(ext)
        if content_type is None:
            return error_not_found(env, start_response)
        try:
            fp = open(os.path.join('build', path), 'rb')
        except FileNotFoundError:
            return error_not_found(env, start_response)
        start_response('200 Ok', [
            ('Content-Type', content_type),
            ('Cache-Control', cache_control),
        ])
        return serve_file(fp)

def serve_file(fp):
    with fp:
        while True:
            chunk = fp.read(1024 * 64)
            if not chunk:
                return
            yield chunk

def serve(config, app):
    sec = config['server']
    host = sec.get('host', 'localhost')
    port = sec.getint('port', 8000)
    handler = Handler(app)
    server = make_server(host, port, Handler(app), ThreadingServer)
    server.serve_forever()
