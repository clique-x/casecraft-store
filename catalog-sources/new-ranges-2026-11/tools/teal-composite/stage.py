"""Teal-stage model for compositing cut-outs onto the GadgetsHub plates.

Mirrors ram-renders/src/ram-scene.js (backdrop shader, glow recipe) and render.mjs (vignette),
so a product's silhouette glow can be added the same way the RAM renders were made, and the
plate's generic empty-stage glow taken out.
"""
import numpy as np
from PIL import Image

N = 2048
GS = 512
CYAN_LIN = (np.array([0.0, 197.0, 224.0]) / 255.0) ** 2.2
GLOW_AMT = 0.85

PLATES = {
    # contact point, px per world unit, camera key
    'front': dict(file='plate-front.png', contact=(1024, 1268), unit=12.1),
    '34': dict(file='plate-34.png', contact=(1024, 1249), unit=13.2),
}


def to_lin(x):
    return np.power(np.clip(x, 0.0, None), 2.2)


def to_srgb(x):
    return np.power(np.clip(x, 0.0, None), 1.0 / 2.2)


def _conv1d(a, k, axis):
    n = a.shape[axis]
    L = n + len(k) - 1
    nfft = 1 << (L - 1).bit_length()
    A = np.fft.rfft(a, nfft, axis=axis)
    K = np.fft.rfft(k, nfft)
    shape = [1] * a.ndim
    shape[axis] = K.shape[0]
    out = np.fft.irfft(A * K.reshape(shape), nfft, axis=axis)
    off = len(k) // 2
    sl = [slice(None)] * a.ndim
    sl[axis] = slice(off, off + n)
    return out[tuple(sl)]


def gauss_blur(a, sigma):
    """Separable Gaussian with clamp-to-edge borders (like the scene's box-blur gaussBlur)."""
    if sigma <= 0:
        return a.copy()
    r = int(np.ceil(3.5 * sigma))
    x = np.arange(-r, r + 1, dtype=np.float64)
    k = np.exp(-0.5 * (x / sigma) ** 2)
    k /= k.sum()
    p = np.pad(a, r, mode='edge')
    p = _conv1d(p, k, 0)
    p = _conv1d(p, k, 1)
    return p[r:-r, r:-r]


def vignette():
    """Per-channel multiply factor of render.mjs's radial gradient (cx 50%, cy 46%, r 72%)."""
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
    rr = np.hypot(xx + 0.5 - 0.5 * N, yy + 0.5 - 0.46 * N) / (0.72 * N)
    t = np.clip((rr - 0.55) / 0.45, 0, 1)[..., None]
    end = np.array([154, 164, 166]) / 255.0
    return 1.0 + t * (end - 1.0)


def folds():
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
    u = (xx + 0.5) / N
    v = 1.0 - (yy + 0.5) / N
    xw = u + 0.025 * np.sin(v * 5.0 + u * 3.0)
    f = 0.55 * np.sin(xw * 19.0 + 1.3) + 0.3 * np.sin(xw * 37.0 + 0.4) + 0.15 * np.sin(xw * 71.0 + 2.0)
    return f * 0.5 + 0.5


def upsample_tex(tex):
    """Sample a GSxGS texture (row 0 = bottom, LinearFilter) at every pixel of the NxN image."""
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float64)
    u = (xx + 0.5) / N * GS - 0.5
    v = (1.0 - (yy + 0.5) / N) * GS - 0.5
    x0 = np.clip(np.floor(u).astype(int), 0, GS - 1)
    y0 = np.clip(np.floor(v).astype(int), 0, GS - 1)
    x1 = np.clip(x0 + 1, 0, GS - 1)
    y1 = np.clip(y0 + 1, 0, GS - 1)
    fx = np.clip(u - np.floor(u), 0, 1)
    fy = np.clip(v - np.floor(v), 0, 1)
    return ((tex[y0, x0] * (1 - fx) + tex[y0, x1] * fx) * (1 - fy)
            + (tex[y1, x0] * (1 - fx) + tex[y1, x1] * fx) * fy)


