// usage: node acc-photos.mjs <storefront public dir> <id>=<src0>,<src1>... ; square gallery webps for accessories
import path from 'node:path';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(path.join(process.cwd(), 'package.json'));
const sharp = require('sharp');
const [pub, ...pairs] = process.argv.slice(2);
for (const pair of pairs) {
  const [id, list] = pair.split('=');
  const dir = path.join(pub, 'products/photos/accessories', id);
  await fs.mkdir(dir, { recursive: true });
  for (const [n, src] of list.split(',').entries()) {
    for (const w of [160, 480, 960, 1440]) {
      await sharp(src).resize({ width: w, height: w, fit: 'cover' }).webp({ quality: 80, effort: 4 }).toFile(path.join(dir, `g-${n}-${w}.webp`));
    }
  }
  console.log(id, list.split(',').length);
}
