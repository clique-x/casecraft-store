// Turns a gadget's official product images into the store's variants:
// <srcDir>/<gadgetId>/<n>-<Caption>.{jpg,png,webp} (n = 0, 1, …; the caption names the view, dashes for spaces)
// → public/products/photos/gadgets/<gadgetId>/g-<n>-{160,480,960,1440}.webp (square, for the gallery, stage and thumbnails)
// → public/products/photos/gadgets/<gadgetId>/card-<n>-{320,480,720}.webp (4:5, for the cards)
// and prints the `gallery` captions to paste into lib/catalog/gadgets.ts. Run with `pnpm photos:gadgets <srcDir>`.
// `--teal`: the sources are full-bleed square shots on the GadgetsHub teal stage (catalog-sources/), so they keep
// their own background and the 4:5 cards are cropped from the centre instead of padded onto the light backdrop.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/products/photos/gadgets');
const GALLERY_WIDTHS = [160, 480, 960, 1440];
const CARD_WIDTHS = [320, 480, 720];
const CARD_ASPECT = 4 / 5;
// Transparent and off-square sources are padded onto the cards' light backdrop (surface-2 in globals.css).
const BACKDROP = { r: 244, g: 243, b: 239, alpha: 1 };
const WEBP = { quality: 82, effort: 4 };
const NAME = /^(\d+)-(.+)\.(jpe?g|png|webp)$/i;

async function imagesFor(dir) {
  const names = (await fs.readdir(dir)).filter((f) => NAME.test(f));
  return names
    .map((f) => {
      const [, n, caption] = f.match(NAME);
      return { n: parseInt(n, 10), caption: caption.replace(/-/g, ' '), file: path.join(dir, f) };
    })
    .sort((a, b) => a.n - b.n);
}

/**
 * Transparent sources are flattened onto the backdrop. Opaque ones (brand shots on a white studio background)
 * are multiplied by the backdrop colour, so their white turns into the backdrop exactly and every card and
 * gallery tile shares one background; the product itself shifts by a few percent at most.
 */
async function onBackdrop(file, teal) {
  const { data, info } = await sharp(file).rotate().toBuffer({ resolveWithObject: true });
  if (teal) return sharp(data).flatten({ background: { r: 8, g: 37, b: 46 } }).toBuffer();
  const meta = await sharp(data).metadata();
  if (meta.hasAlpha) return sharp(data).flatten({ background: BACKDROP }).toBuffer();
  const tint = { create: { width: info.width, height: info.height, channels: 3, background: BACKDROP } };
  return sharp(data).composite([{ input: tint, blend: 'multiply' }]).toBuffer();
}

async function writeImage(file, id, n, teal) {
  const flat = await onBackdrop(file, teal);
  const dir = path.join(OUT, id);
  for (const width of GALLERY_WIDTHS) {
    await sharp(flat)
      .resize({ width, height: width, fit: 'contain', background: BACKDROP })
      .webp(WEBP)
      .toFile(path.join(dir, `g-${n}-${width}.webp`));
  }
  for (const width of CARD_WIDTHS) {
    await sharp(flat)
      .resize({ width, height: Math.round(width / CARD_ASPECT), fit: teal ? 'cover' : 'contain', background: BACKDROP })
      .webp(WEBP)
      .toFile(path.join(dir, `card-${n}-${width}.webp`));
  }
}

/** Drops files left over from a longer gallery. */
async function pruneFrom(id, count) {
  const dir = path.join(OUT, id);
  for (const f of await fs.readdir(dir)) {
    const m = f.match(/^(?:g|card)-(\d+)-\d+\.webp$/);
    if (m && parseInt(m[1], 10) >= count) await fs.rm(path.join(dir, f));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const teal = args.includes('--teal');
  const srcDir = args.find((a) => !a.startsWith('--'));
  if (!srcDir) throw new Error('usage: node scripts/photo-gadgets.mjs [--teal] <srcDir with <gadgetId>/<n>-<Caption>.jpg>');
  const ids = (await fs.readdir(srcDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  for (const id of ids.sort()) {
    const images = await imagesFor(path.join(srcDir, id));
    if (images.length === 0) continue;
    await fs.mkdir(path.join(OUT, id), { recursive: true });
    for (const [i, img] of images.entries()) await writeImage(img.file, id, i, teal);
    await pruneFrom(id, images.length);
    console.log(`${id}: gallery: [${images.map((img) => JSON.stringify(img.caption)).join(', ')}]`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
