import sys, numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, sys.argv[1] + '/cx-tools')
import stage
S = sys.argv[1]
R = S + '/ram-renders'
for view, name in [('34', 'desktop-ddr4-main'), ('front', 'laptop-ddr4-flat'), ('front', 'desktop-ddr3-flat')]:
    st = stage.Stage(R, view)
    ram = np.asarray(Image.open(f'{R}/{name}.png').convert('RGB')).astype(float)
    d = ram - st.plate
    m = (d[..., 0] > 8) | (d[..., 1] < -8) | (d[..., 2] < -8)
    m &= np.arange(stage.N)[:, None] < st.contact[1] + 40
    mm = np.zeros_like(m)
    for y in range(stage.N):
        xs = np.nonzero(m[y])[0]
        if len(xs) > 20:
            mm[y, xs.min():xs.max() + 1] = True
    alpha = np.asarray(Image.fromarray((mm * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))).astype(float) / 255
    cols = np.nonzero(alpha.max(0) > 0.5)[0]
    x0, x1 = cols.min(), cols.max()
    print(view, name, 'module x', x0, x1)
    unit = stage.PLATES[view]['unit']
    elev = {'front': 4.0, '34': 9.5}[view]
    h = 40 * unit * np.sin(np.radians(elev))
    cy = st.contact[1]
    quad = np.zeros_like(alpha)
    qx0 = int((x0 + x1) / 2 - (x1 - x0) / 2 - 20 * unit); qx1 = int((x0 + x1) / 2 + (x1 - x0) / 2 + 20 * unit)
    quad[int(cy - h / 2):int(cy + h / 2), max(qx0, 0):min(qx1, stage.N)] = 1
    V = st.V
    lp = stage.to_lin(st.plate / 255 / V); lr = stage.to_lin(ram / 255 / V)
    k = (stage.GLOW_AMT * (0.85 + 0.25 * st.F))[..., None] * stage.CYAN_LIN
    gp = stage.upsample_tex(stage.product_glow_tex(alpha))
    gq = stage.upsample_tex(stage.product_glow_tex(np.maximum(alpha, quad)))
    far = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(15))) < 10
    far &= st.pod < 0.01
    yv = (lr - lp)[..., 1][far]  # G channel
    kk = k[..., 1][far]
    for lab, g in [('alpha only', gp), ('alpha+quad', gq)]:
        A = np.stack([-kk * st.gen[far], kk * g[far]], 1)
        coef, *_ = np.linalg.lstsq(A, yv, rcond=None)
        res = yv - A @ coef
        res1 = yv - A @ np.array([1.0, 1.0])
        print('  ', lab, 'fit coef gen,prod =', coef.round(3), 'rms fit', np.sqrt((res**2).mean()).round(5), 'rms at (1,1)', np.sqrt((res1**2).mean()).round(5))
