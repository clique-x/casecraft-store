#!/usr/bin/env python3
"""Green-screen cutout: a flat photo of a case on a green sheet -> transparent, tightly cropped WebP/PNG.

Runs anywhere Python 3 with numpy and Pillow runs (the Swift tool next to it needs macOS).

    python3 greenscreen.py back.jpg out.webp
    python3 greenscreen.py back.jpg out.webp --frost 62,70,74,0.62     # frosted or smoked back panel
    python3 greenscreen.py back.jpg out.webp --film                    # remove a red peel-off film tab

Save as .webp for the storefront (`apps/storefront/public/products/photos/<id>.webp`), then run
`pnpm photos` there. Check the result on a dark and a light background before using it.

Method.

Photo of a case lying on a green sheet -> RGBA, tightly cropped, background transparent.
No scipy/opencv: numpy + Pillow only.

alpha comes from a brightness-independent green ratio, so soft shadows on the sheet key out as
well as the lit parts. Clear and frosted plastic show the sheet through them, so they come out
semi-transparent, which is how the existing clear-case cutouts in the store look.
"""
from collections import deque

import numpy as np
from PIL import Image, ImageFilter, ImageOps

WORK = 1800  # long edge of the working image
OUT_MAX_H = 1600  # long edge of the saved cutout


def _components(mask):
    """Connected components (4-neighbour) of a small boolean mask -> list of (area, label array)."""
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32)
    sizes = [0]
    cur = 0
    for y in range(h):
        for x in range(w):
            if mask[y, x] and lab[y, x] == 0:
                cur += 1
                q = deque([(y, x)])
                lab[y, x] = cur
                n = 0
                while q:
                    cy, cx = q.popleft()
                    n += 1
                    for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and lab[ny, nx] == 0:
                            lab[ny, nx] = cur
                            q.append((ny, nx))
                sizes.append(n)
    return sizes, lab


def _box(a, k):
    """Mean over a (2k+1) window along both axes, edge-padded (cumulative sums)."""
    for ax in (0, 1):
        pad = [(0, 0), (0, 0)]
        pad[ax] = (k + 1, k)
        c = np.cumsum(np.pad(a, pad, mode='edge'), axis=ax, dtype=np.float64)
        n = a.shape[ax]
        hi = np.take(c, np.arange(2 * k + 1, 2 * k + 1 + n), axis=ax)
        lo = np.take(c, np.arange(0, n), axis=ax)
        a = ((hi - lo) / (2 * k + 1)).astype(np.float32)
    return a


def _smooth(a, k=2, passes=3):
    for _ in range(passes):
        a = _box(a, k)
    return a


