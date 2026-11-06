#!/usr/bin/env python3
"""Removes "• Shot in our Haridwar shop" from the covers campaign image.

The picture is generated, not photographed in the shop, so the line would not be true.
"Cut for your exact phone" and the logo stay.

    python3 scripts/promo-art/clean-covers.py IN.png OUT.png

Needs numpy and Pillow. Coordinates are for the 1254 x 1254 image of 6 Nov 2026.
"""
import sys

import numpy as np
from PIL import Image

Y0, Y1, X0, X1 = 1155, 1212, 410, 820  # the line's band; "phone" ends at x = 391

src, dst = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert("RGB")).astype(float)
if im.shape[:2] != (1254, 1254):
    sys.exit(f"expected a 1254 x 1254 image, got {im.shape[1]} x {im.shape[0]}")
reg = im[Y0:Y1, X0:X1]

# The text is teal (more blue than red); the cream and the stone's shadow are warm.
mask = (reg[..., 2] - reg[..., 0]) > -15
for _ in range(3):  # grow by 3 px to take the anti-aliased edges
    mask = mask | np.roll(mask, 1, 0) | np.roll(mask, -1, 0) | np.roll(mask, 1, 1) | np.roll(mask, -1, 1)
mask[[0, -1], :] = False
mask[:, [0, -1]] = False

fill = reg.copy()
for x in range(fill.shape[1]):  # start from a vertical blend of the clean pixels above and below
    col = mask[:, x]
    if col.any():
        clean = np.where(~col)[0]
        for c in range(3):
            fill[col, x, c] = np.interp(np.where(col)[0], clean, fill[clean, x, c])
for _ in range(1500):  # then let each filled pixel settle to the mean of its neighbours
    avg = (np.roll(fill, 1, 0) + np.roll(fill, -1, 0) + np.roll(fill, 1, 1) + np.roll(fill, -1, 1)) / 4
    fill[mask] = avg[mask]

im[Y0:Y1, X0:X1] = fill
Image.fromarray(im.clip(0, 255).round().astype("uint8")).save(dst)
print(f"{dst}: {int(mask.sum())} px refilled")
