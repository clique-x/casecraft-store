"""Cut-outs for official product photos.

- transparent sources: the source alpha is used as is.
- white / light-grey sources: soft key. A trimap comes from an ISNet saliency mask (core = surely
  product, far = surely background, which also drops baked-in cast shadows), and the edge band gets
  a colour-difference alpha (distance from the backdrop colour relative to the nearby product colour),
  falling back to the network's soft mask only where the product edge has almost no contrast with
  the backdrop. Edge colours are decontaminated (the backdrop's share is removed), so no white halo.
"""
import numpy as np
from PIL import Image, ImageFilter


def _morph(mask, r, op):
    if r <= 0:
        return mask.copy()
    im = Image.fromarray((mask * 255).astype(np.uint8))
    f = ImageFilter.MaxFilter if op == 'dilate' else ImageFilter.MinFilter
    # split big radii into passes of size <= 7
    left = r
    while left > 0:
        step = min(left, 3)
        im = im.filter(f(2 * step + 1))
        left -= step
    return np.asarray(im) > 127


def border_colour(rgb, w=4):
    b = np.concatenate([rgb[:w].reshape(-1, 3), rgb[-w:].reshape(-1, 3), rgb[:, :w].reshape(-1, 3), rgb[:, -w:].reshape(-1, 3)])
    return np.median(b, axis=0)


def load_rgba(path):
    im = Image.open(path)
    if im.mode == 'P':
        im = im.convert('RGBA')
    if im.mode == 'RGBA':
        a = np.asarray(im).astype(np.float64)
        if a[..., 3].min() < 250:  # really transparent
            return a[..., :3], a[..., 3] / 255.0, True
        return a[..., :3], None, False
    rgb = np.asarray(im.convert('RGB')).astype(np.float64)
    return rgb, None, False


def key_light_bg(rgb, M, r_in=4, r_out=3, t_bg=10.0, dref_floor=30.0, rank_size=9, bg=None,
                 trust_net_below=55.0):
    """rgb float HxWx3 (0-255), M float HxW (0-1) saliency. Returns (rgb_decontaminated, alpha)."""
    B = border_colour(rgb) if bg is None else np.asarray(bg, float)
    D = np.abs(rgb - B).max(-1)
    Dimg = Image.fromarray(np.clip(D, 0, 255).astype(np.uint8))
    n = rank_size * rank_size
    Dref = np.asarray(Dimg.filter(ImageFilter.RankFilter(rank_size, int(n * 0.8)))).astype(np.float64)
    a_col = np.clip(D / np.maximum(Dref, dref_floor), 0, 1)
    fg = M > 0.5
    core = _morph(fg, r_in, 'erode')
    near = _morph(fg, r_out, 'dilate')
    c = np.clip((Dref - 15.0) / (trust_net_below - 15.0), 0, 1)
    a_band = a_col * c + np.clip(M, 0, 1) * (1 - c)
    alpha = np.where(core, 1.0, np.where(near, a_band, 0.0))
    # near-white pixels outside the network's silhouette are background (holes, gaps)
    alpha = np.where((~fg) & (D < t_bg), 0.0, alpha)
    a = alpha[..., None]
    P = np.where(a > 0.02, B + (rgb - B) / np.maximum(a, 0.02), rgb)
    return np.clip(P, 0, 255), alpha


def crop_to_alpha(rgb, alpha, thr=0.02, pad=2):
    ys, xs = np.nonzero(alpha > thr)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, alpha.shape[0])
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, alpha.shape[1])
    return rgb[y0:y1, x0:x1], alpha[y0:y1, x0:x1], (x0, y0)


def save_rgba(path, rgb, alpha):
    arr = np.dstack([np.clip(rgb, 0, 255), np.clip(alpha * 255, 0, 255)]).round().astype(np.uint8)
    Image.fromarray(arr, 'RGBA').save(path)


def _flood_from_border(cand):
    """Pixels of the boolean mask `cand` connected to the image border."""
    im = Image.fromarray((cand * 255).astype(np.uint8), 'L').copy()
    from PIL import ImageDraw
    h, w = cand.shape
    border = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    px = im.load()
    for (x, y) in border:
        if px[x, y] == 255:
            ImageDraw.floodfill(im, (x, y), 128, thresh=0)
    return np.asarray(im) == 128


