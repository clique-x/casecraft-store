// Turns a product's gallery images into the square product-page gallery:
// <srcDir>/<id>/<n>-<Label>.jpg (n = 0, 1, …; the label names the view, dashes for spaces)
// → public/products/photos/<id>/g-<n>-{480,960,1440}.webp, and writes `gallery: [labels]` into
// photo-catalog.json. Order is the display order: the back on its own, then in hand, then the
// other views, the spec card last. Run with `pnpm photos:gallery <srcDir>`.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = path.join(ROOT, 'src/lib/catalog/photo-catalog.json');
const OUT = path.join(ROOT, 'public/products/photos');
const WIDTHS = [480, 960, 1440];
const WEBP = { quality: 80, effort: 4 };
const NAME = /^(\d+)-(.+)\.(jpe?g|png|webp)$/i;

async function galleryFor(dir) {
  const names = (await fs.readdir(dir)).filter((f) => NAME.test(f));
  return names
    .map((f) => {
      const [, n, label] = f.match(NAME);
      return { n: parseInt(n, 10), label: label.replace(/-/g, ' '), file: path.join(dir, f) };
    })
    .sort((a, b) => a.n - b.n);
}

async function writeImage(file, id, n) {
  // Square cover crop, centred; sources are square already, so this only evens out stray sizes.
  const buf = await sharp(file).rotate().toBuffer();
  for (const width of WIDTHS) {
    await sharp(buf)
      .resize({ width, height: width, fit: 'cover', withoutEnlargement: false })
      .webp(WEBP)
      .toFile(path.join(OUT, String(id), `g-${n}-${width}.webp`));
  }
}

/** Drops g-<n>-*.webp files left over from a longer gallery. */
async function pruneFrom(id, count) {
  const dir = path.join(OUT, String(id));
  for (const f of await fs.readdir(dir)) {
    const m = f.match(/^g-(\d+)-\d+\.webp$/);
    if (m && parseInt(m[1], 10) >= count) await fs.rm(path.join(dir, f));
  }
}

async function main() {
  const srcDir = process.argv[2];
  if (!srcDir) throw new Error('usage: node scripts/photo-gallery.mjs <srcDir with <id>/<n>-<Label>.jpg>');
  const items = JSON.parse(await fs.readFile(CATALOG, 'utf8'));
  let changed = 0;
  for (const item of items) {
    const images = await galleryFor(path.join(srcDir, String(item.id))).catch(() => []);
    if (images.length === 0) continue;
    await fs.mkdir(path.join(OUT, String(item.id)), { recursive: true });
    for (const [i, img] of images.entries()) await writeImage(img.file, item.id, i);
    await pruneFrom(item.id, images.length);
    item.gallery = images.map((img) => img.label);
    changed++;
    console.log(`write ${item.id} ${item.design}: ${images.length} image(s)`);
  }
  await fs.writeFile(CATALOG, `${JSON.stringify(items, null, 2)}\n`);
  console.log(`${changed} item(s) updated`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
