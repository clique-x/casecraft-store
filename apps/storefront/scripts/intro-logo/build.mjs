// Trims the supplied EarthClique logo (scripts/intro-logo/earthclique-logo-supplied.png, a 1254×1254 frame with
// the logo on pure black) to the logo plus a small black margin, without touching a single logo pixel: no
// resampling at native size, no colour change, no keying. Writes public/brand/intro/:
//   earthclique-logo.png       trimmed master, lossless
//   earthclique-logo-<w>.webp  native width and half width, lossless, on black as supplied
//   earthclique-logo-alpha*    the same with the black lifted out to transparency (used by the intro)
// and prints the sizes to paste into src/components/intro/intro-config.ts. Run: node scripts/intro-logo/build.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'earthclique-logo-supplied.png');
const OUT = path.resolve(HERE, '../../public/brand/intro');
/** Black kept around the artwork, in source pixels, so anti-aliased edges never touch the crop. */
const MARGIN = 16;

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * 3;
    if (data[i] | data[i + 1] | data[i + 2]) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
}
if (x1 < 0) throw new Error('the logo file is entirely black');
const left = Math.max(0, x0 - MARGIN);
const top = Math.max(0, y0 - MARGIN);
const width = Math.min(info.width, x1 + 1 + MARGIN) - left;
const height = Math.min(info.height, y1 + 1 + MARGIN) - top;

await fs.mkdir(OUT, { recursive: true });
const trimmed = sharp(SRC).removeAlpha().extract({ left, top, width, height });
await trimmed.clone().png({ compressionLevel: 9 }).toFile(path.join(OUT, 'earthclique-logo.png'));
const half = Math.round(width / 2);
await trimmed.clone().webp({ lossless: true }).toFile(path.join(OUT, `earthclique-logo-${width}.webp`));
await trimmed.clone().resize({ width: half, kernel: 'lanczos3' }).webp({ lossless: true }).toFile(path.join(OUT, `earthclique-logo-${half}.webp`));
// Transparent version: the artwork is light on pure black, so each pixel's alpha is its brightest channel and its
// colour is divided back out of the black (un-premultiplied). Laid over black it reproduces the supplied file
// exactly; over the intro's glass it shows the same white, cyan and orange with clean anti-aliased edges.
const { data: px, info: ti } = await trimmed.clone().raw().toBuffer({ resolveWithObject: true });
const rgba = Buffer.alloc(ti.width * ti.height * 4);
for (let i = 0, j = 0; i < px.length; i += 3, j += 4) {
  const m = Math.max(px[i], px[i + 1], px[i + 2]);
  // 0–2 is compression noise in the black canvas, not artwork.
  const a = m <= 2 ? 0 : m;
  rgba[j + 3] = a;
  if (a) {
    rgba[j] = Math.min(255, Math.round((px[i] * 255) / a));
    rgba[j + 1] = Math.min(255, Math.round((px[i + 1] * 255) / a));
    rgba[j + 2] = Math.min(255, Math.round((px[i + 2] * 255) / a));
  }
}
const alpha = () => sharp(rgba, { raw: { width: ti.width, height: ti.height, channels: 4 } });
await alpha().png({ compressionLevel: 9 }).toFile(path.join(OUT, 'earthclique-logo-alpha.png'));
await alpha().webp({ lossless: true }).toFile(path.join(OUT, `earthclique-logo-alpha-${width}.webp`));
await alpha().resize({ width: half, kernel: 'lanczos3' }).webp({ lossless: true }).toFile(path.join(OUT, `earthclique-logo-alpha-${half}.webp`));

console.log(JSON.stringify({ crop: { left, top, width, height }, files: [`earthclique-logo-alpha-${half}.webp`, `earthclique-logo-alpha-${width}.webp`], aspect: +(width / height).toFixed(4) }));
