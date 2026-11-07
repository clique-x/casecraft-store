"""Place a cut-out (straight RGB + alpha) on a teal stage plate with contact shadow, occlusion,
a faint cast shadow (light from upper left) and the README silhouette glow."""
import numpy as np
from PIL import Image
import stage as stg

GLOW_GAIN = 1.2      # fitted against the flat RAM renders (README recipe weights x 1.2)
QUAD_UNITS = 20      # the RAM glow mask also held the 40-unit-deep contact-shadow quad, 20 units wider each side


def resize_rgba(rgb, alpha, scale):
    """Premultiplied Lanczos resize."""
    h, w = alpha.shape
    nw, nh = max(1, int(round(w * scale))), max(1, int(round(h * scale)))
    chans = [rgb[..., c] * alpha for c in range(3)] + [alpha]
    out = []
    for ch in chans:
        im = Image.fromarray(ch.astype(np.float32), 'F').resize((nw, nh), Image.LANCZOS)
        out.append(np.asarray(im).astype(np.float64))
    a = np.clip(out[3], 0, 1)
    prem = np.stack(out[:3], -1)
    prem = np.clip(prem, 0, 255 * a[..., None] + 1e-6)
    prem = np.maximum(prem, 0)
    return prem, a


def rotate_rgba(rgb, alpha, deg):
    """In-plane rotation (premultiplied, bicubic, canvas expanded)."""
    chans = [rgb[..., c] * alpha for c in range(3)] + [alpha]
    out = []
    for ch in chans:
        im = Image.fromarray(ch.astype(np.float32), 'F').rotate(deg, resample=Image.BICUBIC, expand=True)
        out.append(np.asarray(im).astype(np.float64))
    a = np.clip(out[3], 0, 1)
    prem = np.stack(out[:3], -1)
    rgb2 = np.where(a[..., None] > 1e-4, prem / np.maximum(a[..., None], 1e-4), 0)
    return np.clip(rgb2, 0, 255), a


def lower_hull(xs, ys):
    """Hull of the bottom silhouette (image y grows downward): keep the points with the largest y."""
    pts = sorted(zip(xs, ys))
    hull = []
    for p in pts:
        # we want the chain that bulges downward (max y): keep turns that are clockwise in image coords
        while len(hull) >= 2:
            (x1, y1), (x2, y2) = hull[-2], hull[-1]
            cross = (x2 - x1) * (p[1] - y1) - (y2 - y1) * (p[0] - x1)
            if cross >= 0:
                hull.pop()
            else:
                break
        hull.append(p)
    hx = np.array([p[0] for p in hull], float)
    hy = np.array([p[1] for p in hull], float)
    return hx, hy


def bottom_profile(a, thr=0.5):
    """Per column: sub-pixel y of the lowest alpha>thr crossing, or nan."""
    h, w = a.shape
    on = a > thr
    has = on.any(axis=0)
    last = h - 1 - np.argmax(on[::-1], axis=0)
    yb = np.full(w, np.nan)
    for x in np.nonzero(has)[0]:
        y = last[x]
        if y + 1 < h:
            a0, a1 = a[y, x], a[y + 1, x]
            frac = (a0 - thr) / max(a0 - a1, 1e-6)
            yb[x] = y + np.clip(frac, 0, 1)
        else:
            yb[x] = y
    return yb


