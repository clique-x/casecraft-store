"""Contact sheets per range + manifest.json. usage: python3 -I finish.py SCRATCH jobs.json"""
import json, os, sys, datetime
from PIL import Image, ImageDraw, ImageFont

S = sys.argv[1]
d = json.load(open(sys.argv[2]))
res = json.load(open(S + '/cx-work/results.json'))
OUT = S + '/creatives'
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FM = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
TILE, LAB, GAP = 400, 54, 10
RANGE_TITLES = {'memory-cards': 'Memory cards', 'ssd': 'SSDs', 'consistent': 'Consistent SSDs', 'boat': 'boAt speakers', 'cpplus': 'CP Plus cameras'}

images = []
for j in d['jobs']:
    r = res.get(j['out'])
    if not r or 'error' in r or not os.path.exists(f"{OUT}/{j['out']}"):
        continue
    cav = list(j.get('caveats', []))
    scale = r['scale']
    if scale >= 1.5 and not any('upscaled' in c for c in cav):
        cav.append(f'Source upscaled {scale:.1f}x, so the result is slightly soft.')
    for n in r.get('notes', []):
        if n.startswith('Removed'):
            cav.append(n)
        elif 'dropped' in n:
            pass
    if r.get('clipped'):
        cav.append('Product touches the frame edge.')
    images.append(dict(
        file=j['out'], range=j['range'], line=j['line'], line_slug=j['line_slug'], variant=j['variant'],
        variant_slug=j['variant_slug'], part_number=j.get('part'), image_role=j['image_role'],
        capacity_or_model_printed_on_product=j.get('printed'),
        source_file=j['src'], source_url=j['src_url'], source_fetch=j['fetched'],
        cutout=dict(alpha='source alpha channel', key='soft key of the white background (ISNet trimap + colour-difference edge, edge colours decontaminated)',
                    flood='soft key of the plain background (border-connected flood fill + colour-difference edge, edge colours decontaminated)',
                    matte='matte from the pixel-aligned sibling render, colours from this source')[j['cut']],
        plate='plate-34.png' if j['view'] == '34' else 'plate-front.png',
        placement=dict(scale_from_source=scale, product_px=r['size'], bbox_xyxy=r['bbox'], base_y=r['lowest_y'],
                       contact_point=[1024, 1249] if j['view'] == '34' else [1024, 1268]),
        caveats=cav))

manifest = dict(
    generated=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    shop='GadgetsHub',
    stage=dict(plates=S + '/ram-renders', size=[2048, 2048], notes=[
        'Official product photos only: cut out, scaled and placed. Product pixels are not redrawn or retouched (exceptions listed per image: lossless 90-degree turns and one in-plane rotation).',
        'Base on the podium contact line (y 1268 front plate / y 1249 3/4 plate), centred on x 1024.',
        'Shadows: tight contact line, wide foreshortened occlusion, faint cast shadow back-right (key light upper left).',
        'Glow: README recipe (alpha blurred ~10/32/90/220 px, weights .55/.42/.26/.12, #00C5E0) on the backdrop only, behind the podium, plus the 20-unit ground quad the RAM renders also glow from; the plate\'s generic empty-stage halo is swapped out, as in the RAM renders.',
        'Size: longest side 1331 px (65% of 2048) for cards and SSDs, capped at 1160 px tall so portrait items fit above the podium; speakers/cameras 1160 px tall (57%), wide speaker capped at 1536 px wide.']),
    counts={k: sum(1 for i in images if i['range'] == k) for k in RANGE_TITLES},
    images=images,
    no_matching_image=d['nomatch'],
    skipped=d['skipped'],
    sheets=[f'{k}/sheet.jpg' for k in RANGE_TITLES])
json.dump(manifest, open(OUT + '/manifest.json', 'w'), indent=1, ensure_ascii=False)

# ---- sheets
font = ImageFont.truetype(F, 17)
fsm = ImageFont.truetype(FM, 12)
fh = ImageFont.truetype(F, 26)
for rk, title in RANGE_TITLES.items():
    items = [i for i in images if i['range'] == rk]
    if not items:
        continue
    cols = min(6, len(items))
    rows = (len(items) + cols - 1) // cols
    W = cols * TILE + (cols + 1) * GAP
    H = 50 + rows * (TILE + LAB + GAP) + GAP
    sh = Image.new('RGB', (W, H), (6, 26, 32))
    dr = ImageDraw.Draw(sh)
    dr.text((GAP, 12), f'{title}: {len(items)} images (GadgetsHub teal set)', fill=(216, 243, 247), font=fh)
    for k, it in enumerate(items):
        x = GAP + (k % cols) * (TILE + GAP)
        y = 50 + (k // cols) * (TILE + LAB + GAP)
        im = Image.open(f"{OUT}/{it['file']}").convert('RGB').resize((TILE, TILE), Image.LANCZOS)
        sh.paste(im, (x, y))
        SHORT = {'sandisk-ultra-microsd': 'SanDisk Ultra', 'sandisk-extreme-microsd': 'SanDisk Extreme',
                 'samsung-evo-plus-microsd-2024': 'Samsung EVO Plus 2024', 'samsung-evo-plus-microsd-2021': 'Samsung EVO Plus 2021',
                 'samsung-pro-plus-microsd-2023': 'Samsung PRO Plus 2023', 'consistent-s7-2-5-sata': 'S7 2.5" SATA',
                 'consistent-m2-2280-sata-titled': 'M.2 2280 "SATA"', 'consistent-s7-nvme-gen3': 'S7 NVMe Gen3',
                 'consistent-nvme-gen4-cheetah': 'NVMe Gen4', 'ezykam-wifi-pt-camera': 'ezyKam+',
                 'stone-1200-pro': 'Stone 1200 Pro', 'stone-arc-pro': 'Stone Arc Pro'}
        line = SHORT.get(it['line_slug'], it['line'].replace('SanDisk / WD ', ''))
        var = it['variant'].split(' (')[0]
        if it['range'] == 'cpplus':
            var = it['variant']
        lab = f'{line} · {var}'
        dr.text((x + 3, y + TILE + 4), lab[:40], fill=(216, 243, 247), font=font)
        dr.text((x + 3, y + TILE + 28), it['file'].split('/', 1)[1][-56:], fill=(111, 185, 198), font=fsm)
        if it['placement']['scale_from_source'] >= 1.5 or any('upscaled' in c for c in it['caveats']):
            dr.text((x + TILE - 44, y + TILE + 28), 'soft', fill=(240, 180, 90), font=fsm)
    sh.save(f'{OUT}/{rk}/sheet.jpg', quality=88)
    print(rk, len(items), sh.size)
print('manifest', len(images), 'images;', len(d['nomatch']), 'no-match;', len(d['skipped']), 'skipped')