def key_flood(rgb, M=None, t_flood=4.0, band_r=2, dref_floor=8.0, rank_size=7, envelope_r=None, bg=None,
              extra_bg=None, holes=None, outer=True):
    """Background = pixels connected to the border through near-backdrop colour (tight tolerance), so
    enclosed white areas (labels, white box faces) stay product. Optional ISNet envelope drops far-off
    non-white junk. Soft edge only in a thin band next to the background."""
    B = border_colour(rgb) if bg is None else np.asarray(bg, float)
    D = np.abs(rgb - B).max(-1)
    bd = np.concatenate([D[:3].ravel(), D[-3:].ravel(), D[:, :3].ravel(), D[:, -3:].ravel()])
    t = max(t_flood, float(np.percentile(bd, 99.5)) + 1.0)
    cand = D <= t
    if extra_bg == 'navy':  # flat navy drop-shadow graphic behind the drive (not product)
        r_, g_, b_ = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        cand |= (r_ < 40) & (b_ > 80) & (b_ - r_ > 55) & (g_ < b_)
        tt = r_ / 255.0  # blends of that navy (0,62,100) with the white page
        cand |= (np.abs(g_ - (62 + 193 * tt)) < 22) & (np.abs(b_ - (100 + 155 * tt)) < 22) & (b_ > g_) & (g_ > r_)
    if extra_bg == 'blueshadow':  # soft blue-grey drop shadow drawn under the drive (not product)
        r_, g_, b_ = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        cand |= (b_ - r_ > 25) & (r_ > 95) & (g_ > r_)
    R = _flood_from_border(cand)
    for (x0, y0, x1, y1) in (holes or []):  # enclosed see-through holes (hang holes) in given boxes
        sub = cand[y0:y1, x0:x1] & ~R[y0:y1, x0:x1]
        R[y0:y1, x0:x1] |= sub
    P = ~R
    if M is not None and envelope_r:
        env = _morph(M > 0.3, envelope_r, 'dilate')
        P &= env
    Dimg = Image.fromarray(np.clip(D, 0, 255).astype(np.uint8))
    n = rank_size * rank_size
    Dref = np.asarray(Dimg.filter(ImageFilter.RankFilter(rank_size, int(n * 0.8)))).astype(np.float64)
    a_col = np.clip(D / np.maximum(Dref, dref_floor), 0, 1)
    bgm = ~P
    band = _morph(bgm, band_r, 'dilate') & P
    alpha = np.where(P, np.where(band, a_col, 1.0), 0.0)
    # 1 px outer feather: background pixels touching the product keep their colour-difference alpha
    if outer:
        o = _morph(P, 1, 'dilate') & bgm
        alpha = np.where(o, np.minimum(a_col, 0.5), alpha)
    a = alpha[..., None]
    Pc = np.where(a > 0.02, B + (rgb - B) / np.maximum(a, 0.02), rgb)
    return np.clip(Pc, 0, 255), alpha, t


def defringe(rgb, alpha, lift=30.0, steps=3):
    """Halo removal for official transparent PNGs whose outline pixels carry a white export matte.
    Only outline pixels (semi-transparent, or opaque but touching transparency) that are LIGHTER than
    the product just inside them are touched: semi-transparent ones get the white matte's share
    removed, (C - (1-a)*255) / a; any that are still clearly lighter, and opaque near-white outline
    pixels, take the inner colour. Alpha is never changed. Returns (rgb, n_changed)."""
    ys, xs = np.nonzero(alpha > 0.003)
    y0, y1 = max(ys.min() - 4, 0), min(ys.max() + 5, alpha.shape[0])
    x0, x1 = max(xs.min() - 4, 0), min(xs.max() + 5, alpha.shape[1])
    a = alpha[y0:y1, x0:x1]
    c = rgb[y0:y1, x0:x1]
    low = a < 0.5
    near_low = _morph(low, 1, 'dilate')
    E = (a > 0.003) & ((a < 0.98) | near_low)
    inner = (a >= 0.98) & ~E
    ref = np.where(inner[..., None], c, 0.0)
    have = inner.copy()
    for _ in range(steps):
        acc = np.zeros_like(c)
        cnt = np.zeros(a.shape)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            hv = np.roll(np.roll(have, dy, 0), dx, 1)
            acc += np.roll(np.roll(ref, dy, 0), dx, 1) * hv[..., None]
            cnt += hv
        new = (~have) & (cnt > 0)
        ref[new] = acc[new] / cnt[new][:, None]
        have |= new
    W = np.array([0.299, 0.587, 0.114])
    lum = c @ W
    rl = ref @ W
    out = c.copy()
    semi = E & have & (a < 0.98) & (lum > rl + 15)
    aa = np.maximum(a, 0.05)[..., None]
    dec = np.clip((c - (1 - aa) * 255.0) / aa, 0, 255)
    out[semi] = dec[semi]
    still = semi & ((out @ W) > rl + lift)
    out[still] = ref[still]
    whiteish = (c.min(-1) > 170) & (c.max(-1) - c.min(-1) < 32)
    opq = E & have & (a >= 0.98) & whiteish & (lum > rl + lift)
    out[opq] = ref[opq]
    res = rgb.copy()
    res[y0:y1, x0:x1] = out
    return res, int(semi.sum() + opq.sum())
