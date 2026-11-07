"""Run the jobs: cut out, place on the plate, save. usage: python3 -I build.py SCRATCH jobs.json [filter-substring ...]"""
import hashlib, json, os, sys, time, traceback
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageDraw

S = sys.argv[1]
sys.path.insert(0, S + '/cx-tools')
import stage, cutout, composite  # noqa: E402

OUT = S + '/creatives'
WORK = S + '/cx-work'
MODEL = S + '/models/isnet-general-use.onnx'
_stages = {}
_sess = None


def get_stage(view):
    if view not in _stages:
        _stages[view] = stage.Stage(S + '/ram-renders', view)
    return _stages[view]


def isnet_mask(src):
    global _sess
    h = hashlib.sha1(src.encode()).hexdigest()[:12]
    p = f'{WORK}/isnet-cache/{h}.png'
    if os.path.exists(p):
        return np.asarray(Image.open(p)).astype(np.float64) / 255
    import onnxruntime as ort
    if _sess is None:
        _sess = ort.InferenceSession(MODEL, providers=['CPUExecutionProvider'])
    img = Image.open(src).convert('RGB')
    im = np.asarray(img.resize((1024, 1024), Image.BILINEAR)).astype(np.float32) / 255.0
    x = (im - 0.5).transpose(2, 0, 1)[None].astype(np.float32)
    pred = _sess.run(None, {_sess.get_inputs()[0].name: x})[0][0, 0]
    pred = (pred - pred.min()) / (pred.max() - pred.min() + 1e-8)
    m = Image.fromarray((pred * 255).astype(np.uint8), 'L').resize(img.size, Image.BILINEAR)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    m.save(p)
    return np.asarray(m).astype(np.float64) / 255


def keep_main_component(alpha, min_frac=0.02):
    """Drop stray specks/lines that are not connected to the product body."""
    m = alpha > 0.1
    im = Image.fromarray((m * 255).astype(np.uint8), 'L').copy()
    ys, xs = np.nonzero(alpha > 0.99)
    cy, cx = ys.mean(), xs.mean()
    k = np.argmin((ys - cy) ** 2 + (xs - cx) ** 2)
    ImageDraw.floodfill(im, (int(xs[k]), int(ys[k])), 128, thresh=0)
    lab = np.asarray(im)
    main = lab == 128
    rest = lab == 255
    if rest.sum() == 0:
        return alpha, 0
    if rest.sum() > min_frac * main.sum():
        return alpha, -int(rest.sum())   # sizeable second part: keep everything
    near = cutout._morph(main, 2, 'dilate')
    a2 = np.where(near, alpha, 0.0)
    return a2, int(rest.sum())


def remove_right_edge_line(alpha):
    """SanDisk Extreme card PNGs carry a detached 2-3 px white vertical line just right of the card,
    running the full height (an export artefact, not product). Detect and clear it."""
    m = alpha > 0.1
    xs = np.nonzero(m.any(0))[0]
    xm = xs.max()
    edge = m[:, xm - 2:xm + 1].any(1)
    gap = ~m[:, xm - 12:xm - 2].any(1)
    if (edge & gap).sum() < 30:
        return alpha, 0
    a = alpha.copy()
    before = (a[:, xm - 2:xm + 1] > 0.1).sum()
    a[:, xm - 1:xm + 1] = 0
    detached = a[:, xm - 3] < 0.5
    a[detached, xm - 2] = 0
    return a, int(before)


