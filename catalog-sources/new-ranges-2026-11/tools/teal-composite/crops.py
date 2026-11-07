"""crops.py out.jpg zoom file:x,y,w,h [file:x,y,w,h ...] -> crops enlarged (nearest), side by side rows"""
import sys
from PIL import Image
out, zoom = sys.argv[1], float(sys.argv[2])
tiles = []
for spec in sys.argv[3:]:
    f, box = spec.rsplit(':', 1)
    x, y, w, h = map(int, box.split(','))
    im = Image.open(f)
    if im.mode in ('P', 'LA', 'L'): im = im.convert('RGBA')
    if im.mode == 'RGBA':
        bg = Image.new('RGBA', im.size, (8, 37, 46, 255)); bg.alpha_composite(im); im = bg
    im = im.convert('RGB').crop((x, y, x + w, y + h))
    tiles.append(im.resize((int(w * zoom), int(h * zoom)), Image.NEAREST))
W = sum(t.width for t in tiles) + 6 * (len(tiles) + 1); H = max(t.height for t in tiles) + 12
s = Image.new('RGB', (W, H), (60, 60, 60)); x = 6
for t in tiles:
    s.paste(t, (x, 6)); x += t.width + 6
s.save(out, quality=90); print(out, s.size)
