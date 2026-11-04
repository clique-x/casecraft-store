#!/usr/bin/env node
// Turns the cutouts and renders in WORK_DIR into the responsive WebP files the home page uses.
//
//   node scripts/hero-art/export.mjs WORK_DIR
//
// Writes apps/storefront/public/home/<name>-<width>.webp (alpha kept) and prints each file's size,
// so the sizes in src/components/home/showcase/showcase-data.ts and CategoryTiles.tsx can be checked against it.
import { mkdir, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const storefront = path.resolve(here, '../../apps/storefront');
const sharp = createRequire(path.join(storefront, 'package.json'))('sharp');
const OUT = path.join(storefront, 'public/home');

/** source file in WORK_DIR -> [output name, widths]. The largest width is capped at the source width. */
const MANIFEST = {
  'phone-magsafe.png': ['phone-magsafe', [320, 560]],
  'phone-sf-carbon.png': ['phone-sf-carbon', [300, 580]],
  'render/orbit.png': ['orbit', [760, 1500]],
  'render/guard.png': ['guard', [320, 640]],
  'render/plinth.png': ['plinth', [560, 1000]],
  'render/plinthStone.png': ['plinth-stone', [560, 1000]],
};

const work = process.argv[2];
if (!work) {
  console.error('usage: export.mjs WORK_DIR');
  process.exit(2);
}
await mkdir(OUT, { recursive: true });
for (const [src, [name, widths]] of Object.entries(MANIFEST)) {
  const file = path.join(work, src);
  const meta = await sharp(file).metadata();
  for (const want of widths) {
    const w = Math.min(want, meta.width);
    const h = Math.round((meta.height * w) / meta.width);
    const out = path.join(OUT, `${name}-${want}.webp`);
    await sharp(file).resize(w, h, { kernel: 'lanczos3' }).webp({ quality: 84, alphaQuality: 92, effort: 6, smartSubsample: true }).toFile(out);
    console.log(`${path.relative(storefront, out)}  ${w}x${h}  ${((await stat(out)).size / 1024).toFixed(1)} KB`);
  }
}
