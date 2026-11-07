#!/usr/bin/env node
// Renders the GadgetsHub RAM listing images with three.js in headless Chromium (SwiftShader).
//
//   node render.mjs OUT_DIR [--scale N] [--size PX] [name ...]
//
// name is "<slug>-main", "<slug>-flat", "plate-front" or "plate-34" (default: all).
// Each image renders at size*scale and is downsampled with Lanczos, then gets a soft vignette
// and fine grain. Reuses the casecraft storefront's three and sharp, read-only.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const storefront = '/home/user/casecraft-store/apps/storefront';
const require = createRequire(path.join(storefront, 'package.json'));
const sharp = require('sharp');
const threeBuild = path.dirname(require.resolve('three'));
const threeJsm = path.join(threeBuild, '..', 'examples', 'jsm');
const { chromium } = createRequire(import.meta.url)('/opt/node-tools/node_modules/playwright');

const args = process.argv.slice(2);
const outDir = args.shift();
let scale = 2;
let size = 2048;
const only = [];
while (args.length) {
  const a = args.shift();
  if (a === '--scale') scale = Number(args.shift());
  else if (a === '--size') size = Number(args.shift());
  else only.push(a);
}
if (!outDir) {
  console.error('usage: render.mjs OUT_DIR [--scale N] [--size PX] [name ...]');
  process.exit(2);
}
await mkdir(outDir, { recursive: true });

const SLUGS = ['desktop-ddr3', 'laptop-ddr3l', 'desktop-ddr4', 'laptop-ddr4', 'desktop-ddr5', 'laptop-ddr5'];
const JOBS = [];
for (const s of SLUGS) {
  JOBS.push({ name: `${s}-main`, module: s, view: 'main' });
  JOBS.push({ name: `${s}-flat`, module: s, view: 'flat' });
}
JOBS.push({ name: 'plate-front', module: null, view: 'plateFront' });
JOBS.push({ name: 'plate-34', module: null, view: 'plate34' });

const PAGE = `<!doctype html><meta charset="utf-8">
<script type="importmap">{"imports":{"three":"/three/three.module.js","three/addons/":"/jsm/"}}</script>
<script type="module" src="/ram-scene.js"></script>`;

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && console.error('[page]', m.text()));
page.on('pageerror', (e) => console.error('[page]', e.message));
await page.route('http://art.local/**', async (route) => {
  const { pathname } = new URL(route.request().url());
  try {
    if (pathname === '/') return route.fulfill({ contentType: 'text/html', body: PAGE });
    if (pathname === '/ram-scene.js') return route.fulfill({ contentType: 'text/javascript', body: await readFile(path.join(here, 'ram-scene.js')) });
    if (pathname.startsWith('/three/')) return route.fulfill({ contentType: 'text/javascript', body: await readFile(path.join(threeBuild, path.basename(pathname))) });
    if (pathname.startsWith('/jsm/')) return route.fulfill({ contentType: 'text/javascript', body: await readFile(path.join(threeJsm, pathname.slice(5))) });
  } catch (e) {
    console.error('route', pathname, e.message);
  }
  return route.fulfill({ status: 404, body: '' });
});
await page.goto('http://art.local/');
await page.waitForFunction(() => window.ramReady === true, null, { timeout: 60000 });

/** Soft vignette (multiply) + fine monochrome grain (soft-light), at final size. */
async function finish(buf, w) {
  const vignette = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}">
      <defs><radialGradient id="v" cx="50%" cy="46%" r="72%">
        <stop offset="0.55" stop-color="#ffffff"/><stop offset="1" stop-color="#9aa4a6"/>
      </radialGradient></defs>
      <rect width="100%" height="100%" fill="url(#v)"/></svg>`,
  );
  const n = Buffer.alloc(w * w);
  let s = 1234567;
  for (let i = 0; i < n.length; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    n[i] = 128 + ((s >> 16) % 13) - 6;
  }
  const grain = await sharp(n, { raw: { width: w, height: w, channels: 1 } }).png().toBuffer();
  return sharp(buf)
    .composite([
      { input: vignette, blend: 'multiply' },
      { input: grain, blend: 'soft-light' },
    ])
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const metaAll = {};
for (const job of JOBS) {
  if (only.length && !only.includes(job.name)) continue;
  const t0 = Date.now();
  const { png, meta } = await page.evaluate((o) => window.renderRam(o), { module: job.module, view: job.view, size: Math.round(size * scale) });
  const raw = Buffer.from(png.split(',')[1], 'base64');
  const down = await sharp(raw).resize(size, size, { kernel: 'lanczos3' }).png().toBuffer();
  const out = await finish(down, size);
  const file = path.join(outDir, `${job.name}.png`);
  await writeFile(file, out);
  const f = scale;
  metaAll[job.name] = Object.fromEntries(Object.entries(meta).map(([k, v]) => [k, Array.isArray(v) && k !== 'keyLight' ? v.map((x) => Math.round(x / f)) : v]));
  console.log(`${file}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
await writeFile(path.join(outDir, 'render-meta.json'), JSON.stringify(metaAll, null, 2));
await browser.close();
