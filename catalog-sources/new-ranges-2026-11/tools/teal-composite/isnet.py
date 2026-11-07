"""ISNet (DIS general-use) saliency mask. Usage: isnet.py model.onnx out_dir files..."""
import sys, os
import numpy as np
import onnxruntime as ort
from PIL import Image
model, outdir = sys.argv[1], sys.argv[2]
sess = ort.InferenceSession(model, providers=['CPUExecutionProvider'])
for src in sys.argv[3:]:
    img = Image.open(src).convert('RGB')
    im = np.asarray(img.resize((1024, 1024), Image.BILINEAR)).astype(np.float32) / 255.0
    x = ((im - 0.5) / 1.0).transpose(2, 0, 1)[None].astype(np.float32)
    pred = sess.run(None, {sess.get_inputs()[0].name: x})[0][0, 0]
    pred = (pred - pred.min()) / (pred.max() - pred.min() + 1e-8)
    m = Image.fromarray((pred * 255).astype(np.uint8), 'L').resize(img.size, Image.BILINEAR)
    name = os.path.splitext(os.path.basename(src))[0]
    m.save(os.path.join(outdir, name + '.isnet.png'))
    print(name, img.size)
