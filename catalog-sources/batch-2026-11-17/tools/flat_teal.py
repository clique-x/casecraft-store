"""Transparent product image centred on a plain teal backdrop (no podium), for group shots.
usage: python3 -I flat_teal.py src.png out.png width_px"""
import sys
import numpy as np
from PIL import Image, ImageFilter
src, out, wpx = sys.argv[1], sys.argv[2], int(sys.argv[3])
N = 2048
yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
r = np.sqrt(((xx - N / 2) / N) ** 2 + ((yy - N * 0.45) / N) ** 2)
c0, c1 = np.array([14, 74, 86]), np.array([6, 30, 38])
t = np.clip(r / 0.75, 0, 1)[..., None]
bg = (c0 * (1 - t) + c1 * t)
im = Image.open(src).convert('RGBA')
s = wpx / im.width
im = im.resize((wpx, int(im.height * s)), Image.LANCZOS)
x0, y0 = (N - im.width) // 2, (N - im.height) // 2
canvas = Image.fromarray(bg.astype(np.uint8)).convert('RGBA')
glow = Image.new('RGBA', (N, N), (0, 0, 0, 0))
a = im.split()[3].point(lambda v: 255 if v > 20 else 0)
halo = Image.new('RGBA', im.size, (0, 197, 224, 150))
glow.paste(halo, (x0, y0), a)
glow = glow.filter(ImageFilter.GaussianBlur(40))
canvas.alpha_composite(glow)
canvas.alpha_composite(im, (x0, y0))
canvas.convert('RGB').save(out)
print('ok', out)
