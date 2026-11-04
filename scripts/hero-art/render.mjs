#!/usr/bin/env node
// Renders the non-product hero art (glass orbit, glass guard, plinths) to transparent PNGs with
// three.js in headless Chromium. Products are never drawn here: they are real shop photos (cutout.py).
//
//   node scripts/hero-art/render.mjs OUT_DIR [scene ...]
//
// Each scene renders at 2x and is downsampled for clean edges. Needs the storefront's dependencies
// (three, sharp) and Playwright's Chromium (WebGL runs on SwiftShader, so no GPU is needed).
import { mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const storefront = path.resolve(here, '../../apps/storefront');
const require = createRequire(path.join(storefront, 'package.json'));
const sharp = require('sharp');
const threeBuild = path.dirname(require.resolve('three'));

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = await import('playwright'));
}

/** name -> output size in px (rendered at 2x, then downsampled). */
const SIZES = {
  orbit: [2200, 1380],
  guard: [1000, 1400],
  plinth: [2000, 1000],
  plinthStone: [2000, 1000],
};

const [outDir, ...only] = process.argv.slice(2);
if (!outDir) {
  console.error('usage: render.mjs OUT_DIR [scene ...]');
  process.exit(2);
}
await mkdir(outDir, { recursive: true });

const PAGE = `<!doctype html><meta charset="utf-8">
<script type="importmap">{"imports":{"three":"/three/three.module.js"}}</script>
<script type="module">import { renderScene } from '/scenes.js'; window.renderScene = renderScene; window.ready = true;</script>`;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
page.on('console', (m) => m.type() === 'error' && console.error('[page]', m.text()));
page.on('pageerror', (e) => console.error('[page]', e.message));
await page.route('http://art.local/**', async (route) => {
  const { pathname } = new URL(route.request().url());
  if (pathname === '/') return route.fulfill({ contentType: 'text/html', body: PAGE });
  if (pathname === '/scenes.js') return route.fulfill({ contentType: 'text/javascript', body: await readFile(path.join(here, 'scenes.js')) });
  if (pathname.startsWith('/three/')) {
    return route.fulfill({ contentType: 'text/javascript', body: await readFile(path.join(threeBuild, path.basename(pathname))) });
  }
  return route.fulfill({ status: 404, body: '' });
});
await page.goto('http://art.local/');
await page.waitForFunction(() => window.ready === true);

for (const [name, [w, h]] of Object.entries(SIZES)) {
  if (only.length && !only.includes(name)) continue;
  const dataUrl = await page.evaluate(([n, ww, hh]) => window.renderScene(n, ww, hh), [name, w * 2, h * 2]);
  const png = Buffer.from(dataUrl.split(',')[1], 'base64');
  // Downsample 2x -> 1x, then trim fully transparent margins (keep 2% padding).
  const half = await sharp(png).resize(w, h, { kernel: 'lanczos3' }).png().toBuffer();
  const trimmed = await sharp(half).trim({ threshold: 1 }).png().toBuffer({ resolveWithObject: true });
  const pad = Math.round(Math.max(trimmed.info.width, trimmed.info.height) * 0.02);
  const file = path.join(outDir, `${name}.png`);
  await sharp(trimmed.data)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(file);
  console.log(`${file}: ${trimmed.info.width + pad * 2}x${trimmed.info.height + pad * 2}`);
}
await browser.close();
