#!/usr/bin/env python3
"""Lift a product off its backdrop with the ISNet (DIS) salient-object model -> tightly cropped RGBA PNG.

    python3 scripts/hero-art/cutout.py MODEL.onnx IN.webp OUT.png [--pad 0.04]

MODEL is isnet-general-use.onnx (run `scripts/hero-art/fetch-model.sh` to download it; it is not
committed). Needs numpy, Pillow and onnxruntime. Runs on the CPU in a few seconds.

Clean-up after the model:
  * an alpha curve drops the faint haze the model leaves on the pedestal and firms up the edge;
  * only the largest connected subject is kept, so stray props never ride along;
  * the result is cropped to the subject with a small transparent margin.
"""
import argparse

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument("model")
ap.add_argument("src")
ap.add_argument("out")
ap.add_argument("--pad", type=float, default=0.04, help="margin around the subject, as a fraction of its height")
ap.add_argument("--lo", type=float, default=0.10, help="alpha at or below this becomes fully transparent")
ap.add_argument("--hi", type=float, default=0.90, help="alpha at or above this becomes fully opaque")
args = ap.parse_args()

img = Image.open(args.src).convert("RGB")
sess = ort.InferenceSession(args.model, providers=["CPUExecutionProvider"])

# ISNet takes a 1024x1024 RGB image scaled to 0..1 and shifted by 0.5.
x = np.asarray(img.resize((1024, 1024), Image.Resampling.LANCZOS)).astype(np.float32)
x = ((x / x.max()) - 0.5).transpose(2, 0, 1)[None]
pred = sess.run(None, {sess.get_inputs()[0].name: x})[0][0, 0]
pred = (pred - pred.min()) / (pred.max() - pred.min())
alpha = np.asarray(
    Image.fromarray((pred * 255).astype(np.uint8), "L").resize(img.size, Image.Resampling.LANCZOS)
).astype(np.float32) / 255.0

# Alpha curve: smoothstep between lo and hi.
t = np.clip((alpha - args.lo) / (args.hi - args.lo), 0.0, 1.0)
alpha = t * t * (3.0 - 2.0 * t)

# Largest connected component of the solid core (4-neighbour flood fill, no scipy needed).
core = alpha > 0.5
h, w = core.shape
labels = np.zeros((h, w), np.int32)
best, best_size, current = 0, 0, 0
for sy, sx in zip(*np.nonzero(core)):
    if labels[sy, sx]:
        continue
    current += 1
    stack, size = [(sy, sx)], 0
    labels[sy, sx] = current
    while stack:
        y, xx = stack.pop()
        size += 1
        for ny, nx in ((y - 1, xx), (y + 1, xx), (y, xx - 1), (y, xx + 1)):
            if 0 <= ny < h and 0 <= nx < w and core[ny, nx] and not labels[ny, nx]:
                labels[ny, nx] = current
                stack.append((ny, nx))
    if size > best_size:
        best, best_size = current, size
keep = Image.fromarray(((labels == best) * 255).astype(np.uint8), "L").filter(ImageFilter.MaxFilter(9))
alpha *= np.asarray(keep).astype(np.float32) / 255.0

rgba = img.convert("RGBA")
rgba.putalpha(Image.fromarray((alpha * 255).round().astype(np.uint8), "L"))

ys, xs = np.nonzero(alpha > 0.02)
pad = int((ys.max() - ys.min()) * args.pad)
box = (max(xs.min() - pad, 0), max(ys.min() - pad, 0), min(xs.max() + pad + 1, w), min(ys.max() + pad + 1, h))
rgba.crop(box).save(args.out)
print(f"{args.out}: {box[2] - box[0]}x{box[3] - box[1]} (subject {best_size} px)")
