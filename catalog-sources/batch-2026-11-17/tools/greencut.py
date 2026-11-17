"""Cut a product off the owner's green paper backdrop and place it on the GadgetsHub teal stage.
usage: python3 -I greencut.py SCRATCH jobs.json [filter]
job: {src, out, view: front|34, rotate: deg (optional), fit: {long_px|height_px, max_h, max_w}, depth, cast, crop: [x0,y0,x1,y1] (optional, fractions)}"""
import json, os, sys
import numpy as np
from PIL import Image, ImageOps, ImageFilter

S = sys.argv[1]
sys.path.insert(0, S + '/cx-tools')
import stage, cutout, composite  # noqa: E402

_st = {}
def get_stage(v):
    if v not in _st:
        _st[v] = stage.Stage(S + '/ram-renders', v)
    return _st[v]

def green_cut(path, crop=None, lo=12.0, hi=40.0, maxdim=2600, hole_px=1500):
    im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    if crop:
        W, H = im.size
        im = im.crop((int(crop[0] * W), int(crop[1] * H), int(crop[2] * W), int(crop[3] * H)))
    im.thumbnail((maxdim, maxdim), Image.LANCZOS)
    rgb = np.asarray(im).astype(np.float64)
    R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    gness = G - np.maximum(R, B)                      # how green a pixel is, any brightness
    cand = gness > lo
    bg = cutout._flood_from_border(cand)              # green connected to the border = backdrop
    # enclosed backdrop seen through holes (hang tabs, handles): large, strongly green regions
    ref = float(np.median(gness[bg])) if bg.any() else 60.0
    strong = (gness > max(lo, 0.55 * ref)) & ~bg
    if strong.any():
        from scipy import ndimage
        lab, n = ndimage.label(strong)
        if n:
            sizes = ndimage.sum(np.ones_like(gness), lab, range(1, n + 1))
            means = ndimage.mean(gness, lab, range(1, n + 1))
            keep = [i + 1 for i in range(n) if sizes[i] > hole_px and means[i] > 0.7 * ref]
            if keep:
                bg = bg | np.isin(lab, keep)
    P = ~bg
    # fill pin-holes inside the product, drop specks outside it
    P = cutout._morph(cutout._morph(P, 2, 'dilate'), 2, 'erode')
    lab = Image.fromarray((P * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5))
    P = np.asarray(lab) > 127
    # soft edge in a thin band: alpha from greenness
    band = cutout._morph(~P, 2, 'dilate') & cutout._morph(P, 2, 'dilate')
    a_col = 1.0 - np.clip((gness - lo) / (hi - lo), 0, 1)
    alpha = np.where(band, a_col, P.astype(float))
    # despill: edge pixels lose their green cast
    edge = band | (cutout._morph(~P, 4, 'dilate') & P)
    G2 = np.where(edge, np.minimum(G, np.maximum(R, B) + 6), G)
    rgb = np.stack([R, G2, B], -1)
    return rgb, alpha

def main():
    jobs = json.load(open(sys.argv[2]))
    flt = sys.argv[3:]
    for j in jobs:
        if flt and not any(f in j['out'] for f in flt):
            continue
        rgb, a = green_cut(j['src'], j.get('crop'), **j.get('cut_kw', {}))
        rot = j.get('rotate')
        if j.get('deskew'):
            # long axis of the product to horizontal (deskew='h') or vertical ('v'), then the job's extra turn
            ys, xs = np.nonzero(a > 0.5)
            c = np.cov(np.stack([xs - xs.mean(), ys - ys.mean()]))
            w, v = np.linalg.eigh(c)
            ang = np.degrees(np.arctan2(v[1, 1], v[0, 1]))   # long axis angle, image coords (y down)
            target = 0.0 if j['deskew'] == 'h' else 90.0
            turn = ang - target
            turn = (turn + 90) % 180 - 90
            rgb, a = composite.rotate_rgba(rgb, a, turn)
            print('  deskew', j['out'], round(turn, 1), flush=True)
        if rot in (90, -90, 180):
            k = {90: 1, -90: 3, 180: 2}[rot]; rgb = np.rot90(rgb, k).copy(); a = np.rot90(a, k).copy()
        elif rot:
            rgb, a = composite.rotate_rgba(rgb, a, rot)
        a, _ = keep_main(a)
        os.makedirs(S + '/batch17/cut', exist_ok=True)
        cutout.save_rgba(S + '/batch17/cut/' + j['out'].replace('/', '__'), rgb, a)
        img, info = composite.place(get_stage(j.get('view', 'front')), rgb, a, depth_px=j.get('depth', 10), cast=j.get('cast', dict(blur=12, opacity=0.32)), **j['fit'])
        out = S + '/batch17/out/' + j['out']
        os.makedirs(os.path.dirname(out), exist_ok=True)
        Image.fromarray(img).save(out, compress_level=6)
        print('ok', j['out'], info.get('size'), info.get('bbox'), 'clipped' if info.get('clipped') else '', flush=True)

def keep_main(alpha):
    m = alpha > 0.5
    im = Image.fromarray((m * 255).astype(np.uint8), 'L').copy()
    from PIL import ImageDraw
    ys, xs = np.nonzero(m)
    cy, cx = ys.mean(), xs.mean()
    k = np.argmin((ys - cy) ** 2 + (xs - cx) ** 2)
    ImageDraw.floodfill(im, (int(xs[k]), int(ys[k])), 128, thresh=0)
    main = np.asarray(im) == 128
    near = cutout._morph(main, 3, 'dilate')
    return np.where(near, alpha, 0.0), int((m & ~main).sum())

if __name__ == '__main__':
    main()
