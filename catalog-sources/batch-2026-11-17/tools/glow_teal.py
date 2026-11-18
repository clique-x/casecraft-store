"""Brand packshot on white, with RGB glow, -> pieces on the plain teal backdrop, glow kept.

The glow around a backlit keyboard or mouse is light on white paper, so a matte would either drop it or keep it as an opaque
pale halo. Instead each piece is split in two:
  - the body: dark outline found by threshold, holes filled, so white keycaps inside it stay opaque;
  - everything else: colour-to-alpha against white (GIMP's method), which turns the glow into coloured light that shows on
    the dark teal the way it does in the room.
Pieces with no dark outline (the white OTG adapter) use the isnet matte instead.

usage: python3 -I glow_teal.py SCRATCH src.jpg out.png LAYOUT.json
LAYOUT.json: {"size": 2048, "pieces": [{"box": [x0, y0, x1, y1], "mode": "glow" | "isnet", "at": [cx, cy], "width": px}]}
"""
import json
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

S, src, out, layout_path = sys.argv[1:5]
layout = json.load(open(layout_path))
N = layout['size']
img = np.asarray(Image.open(src).convert('RGB')).astype(np.float64) / 255.0


def backdrop(n):
    yy, xx = np.mgrid[0:n, 0:n].astype(np.float64)
    r = np.sqrt(((xx - n / 2) / n) ** 2 + ((yy - n * 0.45) / n) ** 2)
    c0, c1 = np.array([14, 74, 86]), np.array([6, 30, 38])
    t = np.clip(r / 0.75, 0, 1)[..., None]
    return c0 * (1 - t) + c1 * t


def color_to_alpha(rgb):
    a = np.clip((1.0 - rgb).max(axis=2), 0, 1)
    a = np.clip((a - 0.025) / 0.975, 0, 1)  # JPEG noise on the white
    safe = np.maximum(a, 1e-6)[..., None]
    col = np.clip((rgb - (1.0 - safe)) / safe, 0, 1)
    return col, a


def body_mask(rgb):
    dark = rgb.max(axis=2) < 0.30
    lab, n = ndimage.label(dark)
    if n == 0:
        return np.zeros(dark.shape)
    sizes = ndimage.sum(dark, lab, range(1, n + 1))
    keep = lab == (1 + int(np.argmax(sizes)))
    keep = ndimage.binary_closing(keep, iterations=3)
    filled = ndimage.binary_fill_holes(keep)
    soft = ndimage.gaussian_filter(filled.astype(np.float64), 0.8)
    return soft


def isnet_mask(rgb):
    import onnxruntime as ort
    sess = ort.InferenceSession(S + '/models/isnet-general-use.onnx', providers=['CPUExecutionProvider'])
    im = Image.fromarray((rgb * 255).astype(np.uint8))
    x = np.asarray(im.resize((1024, 1024), Image.BILINEAR)).astype(np.float32) / 255.0
    x = (x - 0.5).transpose(2, 0, 1)[None].astype(np.float32)
    p = sess.run(None, {sess.get_inputs()[0].name: x})[0][0, 0]
    p = (p - p.min()) / (p.max() - p.min() + 1e-8)
    m = np.asarray(Image.fromarray((p * 255).astype(np.uint8)).resize(im.size, Image.BILINEAR)).astype(np.float64) / 255
    return np.clip((m - 0.15) / 0.7, 0, 1)


def piece(box, mode):
    x0, y0, x1, y1 = box
    rgb = img[y0:y1, x0:x1]
    if mode == 'isnet':
        return rgb, isnet_mask(rgb)
    col, a = color_to_alpha(rgb)
    b = body_mask(rgb)
    alpha = np.maximum(a, b)
    colour = b[..., None] * rgb + (1 - b[..., None]) * col
    return colour, alpha


canvas = backdrop(N) / 255.0
shadow = np.zeros((N, N))
layers = []
for p in layout['pieces']:
    rgb, a = piece(p['box'], p['mode'])
    h, w = a.shape
    s = p['width'] / w
    W, H = int(round(w * s)), int(round(h * s))
    rgb_im = Image.fromarray((rgb * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
    a_im = Image.fromarray((a * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
    cx, cy = p['at']
    X, Y = int(cx - W / 2), int(cy - H / 2)
    layers.append((np.asarray(rgb_im) / 255.0, np.asarray(a_im) / 255.0, X, Y))
    # contact shadow under solid parts only, nudged down
    solid = (np.asarray(a_im) / 255.0 > 0.9).astype(np.float64)
    sy = Y + int(H * 0.04)
    shadow[sy:sy + H, X:X + W] = np.maximum(shadow[sy:sy + H, X:X + W], solid[: max(0, min(H, N - sy))])

shadow = np.asarray(Image.fromarray((shadow * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(N / 90))) / 255.0
canvas = canvas * (1 - 0.45 * shadow[..., None])
for rgb, a, X, Y in layers:
    h, w = a.shape
    region = canvas[Y:Y + h, X:X + w]
    region[:] = region * (1 - a[..., None]) + rgb * a[..., None]

Image.fromarray((np.clip(canvas, 0, 1) * 255).astype(np.uint8)).save(out, compress_level=6)
print('ok', out)
