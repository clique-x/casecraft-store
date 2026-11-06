#!/usr/bin/env node
// Turns the square campaign images in SRC_DIR into the files the site serves from public/promo.
//
//   node scripts/promo-art/export.mjs SRC_DIR
//
// SRC_DIR holds brand-hero.png, audio-sealed.png, covers-character.png and combo-protection.png
// (covers-character.png after clean-covers.py, see README.md), and the wide desktop versions listed in
// WIDE, such as combo-protection-wide.png. Writes:
//   <name>-600.webp, <name>-1200.webp   the home page banners (square)
//   <wide>-1200.webp, <wide>-2000.webp  the desktop versions of a banner (their own ratio)
//   og-brand-hero-1200x630.jpg          link previews (the square centred on the site's ink colour)
//   og-brand-hero-1200x1200.jpg         square link previews
// Link previews are JPEG: some chat apps still show no preview for WebP.
import { mkdir, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const storefront = path.resolve(here, '../../apps/storefront');
const sharp = createRequire(path.join(storefront, 'package.json'))('sharp');
const OUT = path.join(storefront, 'public/promo');
const NAMES = ['brand-hero', 'audio-sealed', 'covers-character', 'combo-protection'];
const WIDTHS = [600, 1200];
/** Desktop versions of a banner: output name -> widths (capped at the source width). */
const WIDE = { 'combo-protection-wide': [1200, 2000] };
const INK = '#0D1D1F';

const src = process.argv[2];
if (!src) {
  console.error('usage: export.mjs SRC_DIR');
  process.exit(2);
}
await mkdir(OUT, { recursive: true });
const report = async (out) =>
  console.log(`${path.relative(storefront, out)}  ${((await stat(out)).size / 1024).toFixed(1)} KB`);

for (const name of NAMES) {
  const file = path.join(src, `${name}.png`);
  for (const w of WIDTHS) {
    const out = path.join(OUT, `${name}-${w}.webp`);
    await sharp(file).resize(w, w, { kernel: 'lanczos3' }).webp({ quality: 84, effort: 6, smartSubsample: true }).toFile(out);
    await report(out);
  }
}

for (const [name, widths] of Object.entries(WIDE)) {
  const file = path.join(src, `${name}.png`);
  const meta = await sharp(file).metadata();
  for (const want of widths) {
    const w = Math.min(want, meta.width);
    const out = path.join(OUT, `${name}-${want}.webp`);
    await sharp(file).resize(w, Math.round((meta.height * w) / meta.width), { kernel: 'lanczos3' }).webp({ quality: 84, effort: 6, smartSubsample: true }).toFile(out);
    await report(out);
  }
}

const hero = path.join(src, 'brand-hero.png');
const jpeg = { quality: 86, mozjpeg: true, chromaSubsampling: '4:4:4' };
const wide = path.join(OUT, 'og-brand-hero-1200x630.jpg');
await sharp({ create: { width: 1200, height: 630, channels: 3, background: INK } })
  .composite([{ input: await sharp(hero).resize(630, 630, { kernel: 'lanczos3' }).toBuffer(), gravity: 'centre' }])
  .jpeg(jpeg)
  .toFile(wide);
await report(wide);
const square = path.join(OUT, 'og-brand-hero-1200x1200.jpg');
await sharp(hero).resize(1200, 1200, { kernel: 'lanczos3' }).jpeg(jpeg).toFile(square);
await report(square);
