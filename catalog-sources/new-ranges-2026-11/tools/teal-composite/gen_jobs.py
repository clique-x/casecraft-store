"""Build the job list (one listing image per variant) from the research files.
usage: python3 -I gen_jobs.py SCRATCH > jobs.json"""
import json, os, re, sys

S = sys.argv[1]
CR = S + '/catalog-research'
jobs, nomatch, skipped = [], [], []


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


THIN_FRONT = dict(depth=6, cast=dict(blur=10, opacity=0.3))
THIN_34 = dict(depth=14, cast=dict(blur=12, opacity=0.32))
CARD_FIT = dict(long_px=1331, max_h=1160)          # 65% of 2048 on the longest side, headroom cap
SSD_FIT = dict(long_px=1331, max_h=1160)


def add(**j):
    j.setdefault('caveats', [])
    j['out'] = f"{j['range']}/{j['line_slug']}/{j['variant_slug']}.png"
    jobs.append(j)


# ---------------------------------------------------------------- memory cards
mc = json.load(open(CR + '/memory-cards/range.json'))
for L in mc['lines']:
    name = L['line']
    if name.startswith('SanDisk Ultra'):
        ls = 'sandisk-ultra-microsd'
    elif name.startswith('SanDisk Extreme'):
        ls = 'sandisk-extreme-microsd'
    elif 'EVO Plus' in name and '2024' in name:
        ls = 'samsung-evo-plus-microsd-2024'
    elif 'EVO Plus' in name and '2021' in name:
        ls = 'samsung-evo-plus-microsd-2021'
    elif 'PRO Plus' in name:
        ls = 'samsung-pro-plus-microsd-2023'
    else:
        nomatch.append(dict(range='memory-cards', line=name, variant='(all)', reason='No official images in the research (kingston.com blocks automated requests); capacities not researched.'))
        continue
    for v in L['variants']:
        cap = v['capacity']
        im = v['images'][0]
        if 'SanDisk' in name:
            if im.get('localPath'):
                src = CR + '/memory-cards/' + im['localPath']
                fetched = 'research download'
            else:
                src = S + '/dl-sandisk/memory-cards/' + im['sourceUrl'].split('/')[-1]
                fetched = 'downloaded in this run from www.sandisk.com (URL recorded in range.json)'
            url = im['sourceUrl']
        else:
            src = S + '/dl-samsung/memory-cards/' + slug(v['partNumber']) + '-front.png'
            url = im['sourceUrl'].split('?')[0] + '?$ORIGIN_PNG$'
            fetched = 'downloaded in this run from images.samsung.com ($ORIGIN_PNG$ preset, 1920x1280 RGBA)'
        add(range='memory-cards', line=name, line_slug=ls, variant=f"{cap} ({v['partNumber']})", variant_slug=slug(cap.replace('.', '-')),
            part=v['partNumber'], src=src, src_url=url, fetched=fetched, view='front', cut='alpha', fit=CARD_FIT,
            printed=cap, image_role='card front',
            caveats=(['The card picture on this 2021-model (MB-MCxxxKA/IN) page is visually the same as the 2024 model\'s (pixel difference under 0.1%); it is used because it is the image on this model\'s own official page.'] if ls == 'samsung-evo-plus-microsd-2021' else []),
            **THIN_FRONT)

