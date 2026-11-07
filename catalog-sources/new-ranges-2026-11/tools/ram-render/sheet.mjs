#!/usr/bin/env node
// Contact sheet: the 12 RAM listing images at 512 px, labelled, 4 per row (main + flat per module).
//   node sheet.mjs DIR
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire('/home/user/casecraft-store/apps/storefront/package.json');
const sharp = require('sharp');
const dir = process.argv[2];

const MODULES = [
  ['desktop-ddr3', 'Desktop DDR3 UDIMM'],
  ['laptop-ddr3l', 'Laptop DDR3L SO-DIMM'],
  ['desktop-ddr4', 'Desktop DDR4 UDIMM'],
  ['laptop-ddr4', 'Laptop DDR4 SO-DIMM'],
  ['desktop-ddr5', 'Desktop DDR5 UDIMM'],
  ['laptop-ddr5', 'Laptop DDR5 SO-DIMM'],
];
const CELL = 512;
const LABEL = 44;
const GAP = 12;
const COLS = 4;
const tiles = [];
for (const [slug, name] of MODULES) {
  tiles.push([`${slug}-main.png`, `${name} · main`]);
  tiles.push([`${slug}-flat.png`, `${name} · flat`]);
}
const rows = Math.ceil(tiles.length / COLS);
const W = COLS * CELL + (COLS + 1) * GAP;
const H = rows * (CELL + LABEL) + (rows + 1) * GAP;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const comp = [];
for (const [i, [file, label]] of tiles.entries()) {
  const x = GAP + (i % COLS) * (CELL + GAP);
  const y = GAP + Math.floor(i / COLS) * (CELL + LABEL + GAP);
  comp.push({ input: await sharp(path.join(dir, file)).resize(CELL, CELL, { kernel: 'lanczos3' }).toBuffer(), left: x, top: y });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL}" height="${LABEL}">
    <text x="4" y="29" font-family="DejaVu Sans, Arial, sans-serif" font-size="19" fill="#d8f3f7">${esc(label)}</text>
    <text x="${CELL - 4}" y="29" text-anchor="end" font-family="DejaVu Sans Mono, monospace" font-size="14" fill="#6fb9c6">${esc(file)}</text>
  </svg>`;
  comp.push({ input: Buffer.from(svg), left: x, top: y + CELL });
}
const out = path.join(dir, 'ram-sheet.jpg');
await sharp({ create: { width: W, height: H, channels: 3, background: '#061a20' } })
  .composite(comp)
  .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
  .toFile(out);
console.log(out, W, H);
