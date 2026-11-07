import json, sys, re
S = sys.argv[1]
out = []
def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
mc = json.load(open(S + '/catalog-research/memory-cards/range.json'))
for L in mc['lines']:
    if L['brand'] != 'Samsung' if 'brand' in L else 'Samsung' not in L['line']: continue
    for v in L.get('variants', []):
        for im in v['images']:
            u = im['sourceUrl'].split('?')[0]
            role = {'main': 'front', 'front-sd-adapter': 'adapter', 'front-pkg': 'pack'}.get(im.get('galleryLabel'), slug(im['role']))
            out.append(('memory-cards', slug(v['partNumber']) + '-' + role + '.png', u + '?$ORIGIN_PNG$'))
ssd = json.load(open(S + '/catalog-research/ssd/range.json'))
for L in ssd['lines']:
    if L['brand'] != 'Samsung': continue
    for v in L.get('variants', []):
        for im in v['images']:
            u = im['sourceUrl'].split('?')[0]
            role = {'front': 'front', 'angle (r-perspective)': 'angle', 'pack front': 'pack'}[im['role']]
            out.append(('ssd', slug(v['partNumber']) + '-' + role + '.png', u + '?$ORIGIN_PNG$'))
for r in out: print('\t'.join(r))
