// Turns hand-held product shots into the 4:5 card images: <srcDir>/<id>/<n>.jpg (n = 0, 1, …; 0 is the
// front-on shot) → public/products/photos/<id>/shot-<n>-{160,480,800}.webp, and writes `shots: <count>` into
// photo-catalog.json. Run with `pnpm photos:shots <srcDir>`.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = path.join(ROOT, 'src/lib/catalog/photo-catalog.json');
const OUT = path.join(ROOT, 'public/products/photos');
const WIDTHS = [160, 480, 800];
const ASPECT = 4 / 5;
// Crop a touch inside the frame (and off the bottom, where the holding hand is) so the cover reads larger.
const ZOOM = 0.95;
const TOP = 0.01;
const WEBP = { quality: 80, effort: 4 };

async function shotsFor(dir) {
  const names = (await fs.readdir(dir)).filter((f) => /^\d+\.(jpe?g|png|webp)$/i.test(f));
  return names.sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).map((f) => path.join(dir, f));
}

async function writeShot(file, id, n) {
  const { width: w = 0, height: h = 0 } = await sharp(file).metadata();
  const cropH = Math.round(Math.min(h, w / ASPECT) * ZOOM);
  const cropW = Math.round(cropH * ASPECT);
  const left = Math.round((w - cropW) / 2);
  const top = Math.min(Math.round(h * TOP), h - cropH);
  const region = sharp(file).rotate().extract({ left, top, width: cropW, height: cropH });
  const buf = await region.toBuffer();
  for (const width of WIDTHS) {
    await sharp(buf)
      .resize({ width, height: Math.round(width / ASPECT), fit: 'cover' })
      .webp(WEBP)
      .toFile(path.join(OUT, String(id), `shot-${n}-${width}.webp`));
  }
}

async function main() {
  const srcDir = process.argv[2];
  if (!srcDir) throw new Error('usage: node scripts/photo-shots.mjs <srcDir with <id>/<n>.jpg>');
  const items = JSON.parse(await fs.readFile(CATALOG, 'utf8'));
  let changed = 0;
  for (const item of items) {
    const dir = path.join(srcDir, String(item.id));
    const files = await shotsFor(dir).catch(() => []);
    if (files.length === 0) continue;
    await fs.mkdir(path.join(OUT, String(item.id)), { recursive: true });
    for (const [n, file] of files.entries()) await writeShot(file, item.id, n);
    item.shots = files.length;
    changed++;
    console.log(`write ${item.id} ${item.design}: ${files.length} shot(s)`);
  }
  await fs.writeFile(CATALOG, `${JSON.stringify(items, null, 2)}\n`);
  console.log(`${changed} item(s) updated`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
