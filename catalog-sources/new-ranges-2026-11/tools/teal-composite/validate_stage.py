import sys, numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, sys.argv[1] + '/cx-tools')
import stage
S = sys.argv[1]
R = S + '/ram-renders'
for view, name in [('34', 'desktop-ddr4-main'), ('front', 'laptop-ddr4-flat')]:
    st = stage.Stage(R, view)
    ram = np.asarray(Image.open(f'{R}/{name}.png').convert('RGB')).astype(float)
    d = ram - st.plate
    m = (d[..., 0] > 8) | (d[..., 1] < -8) | (d[..., 2] < -8)
    m &= np.arange(stage.N)[:, None] < st.contact[1] + 40
    # convex row fill
    mm = np.zeros_like(m)
    for y in range(stage.N):
        xs = np.nonzero(m[y])[0]
        if len(xs) > 20:
            mm[y, xs.min():xs.max() + 1] = True
    im = Image.fromarray((mm * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))
    alpha = np.asarray(im).astype(float) / 255
    for remove in (True, False):
        glow = stage.upsample_tex(stage.product_glow_tex(alpha))
        pred = st.backdrop_with_glow(glow, remove_generic=remove)
        far = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(15))) < 10
        far &= st.pod < 0.01
        err = (pred - ram)[far]
        print(view, name, 'remove_generic', remove, 'MAE', np.abs(err).mean(0).round(2), 'bias', err.mean(0).round(2), 'p99', np.percentile(np.abs(err), 99, axis=0).round(1))
        if remove:
            e = np.clip(128 + (pred - ram) * 4, 0, 255).astype(np.uint8)
            Image.fromarray(e).resize((768, 768)).save(f'{S}/cx-work/val-{name}.jpg', quality=88)