# ---------------------------------------------------------------- SSDs
ssd = json.load(open(CR + '/ssd/range.json'))
PRINTS_CAP = {'samsung-990-evo-plus', 'samsung-990-pro', 'sandisk-ssd-plus-nvme', 'sandisk-wd-blue-sn5000', 'sandisk-wd-blue-sn5100', 'sandisk-wd-black-sn7100'}
for L in ssd['lines']:
    lid = L['id']
    if not L.get('variants'):
        nomatch.append(dict(range='ssd', line=L['line'], variant='(all)', reason=(L.get('blockedNote') or 'no official images') ))
        continue
    ls = lid.replace('sandisk-wd-', 'wd-')
    for v in L['variants']:
        cap = v['capacity']
        hs = bool(v.get('heatsink'))
        vs = slug(cap) + ('-heatsink' if hs else '')
        if L['brand'] == 'Samsung':
            src = S + '/dl-samsung/ssd/' + slug(v['partNumber']) + '-front.png'
            url = v['images'][0]['sourceUrl'].split('?')[0] + '?$ORIGIN_PNG$'
            fetched = 'downloaded in this run from images.samsung.com ($ORIGIN_PNG$ preset, 1920x1280 RGBA)'
            role = 'drive front (official gallery image of this capacity\'s own page)'
        else:
            im = v['images'][0]
            url = im['sourceUrl']
            base = url.split('/')[-1]
            if im.get('downloaded') and im.get('localPath'):
                src = im['localPath']
                fetched = 'research download'
            else:
                src = f"{S}/dl-sandisk/ssd/{lid}/{base}"
                fetched = 'downloaded in this run from www.sandisk.com (URL recorded in range.json)'
            role = 'drive ' + ('angle' if ('-left' in base or 'angled' in base) else 'front')
        view = '34' if ('-left' in src or 'angled' in src) else 'front'
        add(range='ssd', line=L['line'], line_slug=ls, variant=f"{cap}{' with heatsink' if hs else ''} ({v['partNumber']})",
            variant_slug=vs, part=v['partNumber'], src=src, src_url=url, fetched=fetched, view=view, cut='alpha', fit=SSD_FIT,
            printed=(cap if lid in PRINTS_CAP else None), image_role=role,
            caveats=([] if lid in PRINTS_CAP else ['No capacity is printed on the pictured drive, so this one picture is correct for every capacity it is used for' + (' (the official site shows the same picture for these capacities).' if L['brand'] != 'Samsung' else '; it is the gallery image of this capacity\'s own Samsung India page.')]), **(THIN_34 if view == '34' else (dict(depth=8, cast=dict(blur=10, opacity=0.3)) if hs else THIN_FRONT)))

# ---------------------------------------------------------------- Consistent
cs = json.load(open(CR + '/consistent/range.json'))
LINE_SLUG = {'2-5-sata': 'consistent-s7-2-5-sata', 'm2-sata': 'consistent-m2-2280-sata-titled',
             'nvme-gen3': 'consistent-s7-nvme-gen3', 'nvme-gen4': 'consistent-nvme-gen4-cheetah'}