def place(st, rgb, alpha, *, long_px=None, height_px=None, max_h=1160, max_w=None, depth_px=12,
          cast=None, contact_tol=None, glow=True):
    """Returns (final uint8 image, info dict)."""
    N = stg.N
    ys, xs = np.nonzero(alpha > 0.02)
    rgb = rgb[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    alpha = alpha[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = alpha.shape
    if height_px:
        s = height_px / h
    else:
        s = long_px / max(h, w)
    if max_h and h * s > max_h:
        s = max_h / h
    if max_w and w * s > max_w:
        s = max_w / w
    prem, a = resize_rgba(rgb, alpha, s)
    ph, pw = a.shape
    yb = bottom_profile(a)
    cols = np.nonzero(~np.isnan(yb))[0]
    lowest = np.nanmax(yb)
    cx, cy = st.contact
    # ground line from the lower hull of the bottom profile; the footprint's middle (the hull line
    # under the product's horizontal centre) goes on the contact point, so a base that recedes in
    # a 3/4 view straddles the contact point the way the RAM module does
    hx, hy = lower_hull(cols.astype(float), yb[cols])
    ground = np.interp(np.arange(pw), hx, hy)
    # rounded corners make the hull climb steeply at the ends: those columns are not resting on the
    # podium. Keep shallow hull segments only and extend the ground flat beyond them.
    slope = np.abs(np.gradient(ground))
    shallow = slope < (0.5 if st.view == '34' else 0.1)
    idx = np.nonzero(shallow)[0]
    if len(idx):
        ground = np.interp(np.arange(pw), idx, ground[idx])
    g_mid = float(np.interp(pw / 2.0, np.arange(pw), ground))
    tol = contact_tol if contact_tol is not None else max(2.0, 0.004 * pw)
    contact = (~np.isnan(yb)) & (yb >= ground - tol) & shallow
    ox = int(round(cx - pw / 2))
    oy = int(round(cy - g_mid))
    # keep every contact point on the podium top: a footprint that recedes further than this camera
    # shows (a source shot from higher up) is moved forward until its far end clears the back edge
    gx = np.arange(pw) + ox
    ci = np.nonzero(contact & (gx >= 0) & (gx < N))[0]
    P = stg.PLATES[st.view]
    top = dict(front=(1179, 1392, 94, 1955), **{'34': (1072, 1506, 7, 2042)})[st.view]
    yc_e, ry_e = (top[0] + top[1]) / 2, (top[1] - top[0]) / 2
    rx_e = (top[3] - top[2]) / 2
    margin = 28 if st.view == '34' else 14
    shift = 0
    if len(ci):
        back = st.pod_edge[gx[ci]]
        clear = (ground[ci] + oy) - back
        need = margin - float(clear.min())
        if need > 0:
            xr = np.clip((gx[ci] - 1024) / rx_e, -0.999, 0.999)
            front = yc_e + ry_e * np.sqrt(1 - xr ** 2)
            room = float((front - margin - (ground[ci] + oy)).min())
            shift = int(np.ceil(min(need, max(room, 0))))
            oy += shift
    # full-frame layers
    A = np.zeros((N, N))
    Pm = np.zeros((N, N, 3))
    y0, x0 = max(oy, 0), max(ox, 0)
    y1, x1 = min(oy + ph, N), min(ox + pw, N)
    A[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    Pm[y0:y1, x0:x1] = prem[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    clipped = (oy < 0) or (ox < 0) or (oy + ph > N) or (ox + pw > N)
    gy = ground + oy
    span = (gx.min(), gx.max())

    # --- shadows (alpha maps) ---
    # The ground plane is foreshortened by sin(camera elevation): blurs and depths are
    # anisotropic (wide in x, thin in y), like the RAM renders' ground-plane contact shadow.
    elev = {'front': 4.0, '34': 9.5}[st.view]
    sn = np.sin(np.radians(elev))
    L1 = np.zeros((N, N)); L2 = np.zeros((N, N)); L3 = np.zeros((N, N))
    d_back = depth_px            # footprint depth behind the visible base line (px, foreshortened)
    d_front = max(4.0, 0.35 * depth_px)
    for i in range(pw):
        X = gx[i]
        if X < 0 or X >= N:
            continue
        g = gy[i]
        if contact[i]:
            L1[int(np.floor(g)) - 2:int(np.ceil(g)) + 1, X] = 1.0
        if not np.isnan(yb[i]):
            L2[int(g - d_back):int(np.ceil(g + d_front)), X] = 1.0
    ext = max(8, int(0.02 * pw))
    for X in list(range(max(span[0] - ext, 0), span[0])) + list(range(span[1] + 1, min(span[1] + ext + 1, N))):
        i = 0 if X < span[0] else pw - 1
        g = gy[i]
        L2[int(g - d_back):int(np.ceil(g + d_front)), X] = 1.0
    L1 = stg.gauss_blur_xy(L1, 2.0, 1.2)
    L2 = stg.gauss_blur_xy(L2, 16.0, max(2.0, 30.0 * sn))
    if cast:
        # key light ~(-0.48, 0.67, 0.57): a point h px above the ground throws its shadow
        # 0.71h to the right and 0.85h back (= 0.85h*sin(elev) px up in the image)
        kx, kz = 0.48 / 0.67, 0.57 / 0.67
        g_of_x = np.full(N, np.nan)
        g_of_x[max(ox, 0):min(ox + pw, N)] = gy[max(0, -ox):max(0, -ox) + (min(ox + pw, N) - max(ox, 0))]
        gmean = float(np.nanmean(gy))
        Yi, Xi = np.nonzero(A > 0.3)
        hgt = np.maximum(gmean - Yi, 0)
        tx = np.round(Xi + kx * hgt).astype(int)
        ty = np.round(gmean - kz * hgt * sn).astype(int)
        ok = (tx >= 0) & (tx < N) & (ty >= 0) & (ty < N)
        L3[ty[ok], tx[ok]] = 1.0
        L3 = stg.gauss_blur_xy(L3, 1.5, 1.5)
        L3 = np.clip(L3 * 4, 0, 1)
        L3 = stg.gauss_blur_xy(L3, cast.get('blur', 10.0), max(1.5, cast.get('blur', 10.0) * 0.35)) * cast.get('opacity', 0.3)
    shadow = 1 - (1 - 0.95 * L1) * (1 - 0.65 * np.clip(L2, 0, 1)) * (1 - L3)

    # --- glow ---
    if glow:
        unit = stg.PLATES[st.view]['unit']
        hq = 40 * unit * np.sin(np.radians(elev))
        quad = np.zeros((N, N))
        qx0 = max(int(span[0] - QUAD_UNITS * unit), 0)
        qx1 = min(int(span[1] + QUAD_UNITS * unit), N)
        quad[int(cy - hq / 2):int(cy + hq / 2), qx0:qx1] = 1
        gl = stg.upsample_tex(stg.product_glow_tex(np.maximum(A, quad))) * GLOW_GAIN
        bg = st.backdrop_with_glow(gl)
    else:
        bg = st.plate.copy()
    bg = bg * (1 - shadow * st.pod)[..., None]
    out = Pm + bg * (1 - A[..., None])
    info = dict(scale=round(s, 4), size=[int(pw), int(ph)], origin=[ox, oy],
                bbox=[ox, oy, ox + pw, oy + ph], lowest_y=round(oy + lowest, 1), clipped=bool(clipped),
                contact_cols=int(contact.sum()), moved_forward_px=int(shift),
                footprint_y=[round(float(np.min(gy[contact])), 1), round(float(np.max(gy[contact])), 1)],
                min_clearance_from_podium_back_edge=round(float(np.min(gy[contact] - st.pod_edge[np.clip(gx[contact], 0, N - 1)])), 1))
    return np.clip(np.round(out), 0, 255).astype(np.uint8), info
