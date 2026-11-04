#!/usr/bin/env sh
# Downloads the ISNet general-use model (about 170 MB) used by cutout.py. Not committed.
set -eu
dir="${1:-$(dirname "$0")/.models}"
mkdir -p "$dir"
curl -fL --retry 3 -o "$dir/isnet-general-use.onnx" \
  https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx
echo "$dir/isnet-general-use.onnx"
