#!/usr/bin/env sh
set -eu

mkdir -p /frontend_build
rm -rf /frontend_build/* || true
cp -r /out/* /frontend_build/ 2>/dev/null || true

# Держим контейнер живым, пока nginx использует volume
tail -f /dev/null
