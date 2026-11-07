import sys, numpy as np
from PIL import Image
for f in sys.argv[1:]:
    im = Image.open(f)
    if im.mode != 'RGBA': im = im.convert('RGBA')
    a = np.asarray(im)[..., 3].astype(float) / 255
    rgb = np.asarray(im)[..., :3].astype(float)
    semi = (a > 0.03) & (a < 0.97)
    opaque = a >= 0.97
    ys, xs = np.nonzero(a > 0.03)
    # perimeter estimate of opaque
    per = (np.abs(np.diff(opaque.astype(int), axis=0)).sum() + np.abs(np.diff(opaque.astype(int), axis=1)).sum())
    dark_semi = semi & (rgb.max(-1) < 60)
    print(f.split('/')[-1][:48].ljust(48), 'bbox', xs.min(), ys.min(), xs.max(), ys.max(), 'semi/perim %.2f' % (semi.sum() / max(per, 1)), 'darksemi', dark_semi.sum(), 'opaque frac %.3f' % opaque.mean())