def key_back(path, lo=0.28, hi=0.72, gamma=0.85, frost=None, film=False, dark_rule=True, warm_frost=False, film_mirror=True):
    """frost=(rgb, floor): tint and minimum opacity for the frosted back panel (below the camera zone).
    film=True removes the red peel-off protective film tab some clear cases ship with."""
    im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    s = WORK / max(im.size)
    if s < 1:
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    dn = (g - np.maximum(r, b)) / np.maximum(g, 1.0)  # ~0.3-0.5 on the sheet, <= 0 on most cases
    # JPEG blocks and sensor noise make frosted plastic posterise; smooth the ratio a little first
    dn_s = _smooth(dn.astype(np.float32), 2, 3)
    dn = np.where(np.abs(dn_s - dn) > 0.25, dn, dn_s)  # but keep hard edges

    h, w = dn.shape
    m = max(8, int(min(h, w) * 0.04))
    border = np.concatenate([dn[:m].ravel(), dn[-m:].ravel(), dn[:, :m].ravel(), dn[:, -m:].ravel()])
    d0 = float(np.median(border))
    if d0 < 0.12:
        raise ValueError(f'{path}: background is not green enough (d0={d0:.3f})')

    alpha = 1.0 - np.clip((dn - lo * d0) / ((hi - lo) * d0), 0.0, 1.0)
    alpha = alpha ** gamma
    if dark_rule:
        # glossy black plastic mirrors the green sheet; a dark pixel is never the (bright) sheet itself
        alpha = np.where((g < 72) & (np.maximum(r, b) < 90) & (dn < 0.8 * d0), 1.0, alpha)
    if film:
        red = (r > 135) & (r - g > 60) & (r - b > 45)
        redimg = Image.fromarray(red.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(13))
        redmask = np.asarray(redimg) > 0
        if red.sum() > 200:
            # the label is a near-white rectangle with red print: take every near-white blob that touches the red
            lum_min = np.minimum(np.minimum(r, g), b)
            lum_rng = np.maximum(np.maximum(r, g), b) - lum_min
            white = ((lum_min > 185) & (lum_rng < 50)).astype(np.uint8) * 255
            sw = np.asarray(Image.fromarray(white).resize((w // 4, h // 4), Image.BILINEAR)) > 127
            near_red = np.asarray(Image.fromarray(redmask.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(41)).resize((w // 4, h // 4), Image.NEAREST)) > 0
            wsizes, wlab = _components(sw)
            hit = np.zeros_like(sw)
            for i in range(1, len(wsizes)):
                comp = wlab == i
                if (comp & near_red).any() and wsizes[i] < 0.06 * sw.size:
                    hit |= comp
            hitimg = Image.fromarray(hit.astype(np.uint8) * 255).resize((w, h), Image.NEAREST).filter(ImageFilter.MaxFilter(13))
            redmask |= np.asarray(hitimg) > 0
        # The film lay on part of the MagSafe ring. Find the ring (largest solid shape in the middle of the case,
        # away from the frame and the camera), mirror it about its own centre, and fill only within its band.
        alpha0 = np.where(redmask, 0.0, alpha)
        solid = alpha0 > 0.85
        rows = np.nonzero(solid.any(axis=1))[0]
        cols = np.nonzero(solid.any(axis=0))[0]
        y0, y1, x0, x1 = rows.min(), rows.max(), cols.min(), cols.max()
        band = np.zeros_like(solid)
        band[y0 + int(0.25 * (y1 - y0)):y0 + int(0.78 * (y1 - y0)), x0 + int(0.14 * (x1 - x0)):x0 + int(0.86 * (x1 - x0))] = True
        sm = np.asarray(Image.fromarray(((solid & band) * 255).astype(np.uint8)).resize((w // 4, h // 4), Image.NEAREST)) > 0
        rsz, rlab = _components(sm)
        alpha_new = alpha0
        if film_mirror and len(rsz) > 1:
            big = 1 + int(np.argmax(rsz[1:]))
            ry, rx = np.nonzero(rlab == big)
            # mirror about the case's centre line (the film may hide one side of the ring, so the ring's own
            # extent is not reliable); the radius comes from the side of the ring the film did not cover
            rcx = 0.5 * (x0 + x1)
            rr = max(rcx - 4.0 * rx.min(), 4.0 * rx.max() + 4 - rcx)
            rcy = 4.0 * ry.min() + rr  # top of the ring + radius (the C may be open at the bottom)
            yy, xx = np.nonzero(redmask)
            mx = np.clip(np.rint(2 * rcx - xx).astype(int), 0, w - 1)
            dist = np.hypot(xx - rcx, yy - rcy)
            ok = (~redmask[yy, mx]) & (dist > 0.62 * rr) & (dist < 1.12 * rr)
            alpha_new = alpha0.copy()
            alpha_new[yy[ok], xx[ok]] = alpha[yy[ok], mx[ok]]
            for ch in (r, g, b):
                ch[yy[ok], xx[ok]] = ch[yy[ok], mx[ok]]
        alpha = alpha_new

    # keep the case and anything attached to it; drop dust and the sheet's own marks
    small = Image.fromarray((alpha > 0.35).astype(np.uint8) * 255).resize((w // 4, h // 4), Image.BILINEAR)
    sm = np.asarray(small) > 127
    sizes, lab = _components(sm)
    if len(sizes) < 2:
        raise ValueError(f'{path}: nothing found')
    top = max(sizes[1:])
    keep = np.zeros_like(sm)
    for i, n in enumerate(sizes):
        if i and n >= 0.05 * top:
            keep |= lab == i
    keepimg = Image.fromarray(keep.astype(np.uint8) * 255).resize((w, h), Image.NEAREST).filter(ImageFilter.MaxFilter(15))
    alpha *= np.asarray(keepimg).astype(np.float32) / 255.0

    # Dark pixels INSIDE the case outline are plastic (a glossy black ring mirrors the green sheet), not sheet:
    # the sheet seen through clear plastic stays bright.
    from PIL import ImageDraw
    gs = float(np.median(np.concatenate([g[:m].ravel(), g[-m:].ravel(), g[:, :m].ravel(), g[:, -m:].ravel()])))
    solid0 = (alpha > 0.2).astype(np.uint8) * 255
    sm0 = Image.fromarray(solid0).resize((w // 4, h // 4), Image.NEAREST)
    ImageDraw.floodfill(sm0, (0, 0), 128, thresh=0)
    inside = np.asarray(Image.fromarray((np.asarray(sm0) != 128).astype(np.uint8) * 255).resize((w, h), Image.NEAREST)) > 0
    dark_in = inside & (_smooth(g, 3, 2) < 0.52 * gs) & (np.maximum(r, b) < 0.45 * gs)
    alpha = np.where(dark_in, 1.0, alpha)

    if frost is not None:
        tint, floor = frost
        solid = (alpha > 0.2).astype(np.uint8) * 255
        sm2 = Image.fromarray(solid).resize((w // 4, h // 4), Image.NEAREST)
        ImageDraw.floodfill(sm2, (0, 0), 128, thresh=0)  # the sheet around the case
        sil = (np.asarray(sm2) != 128)  # the case with its enclosed holes filled
        ys, xs = np.nonzero(sil)
        top, bot = ys.min(), ys.max()
        zone = top + int(0.30 * (bot - top))  # the camera opening lives above this line
        panel = sil.copy()
        panel[:zone] = False
        pimg = Image.fromarray(panel.astype(np.uint8) * 255).resize((w, h), Image.NEAREST)
        pimg = pimg.filter(ImageFilter.MinFilter(41))  # stay clear of the rim
        panel_full = (np.asarray(pimg) > 0).astype(np.float32)
        panel_full = np.asarray(Image.fromarray((panel_full * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255.0
        tint_rgb = np.array(tint, np.float32)
        # transparent bits of the panel take the frost tint; the ring and printed parts keep their own colour
        hard = np.clip((alpha - 0.95) / 0.04, 0.0, 1.0)  # ring and frame keep their own colour
        mix_src = 1.0 - hard
        if warm_frost:  # orange tinted panel: only saturated orange is ring; olive in between is the sheet showing through
            ring = ((r > 190) & (g < 0.62 * r) & (b < 0.45 * r)).astype(np.uint8) * 255
            ring = np.asarray(Image.fromarray(ring).filter(ImageFilter.MaxFilter(5))).astype(np.float32) / 255.0
            mix_src = 1.0 - ring
        if max(tint) < 90:  # smoked panel: only the near-black ring keeps its own colour, the rest is one even tint
            ringdark = (np.maximum(np.maximum(r, g), b) < 34).astype(np.uint8) * 255
            ringdark = np.asarray(Image.fromarray(ringdark).filter(ImageFilter.MaxFilter(5))).astype(np.float32) / 255.0
            mix_src = 1.0 - ringdark
        mix = panel_full * mix_src
        r = r * (1 - mix) + tint_rgb[0] * mix
        g = g * (1 - mix) + tint_rgb[1] * mix
        b = b * (1 - mix) + tint_rgb[2] * mix
        alpha = np.maximum(alpha, panel_full * floor)

    # despill: green can never exceed the larger of red and blue on a real foreground pixel
    gg = np.minimum(g, np.maximum(r, b) + 4.0)
    part = alpha < 0.97
    gg = np.where(part, np.minimum(gg, 0.5 * (r + b) + 6.0), gg)  # sheet bleeding into the colour of translucent edges
    rgb = np.stack([r, gg, b], -1)

    out = np.dstack([rgb, alpha * 255.0]).clip(0, 255).astype(np.uint8)
    img = Image.fromarray(out, 'RGBA')
    bbox = img.getchannel('A').point(lambda v: 255 if v > 12 else 0).getbbox()
    pad = int(0.015 * max(img.size))
    bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(w, bbox[2] + pad), min(h, bbox[3] + pad))
    img = img.crop(bbox)
    if max(img.size) > OUT_MAX_H:
        k = OUT_MAX_H / max(img.size)
        img = img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS)
    return img, d0


def _main():
    import argparse

    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('photo')
    ap.add_argument('out')
    ap.add_argument('--frost', help='R,G,B,floor: tint and minimum opacity of a frosted back panel, e.g. 62,70,74,0.62')
    ap.add_argument('--film', action='store_true', help='remove a red protective-film tab')
    ap.add_argument('--no-film-mirror', action='store_true', help='with --film: do not rebuild the ring under the tab from the mirrored side')
    a = ap.parse_args()
    frost = None
    if a.frost:
        r, g, b, f = a.frost.split(',')
        frost = ((int(r), int(g), int(b)), float(f))
    img, d0 = key_back(a.photo, frost=frost, film=a.film, film_mirror=not a.no_film_mirror)
    if a.out.lower().endswith('.webp'):
        img.save(a.out, 'WEBP', quality=90, alpha_quality=95, method=4)
    else:
        img.save(a.out)
    print(f'{a.out}: {img.width}x{img.height} (sheet green ratio {d0:.2f})')


if __name__ == '__main__':
    _main()