def generic_glow_tex(view):
    """The plate's empty-stage glow texture (soft ellipse, radii 20/45/80 at GS)."""
    P = PLATES[view]
    cxp, cyp = P['contact']
    c = (cxp / N, 1 - cyp / N)
    ty = 1 - (cyp - 50 * P['unit']) / N
    cx = c[0] * GS
    cy = (c[1] + ty) / 2 * GS
    rx = 0.2 * GS
    ry = (ty - c[1]) / 2 * GS * 1.15
    yy, xx = np.mgrid[0:GS, 0:GS].astype(np.float64)
    d = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
    mask = np.where(d < 1, 0.55 * np.sqrt(np.clip(1 - d, 0, 1)), 0.0)
    g = np.zeros_like(mask)
    for r, w in [(20, 0.5), (45, 0.45), (80, 0.25)]:
        g += gauss_blur(mask, r) * w
    return np.minimum(g, 4)


def product_glow_tex(alpha_full):
    """README recipe: blur the cut-out alpha at ~10/32/90/220 px (2.5/8/22/55 at GS) with weights
    .55/.42/.26/.12. alpha_full is the NxN placed alpha (row 0 = top)."""
    a = alpha_full.reshape(GS, N // GS, GS, N // GS).mean(axis=(1, 3))
    a = a[::-1]  # texture row 0 = bottom
    g = np.zeros_like(a)
    for r, w in [(2.5, 0.55), (8, 0.42), (22, 0.26), (55, 0.12)]:
        g += gauss_blur(a, r) * w
    return np.minimum(g, 4)


def podium_mask(plate):
    """Soft mask of the podium (1) vs backdrop (0): the backdrop has R <= ~10, the velvet top R >= 18.
    Everything below the first podium pixel in a column counts as podium (the drape)."""
    r = plate[..., 0].astype(np.float64)
    rs = gauss_blur(r, 2.0)
    hit = rs > 14.0
    first = np.where(hit.any(axis=0), hit.argmax(axis=0), N).astype(np.float64)
    # smooth the boundary across columns (median then light mean)
    k = 9
    pad = np.pad(first, k, mode='edge')
    med = np.array([np.median(pad[i:i + 2 * k + 1]) for i in range(N)])
    ker = np.ones(5) / 5
    med = np.convolve(np.pad(med, 2, mode='edge'), ker, mode='valid')
    yy = np.arange(N, dtype=np.float64)[:, None]
    # 1.5 px soft edge
    return np.clip((yy - med[None, :] + 1.0) / 2.0, 0, 1), med


class Stage:
    def __init__(self, ram_dir, view):
        self.view = view
        P = PLATES[view]
        self.contact = P['contact']
        img = np.asarray(Image.open(f"{ram_dir}/{P['file']}").convert('RGB')).astype(np.float64)
        self.plate = img
        self.V = vignette()
        self.F = folds()
        self.pod, self.pod_edge = podium_mask(img)
        self.gen = upsample_tex(generic_glow_tex(view))

    def backdrop_with_glow(self, glow_full, remove_generic=True):
        """Return the plate (float sRGB 0-255) with the generic glow swapped for glow_full,
        on the backdrop only (the podium is left untouched)."""
        V = self.V
        base = self.plate / 255.0 / V
        lin = to_lin(base)
        k = (GLOW_AMT * (0.85 + 0.25 * self.F))[..., None] * CYAN_LIN
        if remove_generic:
            lin = lin - k * self.gen[..., None]
        lin = lin + k * glow_full[..., None]
        out = to_srgb(lin) * V * 255.0
        bd = (1.0 - self.pod)[..., None]
        return out * bd + self.plate * (1 - bd)


def gauss_blur_xy(a, sx, sy):
    out = a
    for sigma, axis in ((sy, 0), (sx, 1)):
        if sigma <= 0:
            continue
        r = int(np.ceil(3.5 * sigma))
        x = np.arange(-r, r + 1, dtype=np.float64)
        k = np.exp(-0.5 * (x / sigma) ** 2)
        k /= k.sum()
        pad = [(0, 0), (0, 0)]
        pad[axis] = (r, r)
        p = np.pad(out, pad, mode='edge')
        p = _conv1d(p, k, axis)
        sl = [slice(None), slice(None)]
        sl[axis] = slice(r, -r)
        out = p[tuple(sl)]
    return out
