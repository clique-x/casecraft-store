// Generates /public/products/photos/<id>/{320,480,720,960}.webp from the catalogue originals,
// trims transparent margins and writes the trimmed imageW/imageH + variants back into the JSON.
// Idempotent: an item is skipped when every variant is newer than its original and the JSON already
// carries the trimmed size. Run with `pnpm photos`.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = path.join(ROOT, 'src/lib/catalog/photo-catalog.json');
const PUBLIC = path.join(ROOT, 'public');
const WIDTHS = [320, 480, 720, 960];
const TRIM_THRESHOLD = 8;
// A phone cover standing upright is a little narrower than 1:2 (an iPhone 15 case is about 0.48),
// and one turned slightly to the side narrower still (about 0.41).
const ASPECT_MIN = 0.4;
const ASPECT_MAX = 1.6;
const WEBP = { quality: 78, alphaQuality: 90, effort: 4 };
// Placeholder completion (`complete: true`): today's shop photos stop where the glove held the case, so
// the bottom is mirrored down to this aspect, darkened towards the foot and given rounded corners. The
// result is a whole silhouette that stands on its own (`cut: 'full'`) until the owner's clean cutouts land.
const COMPLETE_ASPECT = 0.5;
const COMPLETE_CORNER = 0.1;
const COMPLETE_SHADE = 0.32;

async function mtime(file) {
  try {
    return (await fs.stat(file)).mtimeMs;
  } catch {
    return null;
  }
}

async function isFresh(item, original) {
  const sourceTime = await mtime(original);
  if (sourceTime === null) return false;
  if (!Array.isArray(item.variants) || item.variants.length !== WIDTHS.length) return false;
  if (!WIDTHS.every((w, i) => item.variants[i] === w)) return false;
  // A completed placeholder is only fresh once its catalogue size reflects the extension.
  if (item.complete === true && item.cut !== 'full') return false;
  for (const w of WIDTHS) {
    const t = await mtime(path.join(PUBLIC, 'products/photos', String(item.id), `${w}.webp`));
    if (t === null || t < sourceTime) return false;
  }
  return true;
}

/** Mirrors the trimmed photo's foot down to COMPLETE_ASPECT, shades the extension and rounds every corner. */
async function completeSilhouette(data, info) {
  const { width: w, height: h } = info;
  const target = Math.round(w / COMPLETE_ASPECT);
  if (target <= h) return { data, info };
  const extra = target - h;
  const r = Math.round(w * COMPLETE_CORNER);
  const shade = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${target}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="${COMPLETE_SHADE}"/>
    </linearGradient></defs>
    <rect x="0" y="${h - Math.round(extra * 0.15)}" width="${w}" height="${extra + Math.round(extra * 0.15)}" fill="url(#g)"/>
  </svg>`;
  const corners = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${target}">
    <rect x="0" y="0" width="${w}" height="${target}" rx="${r}" ry="${r}" fill="#fff"/>
  </svg>`;
  const extended = await sharp(data)
    .extend({ bottom: extra, extendWith: 'mirror' })
    .composite([{ input: Buffer.from(shade), blend: 'over' }])
    .png()
    .toBuffer();
  const out = await sharp(extended)
    .composite([{ input: Buffer.from(corners), blend: 'dest-in' }])
    .png()
    .toBuffer({ resolveWithObject: true });
  return { data: out.data, info: { ...info, width: out.info.width, height: out.info.height } };
}

async function processItem(item) {
  const original = path.join(PUBLIC, item.image);
  const label = `${item.id} ${item.design} · ${item.brand}`;

  if (typeof item.source === 'string' && /placeholder/i.test(item.source)) {
    console.warn(`warn  ${label}: source is a placeholder (${item.source})`);
  }

  if (await isFresh(item, original)) {
    console.log(`skip  ${label}: variants up to date`);
    return false;
  }

  const meta = await sharp(original).metadata();
  if (!meta.hasAlpha) throw new Error(`${label}: ${item.image} has no alpha channel; cutouts must be transparent`);

  const trimmed = sharp(original).trim({ threshold: TRIM_THRESHOLD });
  let { data, info } = await trimmed.toBuffer({ resolveWithObject: true });
  if (item.complete === true) {
    ({ data, info } = await completeSilhouette(data, info));
    item.cut = 'full';
  }
  const aspect = info.width / info.height;
  if (aspect < ASPECT_MIN || aspect > ASPECT_MAX) {
    throw new Error(`${label}: trimmed aspect ${aspect.toFixed(3)} is outside ${ASPECT_MIN}–${ASPECT_MAX}`);
  }

  const dir = path.join(PUBLIC, 'products/photos', String(item.id));
  await fs.mkdir(dir, { recursive: true });
  for (const width of WIDTHS) {
    await sharp(data)
      .resize({ width, withoutEnlargement: true })
      .webp(WEBP)
      .toFile(path.join(dir, `${width}.webp`));
  }

  item.imageW = info.width;
  item.imageH = info.height;
  item.variants = [...WIDTHS];
  console.log(`write ${label}: ${info.width}×${info.height} → ${WIDTHS.join('/')}`);
  return true;
}

async function main() {
  const items = JSON.parse(await fs.readFile(CATALOG, 'utf8'));
  if (!Array.isArray(items)) throw new Error('photo-catalog.json must be an array');

  let changed = 0;
  for (const item of items) {
    if (await processItem(item)) changed += 1;
  }

  if (changed > 0) {
    await fs.writeFile(CATALOG, `${JSON.stringify(items, null, 2)}\n`);
  }
  console.log(`${changed} of ${items.length} items regenerated`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
