"""Official product shot on white -> teal stage. usage: python3 -I white_place.py SCRATCH src out long_px max_h"""
import sys, os
import numpy as np
from PIL import Image
S = sys.argv[1]
sys.path.insert(0, S + '/cx-tools')
import stage, cutout, composite  # noqa: E402
import onnxruntime as ort
src, out, long_px, max_h = sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
img = Image.open(src).convert('RGB')
sess = ort.InferenceSession(S + '/models/isnet-general-use.onnx', providers=['CPUExecutionProvider'])
x = np.asarray(img.resize((1024, 1024), Image.BILINEAR)).astype(np.float32) / 255.0
x = (x - 0.5).transpose(2, 0, 1)[None].astype(np.float32)
pred = sess.run(None, {sess.get_inputs()[0].name: x})[0][0, 0]
pred = (pred - pred.min()) / (pred.max() - pred.min() + 1e-8)
M = np.asarray(Image.fromarray((pred * 255).astype(np.uint8)).resize(img.size, Image.BILINEAR)).astype(np.float64) / 255
rgb = np.asarray(img).astype(np.float64)
rgb, a, t = cutout.key_flood(rgb, M, t_flood=18.0)
rot = float(sys.argv[6]) if len(sys.argv) > 6 else 0.0
if rot:
    rgb, a = composite.rotate_rgba(rgb, a, rot)
res, info = composite.place(stage.Stage(S + '/ram-renders', 'front'), rgb, a, depth_px=10, cast=dict(blur=12, opacity=0.32), long_px=long_px, max_h=max_h)
os.makedirs(os.path.dirname(out), exist_ok=True)
Image.fromarray(res).save(out, compress_level=6)
print('ok', out, info['size'], 'tol', round(t, 1))
