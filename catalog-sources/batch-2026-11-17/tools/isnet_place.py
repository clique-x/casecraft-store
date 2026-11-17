"""Cut with the ISNet mask only (for products the same colour as the backdrop) and place on the teal stage.
usage: python3 -I isnet_place.py SCRATCH src out height_px [rotate]"""
import sys, os
import numpy as np
from PIL import Image, ImageOps, ImageFilter
S = sys.argv[1]
sys.path.insert(0, S + '/cx-tools')
import stage, cutout, composite  # noqa: E402
import onnxruntime as ort
src, out, h = sys.argv[2], sys.argv[3], int(sys.argv[4])
img = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
img.thumbnail((2400, 2400), Image.LANCZOS)
sess = ort.InferenceSession(S + '/models/isnet-general-use.onnx', providers=['CPUExecutionProvider'])
x = np.asarray(img.resize((1024, 1024), Image.BILINEAR)).astype(np.float32) / 255.0
x = (x - 0.5).transpose(2, 0, 1)[None].astype(np.float32)
pred = sess.run(None, {sess.get_inputs()[0].name: x})[0][0, 0]
pred = (pred - pred.min()) / (pred.max() - pred.min() + 1e-8)
M = Image.fromarray((pred * 255).astype(np.uint8)).resize(img.size, Image.BILINEAR)
M.save(out + '.mask.png')
a = np.asarray(M).astype(np.float64) / 255
a = np.clip((a - 0.35) / 0.3, 0, 1)
rgb = np.asarray(img).astype(np.float64)
if len(sys.argv) > 5:
    rgb, a = composite.rotate_rgba(rgb, a, float(sys.argv[5]))
res, info = composite.place(stage.Stage(S + '/ram-renders', 'front'), rgb, a, depth_px=6, cast=dict(blur=10, opacity=0.3), height_px=h, max_h=1160)
os.makedirs(os.path.dirname(out), exist_ok=True)
Image.fromarray(res).save(out, compress_level=6)
print('ok', out, info['size'])
