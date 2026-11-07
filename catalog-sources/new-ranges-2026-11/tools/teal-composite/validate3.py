import sys, numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, sys.argv[1] + '/cx-tools')
import stage
S = sys.argv[1]
R = S + '/ram-renders'
out = []
for name, hmm in [('laptop-ddr4-flat', 30.0 / 69.6), ('desktop-ddr3-flat', 30.0 / 133.35), ('laptop-ddr3l-flat', 30.0 / 67.6)]:
    st = stage.Stage(R, 'front')
    ram = np.asarray(Image.open(f'{R}/{name}.png').convert('RGB')).astype(float)
    # find module top edge from the image: column 1024, first row where R diff > 6 above contact
    d = ram - st.plate
    x0, x1 = 1024 - 820, 1024 + 820
    top = int(1268 - 1640 * hmm)
    alpha = np.zeros((stage.N, stage.N)); alpha[top:1268, x0:x1] = 1
    unit = 12.1; h = 40 * unit * np.sin(np.radians(4.0)); cy = 1268
    V = st.V
    lp = stage.to_lin(st.plate / 255 / V); lr = stage.to_lin(ram / 255 / V)
    k = (stage.GLOW_AMT * (0.85 + 0.25 * st.F))[..., None] * stage.CYAN_LIN
    far = np.ones_like(alpha, bool); far[top - 8:1280, x0 - 8:x1 + 8] = False
    far &= st.pod < 0.01
    yv = (lr - lp)[..., 1][far]; kk = k[..., 1][far]
    for extra in [0, 10, 20]:
        quad = np.zeros_like(alpha)
        quad[int(cy - h / 2):int(cy + h / 2), max(int(x0 - extra * unit), 0):min(int(x1 + extra * unit), 2048)] = 1
        g = stage.upsample_tex(stage.product_glow_tex(np.maximum(alpha, quad)))
        A = np.stack([-kk * st.gen[far], kk * g[far]], 1)
        coef, *_ = np.linalg.lstsq(A, yv, rcond=None)
        res = yv - A @ coef; res1 = yv - A @ np.array([1.0, 1.0])
        print(name, 'quad extra', extra, 'coef gen,prod', coef.round(3), 'rms fit', np.sqrt((res**2).mean()).round(5), 'rms(1,1)', np.sqrt((res1**2).mean()).round(5))
    g = stage.upsample_tex(stage.product_glow_tex(alpha))
    A = np.stack([-kk * st.gen[far], kk * g[far]], 1)
    coef, *_ = np.linalg.lstsq(A, yv, rcond=None)
    print(name, 'no quad coef', coef.round(3))
    # also check: does the plate's generic glow exist at all? compare lr-lp to -gen in region well above module
    reg = np.zeros_like(far); reg[200:top - 300, 700:1350] = True; reg &= far
    print('  above-module region mean (lr-lp) G', (lr - lp)[..., 1][reg].mean().round(5), ' -k*gen', (-k[..., 1] * st.gen)[reg].mean().round(5), ' k*g', (k[..., 1] * g)[reg].mean().round(5))
