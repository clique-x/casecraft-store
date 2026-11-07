"""Automated QA on the placed images: halo (edge brighter than product just inside), floating (gap
between the base and the contact line), size/centring, capacity sizes per line."""
import json, sys, numpy as np
from PIL import Image, ImageFilter

S = sys.argv[1]
d = json.load(open(sys.argv[2]))
res = json.load(open(S + '/cx-work/results.json'))
rows = []
for j in d['jobs']:
    r = res.get(j['out'])
    if not r or 'error' in r:
        rows.append((j['out'], 'MISSING/ERROR'))
        continue
    cut = Image.open(f"{S}/cx-work/cutouts/{j['out'].replace('/', '__')}")
    arr = np.asarray(cut).astype(float)
    a = arr[..., 3] / 255
    lum = (arr[..., :3] @ [0.299, 0.587, 0.114])
    edge = (a > 0.08) & (a < 0.85)
    core = a > 0.98
    # luminance of the nearest opaque product: max-filter of core-lum within 4 px, min-filter too
    L = Image.fromarray(np.where(core, lum, 0).astype(np.uint8))
    near_max = np.asarray(L.filter(ImageFilter.MaxFilter(9))).astype(float)
    halo = edge & (lum > near_max + 25) & (lum > 170)
    frac = halo.sum() / max(edge.sum(), 1)
    contact = 1249 if j['view'] == '34' else 1268
    fp = r.get('footprint_y', [r['lowest_y'], r['lowest_y']])
    gap = contact - (fp[0] + fp[1]) / 2
    clr = r.get('min_clearance_from_podium_back_edge', float('nan'))
    cx = (r['bbox'][0] + r['bbox'][2]) / 2
    rows.append((j['out'], f"halo {frac:.3f}  mid_gap {gap:+.1f}  clear {clr}  cx {cx:.0f}  size {r['size'][0]}x{r['size'][1]}  scale {r['scale']}"))
for o, s in rows:
    print(o.ljust(70), s)
