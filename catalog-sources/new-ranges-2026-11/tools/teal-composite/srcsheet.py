"""Quick look sheet of source images on a checkerboard. usage: srcsheet.py out.jpg tile files..."""
import sys
from PIL import Image, ImageDraw, ImageFont
out, tile = sys.argv[1], int(sys.argv[2]); files = sys.argv[3:]
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
cols = min(5, len(files)); rows = (len(files) + cols - 1) // cols
W = cols * (tile + 8) + 8; H = rows * (tile + 30) + 8
sheet = Image.new('RGB', (W, H), (40, 40, 40)); d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f); sz = im.size; mode = im.mode
    im = im.convert('RGBA'); im.thumbnail((tile, tile), Image.LANCZOS)
    bg = Image.new('RGBA', (tile, tile), (200, 60, 200, 255))  # magenta to reveal alpha
    bg.alpha_composite(im, ((tile - im.width) // 2, (tile - im.height) // 2))
    x = 8 + (i % cols) * (tile + 8); y = 8 + (i // cols) * (tile + 30)
    sheet.paste(bg.convert('RGB'), (x, y))
    d.text((x, y + tile + 2), f.split('/')[-1][-34:], fill=(230, 230, 230), font=font)
    d.text((x, y + tile + 15), f'{sz[0]}x{sz[1]} {mode}', fill=(150, 200, 210), font=font)
sheet.save(out, quality=88)
print(out, sheet.size)