for L in cs['lines']:
    ls = LINE_SLUG[L['id']]
    for v in L['variants']:
        cap = v['capacity']
        imgs = {im['galleryIndex']: im for im in v['images']}
        d = imgs[v['bestImages']['drive']]
        cav = []
        rot = None
        if L['id'] in ('m2-sata', 'nvme-gen3'):
            rot = 90
            cav.append('Generic official drive photo shared by all capacities of this line: placeholder label "MODEL:- XXXXXXXXXX", no capacity printed.')
            cav.append('Photo rotated 90 degrees (lossless) so the drive lies horizontal with its label readable; pixels otherwise untouched.')
            cav.append('Source drive is only about 200 x 700 px: upscaled about 1.9x, so fine detail is a little soft.')
            printed = None
        elif L['id'] == 'nvme-gen4':
            cav.append('Source drive is only about 405 x 112 px in an 810 px photo: upscaled about 3.3x, so the image is soft (label text readable but blurry).')
            cav.append('Label shows the model code ' + (v['modelCode']['value'] or '') + '; the 1TB and 2TB photos share the same serial line (CNV4002RAEY00021).')
            printed = v['modelCode']['value']
        else:
            printed = cap
            cav.append('Portrait drive: height capped at 1160 px (57% of frame) so it fits above the podium; longest side is therefore below 60%.')
            cav.append('The drop shadow drawn in the official image (soft blue-grey' + (', or the flat navy offset shape on the 256GB photo' if cap == '256GB' else '') + ') was removed with the background.')
            if cap == '512GB':
                cav.append('Official file is named "128GB-Photoroom" but the label in the image reads 512GB (checked).')
        if v['id'] == 'consistent-2-5-sata-512gb':
            skipped.append(dict(range='consistent', line=L['name'], variant=cap, source=d['localPath'],
                                reason='The only clean 512GB drive photo shows the drive lying on a larger dark-grey offset backing shape of the same colour as the drive frame; the drive outline cannot be separated from it without redrawing an edge.'))
            nomatch.append(dict(range='consistent', line=L['name'], variant=cap,
                                reason='No usable image: the 512GB drive photo cannot be cut cleanly (see skipped), no 512GB box image exists, and every 2.5-inch drive photo prints its capacity, so no capacity-free image can stand in.'))
            continue
        if L['id'] == 'm2-sata':
            cav.append('Line interface is contradictory on the official pages (titled "M.2 SATA" but also "PCIe Gen3 x4 NVMe").')
        add(range='consistent', line=L['name'], line_slug=ls, variant=cap, variant_slug=slug(cap), part=v['modelCode']['value'],
            src=d['localPath'], src_url=d['url'], fetched='research download', view='front', cut='flood',
            cut_kw=(dict(t_flood=110.0, band_r=1, outer=False, extra_bg='navy' if cap == '256GB' else 'blueshadow') if L['id'] == '2-5-sata' else dict(t_flood=16.0)), rotate=rot,
            fit=dict(long_px=1331, max_h=1160), printed=printed, image_role='drive alone (official photo on white)',
            caveats=cav, **THIN_FRONT)
        # boxes: only clean, capacity-matching ones
        bi = v['bestImages'].get('box')
        if bi is not None:
            b = imgs[bi]
            frame_filling = b['subjectBBox'] is None
            if frame_filling:
                skipped.append(dict(range='consistent', line=L['name'], variant=cap + ' box', source=b['localPath'],
                                    reason='Box render fills the frame edge to edge (no background), so its outline cannot be cut cleanly.'
                                    + (' It also prints 128GB, not ' + cap + '.' if L['id'] == 'm2-sata' and cap != '128GB' else '')))
                continue
            bcav = ['Retail box image (secondary image for this variant); box prints ' + cap + '.']
            if b['width'] < 600:
                bcav.append('Source box is only about 234 x 388 px: upscaled about 3x, so it is soft.')
            if b['background'].startswith('solid colour'):
                bcav.append('Official photo on light grey (#CACCD0), keyed out.')
            view = '34' if L['id'] == '2-5-sata' else 'front'
            add(range='consistent', line=L['name'], line_slug=ls, variant=cap + ' retail box', variant_slug=slug(cap) + '-box',
                part=v['modelCode']['value'], src=b['localPath'], src_url=b['url'], fetched='research download', view=view,
                cut='alpha' if b['hasAlpha'] else 'flood', cut_kw=dict(t_flood=4.0, holes={'consistent-nvme-gen3-128gb': [[340, 60, 460, 112]], 'consistent-nvme-gen3-256gb': [[232, 38, 318, 78]]}.get(v['id'])),
                fit=dict(long_px=1331, max_h=1160), printed=cap, image_role='retail box', caveats=bcav,
                depth=30 if view == '34' else 20, cast=dict(blur=12, opacity=0.32))

# ---------------------------------------------------------------- boAt
B = S + '/dl-boat/img/'
tsv = {}
for line in open(S + '/dl-boat/images.tsv'):
    h, i, u = line.strip().split('\t')
    tsv[(h, i)] = u
