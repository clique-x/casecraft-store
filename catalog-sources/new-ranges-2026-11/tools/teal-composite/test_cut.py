import sys, os, numpy as np
from PIL import Image
sys.path.insert(0, sys.argv[1] + '/cx-tools')
import cutout
S = sys.argv[1]; outdir = S + '/cx-work/cut'; os.makedirs(outdir, exist_ok=True)
for spec in sys.argv[2:]:
    src, *kw = spec.split('|')
    kw = dict(k.split('=') for k in kw)
    kw = {k: float(v) if '.' in v else int(v) for k, v in kw.items()}
    rgb, a, transp = cutout.load_rgba(src)
    name = os.path.splitext(os.path.basename(src))[0]
    if not transp:
        M = np.asarray(Image.open(f'{S}/cx-work/isnet/{name}.isnet.png')).astype(float) / 255
        rgb, a = cutout.key_light_bg(rgb, M, **kw)
    cutout.save_rgba(f'{outdir}/{name}.png', rgb, a)
    print(name, 'alpha>0.5 frac %.3f' % (a > 0.5).mean())
