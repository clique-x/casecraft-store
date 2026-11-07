import sys, numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, sys.argv[1] + '/cx-tools')
import stage
S = sys.argv[1]
R = S + '/ram-renders'
st = stage.Stage(R, '34')
name = 'desktop-ddr4-main'
ram = np.asarray(Image.open(f'{R}/{name}.png').convert('RGB')).astype(float)
d = ram - st.plate
ev = (d[..., 0] > 10) | (d[..., 1] < -15)
ev[1300:] = False
# module = convex quad: per row fill where evidence count large, rows above podium back edge
mm = np.zeros_like(ev)
for y in range(400, 1300):
    xs = np.nonzero(ev[y])[0]
    if len(xs) > 300 and (xs.max() - xs.min()) < 1700:
        mm[y, xs.min():xs.max() + 1] = True
alpha = mm.astype(float)
rows = np.nonzero(alpha.max(1))[0]; cols = np.nonzero(alpha.max(0))[0]
print('module rows', rows.min(), rows.max(), 'cols', cols.min(), cols.max())
unit = 13.2; h = 40 * unit * np.sin(np.radians(9.5)); cy = 1249
V = st.V
lp = stage.to_lin(st.plate / 255 / V); lr = stage.to_lin(ram / 255 / V)
k = (stage.GLOW_AMT * (0.85 + 0.25 * st.F))[..., None] * stage.CYAN_LIN
far = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(15))) < 10
far &= st.pod < 0.01
yv = (lr - lp)[..., 1][far]; kk = k[..., 1][far]
for extra in [0, 20]:
    quad = np.zeros_like(alpha)
    quad[int(cy - h / 2):int(cy + h / 2), max(int(cols.min() - extra * unit), 0):min(int(cols.max() + extra * unit), 2048)] = 1
    g = stage.upsample_tex(stage.product_glow_tex(np.maximum(alpha, quad)))
    A = np.stack([-kk * st.gen[far], kk * g[far]], 1)
    coef, *_ = np.linalg.lstsq(A, yv, rcond=None)
    for c in [coef, np.array([1.0, 1.2])]:
        res = yv - A @ c
        print('extra', extra, 'coef', c.round(3), 'rms', np.sqrt((res**2).mean()).round(5))
pred = stage.to_srgb(lp - k * st.gen[..., None] + 1.2 * k * g[..., None]) * V * 255
bd = (1 - st.pod)[..., None]
pred = pred * bd + st.plate * (1 - bd)
pred = pred * (1 - alpha[..., None]) + ram * alpha[..., None]
e = np.clip(128 + (pred - ram) * 4, 0, 255).astype(np.uint8)
Image.fromarray(e).resize((768, 768)).save(f'{S}/cx-work/val4.jpg', quality=88)
side = np.concatenate([pred, ram], 1).clip(0, 255).astype(np.uint8)
Image.fromarray(side).resize((1536, 768)).save(f'{S}/cx-work/val4-side.jpg', quality=88)
