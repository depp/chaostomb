# Copyright 2015 Dietrich Epp.
#
# This file is part of Chaos Tomb.  The Chaos Tomb source code is
# distributed under the terms of the 2-clause BSD license.
# See LICENSE.txt for details.
from . import app
from . import build
from . import slow

def run():
    import argparse
    import configparser
    p = argparse.ArgumentParser()
    p.add_argument('action', choices=(
        'build', 'serve', 'package', 'deploy'))
    p.add_argument('config')
    p.add_argument('--rate', type=slow.parse_rate)
    args = p.parse_args()
    config = configparser.ConfigParser()
    with open(args.config) as fp:
        config.read_file(fp)
    system = build.BuildSystem()
    try:
        obj = app.App(config, system)
        obj.build()
        if args.action == 'serve':
            from . import serve
            serve.serve(config, obj, rate=args.rate)
        elif args.action == 'package':
            system.package('package.tar.gz', 'build')
        elif args.action == 'deploy':
            pass
    except build.BuildFailure as ex:
        print('Build failed: {}'.format(ex))

if __name__ == '__main__':
    run()