for vs, var, f in [('ice-grey', 'Ice Grey', '00'), ('twilight-black', 'Twilight Black', '01')]:
    add(range='boat', line='boAt Stone 1200 Pro', line_slug='stone-1200-pro', variant=var, variant_slug=vs, part=None,
        src=B + f'stone-1200-pro-bluetooth-speaker-{f}.jpg', src_url=tsv[('stone-1200-pro-bluetooth-speaker', f)],
        fetched='research download (boAt Shopify CDN)', view='34', cut='key', cut_kw=dict(r_in=4, r_out=3),
        fit=dict(long_px=1536, max_h=1160), printed=None, image_role='product 3/4 view on white',
        caveats=['Wide speaker: width set to 75% of the frame (like the RAM 3/4 module), so its height is about 44%, below the 55-65% speaker guideline; at 55% height it would not fit the frame.',
                 'The soft cast shadow baked into the official white-background photo was removed with the background.'],
        depth=80, cast=dict(blur=14, opacity=0.35))
for vs, var, f in [('raging-black', 'Raging Black', '00'), ('groovy-grey', 'Groovy Grey', '08')]:
    cav = ['Official render leans about 23 degrees; rotated in-plane by -22.7 degrees so the speaker stands on its base on the podium (no other change).']
    kw = dict(r_in=4, r_out=3)
    cut = 'key'
    if f == '08':
        cut = 'matte'
        kw = dict(r_in=4, r_out=3, matte_from=B + 'stone-arc-pro-portable-speaker-00.png')
        cav.append('Silhouette matte taken from the pixel-aligned Raging Black render of the same pose (the light-grey body is too close to the white background to key on its own); colours are the Groovy Grey photo.')
    add(range='boat', line='boAt Stone Arc Pro', line_slug='stone-arc-pro', variant=var, variant_slug=vs, part=None,
        src=B + f'stone-arc-pro-portable-speaker-{f}.png', src_url=tsv[('stone-arc-pro-portable-speaker', f)],
        fetched='research download (boAt Shopify CDN)', view='34', cut=cut, cut_kw=kw, rotate=-22.7,
        fit=dict(height_px=1160, max_h=1160), printed=None, image_role='product 3/4 view on white', caveats=cav,
        depth=60, cast=dict(blur=14, opacity=0.35))

# ---------------------------------------------------------------- CP Plus
P = S + '/dl-cpplus/img/'
for model, mp, f, uuid in [('CP-E28Q', '2MP', 'cp-e28q-1.jpg', 'e2c311b3-d885-402c-a86b-0eba84729368'),
                           ('CP-E38Q', '3MP', 'cp-e38q-0.jpg', 'bdb3759a-592d-4d66-901f-ed531af0dfc6'),
                           ('CP-E48Q', '4MP', 'cp-e48q-1.jpg', '97a45c90-03b4-4ad4-8064-e1e8539be404')]:
    cav = ['Official image is only 400 x 520 px: upscaled about 2.5x, so the result is soft.']
    if model != 'CP-E28Q':
        cav.append('The CP-E38Q and CP-E48Q pages use the same (byte-identical) photo; the body is the same, only the sensor differs.')
    add(range='cpplus', line='CP Plus ezyKam+ Wi-Fi pan/tilt camera (CP-E28Q / E38Q / E48Q)', line_slug='ezykam-wifi-pt-camera',
        variant=f'{model} ({mp})', variant_slug=slug(model + '-' + mp), part=model, src=P + f,
        src_url=f'https://www.cpplusworld.com/prodassets/product/small/{uuid}.jpg', fetched='research download (cpplusworld.com product gallery "largeimage")',
        view='front', cut='key', cut_kw=dict(r_in=3, r_out=2, trust_net_below=30.0), fit=dict(height_px=1160, max_h=1160),
        printed=None, image_role='product front on white', caveats=cav, depth=55, cast=dict(blur=12, opacity=0.3))

json.dump(dict(jobs=jobs, nomatch=nomatch, skipped=skipped), sys.stdout, indent=1)
