# Copyright 2015 Dietrich Epp.
#
# This file is part of Chaos Tomb.  The Chaos Tomb source code is
# distributed under the terms of the 2-clause BSD license.
# See LICENSE.txt for details.
"""WSGI wrapper for simulating a slow network connection."""
import io
import random
import threading
import time

def uniform_chunks(chunks, size):
    """Break a stream of chunks into chunks of uniform size."""
    data = io.BytesIO()
    for chunk in chunks:
        data.write(chunk)
        if data.tell() < size:
            continue
        data.seek(0)
        chunk = data.read(size)
        while len(chunk) >= size:
            yield chunk
            chunk = data.read(size)
        data.truncate(0)
        data.seek(0)
        data.write(chunk)
    data.seek(0)
    chunk = data.read(size)
    while chunk:
        yield chunk
        chunk = data.read(size)

def should_be_fast(env):
    path = env['PATH_INFO']
    i = path.rfind('.')
    if i < 0:
        return True
    return path[i:] == '.js'

class SlowWrapper(object):
    """WSGI wrapper which simulates a slower network connection."""
    __slots__ = ['app', 'lock', 'delay0', 'delay1', 'size1']

    def __init__(self, app, rate=56e3, delay=0.2):
        self.app = app
        self.lock = threading.Lock()
        self.delay0 = delay
        self.delay1 = 0.1
        self.size1 = max(1, round(rate / 8 * self.delay1))
        if rate > 1e6:
            rate = '{:.1f} Mbit/s'.format(rate * 1e-6)
        else:
            rate = '{:.1f} Kbit/s'.format(rate * 1e-3)
        print('Throttling to {}'.format(rate))
        print(self.size1)

    def __call__(self, environ, start_response):
        if should_be_fast(environ):
            yield from self.app(environ, start_response)
            return
        time.sleep((0.5 + random.random()) * self.delay0)
        chunk_iter = self.app(environ, start_response)
        for chunk in uniform_chunks(chunk_iter, self.size1):
            with self.lock:
                time.sleep(self.delay1)
                yield chunk

SUFFIX = {'k': 1e3, 'M': 1e6}
def parse_rate(rate):
    """Parse a data transfer rate."""
    factor = 1
    try:
        factor = SUFFIX[rate[-1]]
    except KeyError:
        pass
    except IndexError:
        raise ValueError()
    else:
        rate = rate[:-1]
    return factor * float(rate)
