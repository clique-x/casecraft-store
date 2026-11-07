"""Grid of product crops (from the final images) to read printed capacities. usage: labelgrid.py SCRATCH out.jpg rel_png..."""
import sys, json
from PIL import Image, ImageDraw, ImageFont
S, out = sys.argv[1], sys.argv[2]
res = json.load(open(S + '/cx-work/results.json'))
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
tiles = []
for rel in sys.argv[3:]:
    x0, y0, x1, y1 = res[rel]['bbox']
    im = Image.open(f'{S}/creatives/{rel}').crop((x0 - 10, y0 - 10, x1 + 10, y1 + 10))
    im.thumbnail((700, 420), Image.LANCZOS)
    t = Image.new('RGB', (700, im.height + 26), (20, 20, 20))
    t.paste(im, (0, 26))
    ImageDraw.Draw(t).text((4, 2), rel, fill=(230, 230, 230), font=font)
    tiles.append(t)
cols = 3
rows = [tiles[i:i + cols] for i in range(0, len(tiles), cols)]
W = cols * 704
H = sum(max(t.height for t in r) + 4 for r in rows)
g = Image.new('RGB', (W, H), (60, 60, 60))
y = 0
for r in rows:
    for k, t in enumerate(r):
        g.paste(t, (k * 704, y))
    y += max(t.height for t in r) + 4
g.save(out, quality=90)
print(out, g.size)
