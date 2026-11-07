import json, sys, re
S = sys.argv[1]
def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
mc = json.load(open(S + '/catalog-research/memory-cards/range.json'))
for L in mc['lines']:
    if 'SanDisk' not in L['line']: continue
    for v in L.get('variants', []):
        for im in v['images']:
            if not im.get('localPath'):
                print('memory-cards\t' + im['sourceUrl'].split('/')[-1] + '\t' + im['sourceUrl'])
ssd = json.load(open(S + '/catalog-research/ssd/range.json'))
for L in ssd['lines']:
    if L['brand'] == 'Samsung': continue
    for v in L.get('variants', []):
        for im in v.get('images', []):
            if not im.get('downloaded') and im.get('sourceUrl'):
                print('ssd/' + L['id'] + '\t' + im['sourceUrl'].split('/')[-1] + '\t' + im['sourceUrl'] + '\t' + v['capacity'] + ' ' + str(v.get('heatsink')))
