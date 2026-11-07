import sys, os, time, numpy as np
from PIL import Image
sys.path.insert(0, sys.argv[1] + '/cx-tools')
import stage, cutout, composite
S = sys.argv[1]
stages = {}
def get(view):
    if view not in stages: stages[view] = stage.Stage(S + '/ram-renders', view)
    return stages[view]
tests = [
    ('t-sandisk-ultra128', S + '/catalog-research/memory-cards/raw/sandisk-ultra/img/sandisk-ultra-microsd-128gb-front.png', 'front', dict(long_px=1331, depth_px=6, cast=dict(blur=10, opacity=0.3))),
    ('t-990pro-front', S + '/dl-samsung/ssd/mz-v9p1t0bw-front.png', 'front', dict(long_px=1331, depth_px=6, cast=dict(blur=10, opacity=0.3))),
    ('t-990pro-angle', S + '/dl-samsung/ssd/mz-v9p1t0bw-angle.png', '34', dict(long_px=1331, depth_px=14, cast=dict(blur=12, opacity=0.35))),
    ('t-stone1200', S + '/cx-work/cut/stone-1200-pro-bluetooth-speaker-00.png', '34', dict(long_px=1475, depth_px=80, cast=dict(blur=14, opacity=0.35))),
    ('t-cam', S + '/cx-work/cut/cp-e28q-1.png', 'front', dict(height_px=1160, depth_px=55, cast=dict(blur=12, opacity=0.3))),
]
for name, src, view, kw in tests:
    t = time.time()
    rgb, a, tr = cutout.load_rgba(src)
    img, info = composite.place(get(view), rgb, a, **kw)
    Image.fromarray(img).save(f'{S}/cx-work/{name}.png')
    print(name, info, '%.1fs' % (time.time() - t))
