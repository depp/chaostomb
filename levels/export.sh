#!/bin/sh
# Note: we use the UI export, since this doesn't export objects, just tiles.
# We have to manually delete water and lava before image export.
set -e
test -d images || mkdir images
for level in *.tmx ; do
    test "${level}" = _template.tmx && continue
    tmxrasterizer "${level}" images/"${level%.tmx}.png"
done