def do_cut(j):
    notes = []
    kw = dict(j.get('cut_kw') or {})
    if j['cut'] == 'alpha':
        rgb, a, transp = cutout.load_rgba(j['src'])
        if not transp:
            raise RuntimeError('expected a transparent source: ' + j['src'])
        a, line_px = remove_right_edge_line(a)
        if line_px:
            notes.append('Removed a detached 2-3 px white vertical line (export artefact, not part of the card) along the right edge of the official PNG.')
        a, removed = keep_main_component(a)
        rgb, nfix = cutout.defringe(rgb, a)
        if nfix > 200:
            notes.append('Edge clean-up: the official PNG has a light 1-2 px matte fringe on its outline; those edge pixels take the colour of the product just inside them (alpha unchanged), so no light halo shows on the dark stage.')
        if removed > 0:
            notes.append(f'Removed {removed} px of stray non-product pixels (a detached line/speck in the official PNG).')
    elif j['cut'] == 'key':
        rgb, a0, transp = cutout.load_rgba(j['src'])
        if transp:
            raise RuntimeError('unexpected transparent source for key: ' + j['src'])
        M = isnet_mask(j['src'])
        rgb, a = cutout.key_light_bg(rgb, M, **kw)
    elif j['cut'] == 'flood':
        rgb, a0, transp = cutout.load_rgba(j['src'])
        if transp:
            raise RuntimeError('unexpected transparent source for flood key: ' + j['src'])
        M = isnet_mask(j['src'])
        rgb, a, t = cutout.key_flood(rgb, M, **kw)
        a, removed = keep_main_component(a)
        notes.append(f'flood tolerance {t:.1f}' + (f', dropped {removed} px of detached specks' if removed > 0 else ''))
    elif j['cut'] == 'matte':
        mf = kw.pop('matte_from')
        rgb_m, _, _ = cutout.load_rgba(mf)
        M = isnet_mask(mf)
        _, a = cutout.key_light_bg(rgb_m, M, **kw)
        rgb, _, _ = cutout.load_rgba(j['src'])
        if rgb.shape[:2] != a.shape:
            raise RuntimeError('matte source not aligned')
        B = cutout.border_colour(rgb)
        aa = a[..., None]
        rgb = np.clip(np.where(aa > 0.02, B + (rgb - B) / np.maximum(aa, 0.02), rgb), 0, 255)
    else:
        raise ValueError(j['cut'])
    rot = j.get('rotate')
    if rot in (90, -90, 180):
        k = {90: 1, -90: 3, 180: 2}[rot]
        rgb = np.rot90(rgb, k).copy()
        a = np.rot90(a, k).copy()
    elif rot:
        rgb, a = composite.rotate_rgba(rgb, a, rot)
    return rgb, a, notes


def run(j):
    t = time.time()
    try:
        rgb, a, notes = do_cut(j)
        os.makedirs(f'{WORK}/cutouts', exist_ok=True)
        cutout.save_rgba(f"{WORK}/cutouts/{j['out'].replace('/', '__')}", rgb, a)
        fit = dict(j['fit'])
        img, info = composite.place(get_stage(j['view']), rgb, a, depth_px=j['depth'], cast=j.get('cast'), **fit)
        out = f"{OUT}/{j['out']}"
        os.makedirs(os.path.dirname(out), exist_ok=True)
        Image.fromarray(img).save(out, optimize=False, compress_level=6)
        info.update(notes=notes, seconds=round(time.time() - t, 1))
        return j['out'], info, None
    except Exception:
        return j['out'], None, traceback.format_exc()


if __name__ == '__main__':
    d = json.load(open(sys.argv[2]))
    flt = sys.argv[3:]
    jobs = [j for j in d['jobs'] if not flt or any(f in j['out'] for f in flt)]
    results = {}
    rpath = f'{WORK}/results.json'
    if os.path.exists(rpath):
        results = json.load(open(rpath))
    with Pool(3) as pool:
        for out, info, err in pool.imap_unordered(run, jobs):
            if err:
                print('ERROR', out, err, flush=True)
                results[out] = dict(error=err)
            else:
                print('ok', out, info['size'], info['bbox'], 'clipped' if info['clipped'] else '', info['notes'], info['seconds'], flush=True)
                results[out] = info
            json.dump(results, open(rpath, 'w'), indent=1, default=float)
