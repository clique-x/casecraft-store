"""Place transparent PNGs on the teal stage. usage: python3 -I alpha_place.py SCRATCH src.png out.png height_px"""
import sys, os
import numpy as np
from PIL import Image
S = sys.argv[1]
sys.path.insert(0, S + '/cx-tools')
import stage, cutout, composite  # noqa: E402
src, out, h = sys.argv[2], sys.argv[3], int(sys.argv[4])
rgb, a, transp = cutout.load_rgba(src)
assert transp, 'expected transparency'
rgb, n = cutout.defringe(rgb, a)
img, info = composite.place(stage.Stage(S + '/ram-renders', 'front'), rgb, a, depth_px=6, cast=dict(blur=10, opacity=0.3), height_px=h, max_h=1160)
os.makedirs(os.path.dirname(out), exist_ok=True)
Image.fromarray(img).save(out, compress_level=6)
print('ok', out, info['size'], 'defringed', n)
