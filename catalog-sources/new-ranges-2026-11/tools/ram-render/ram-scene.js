// Browser-side three.js scene for the GadgetsHub RAM listing renders.
// Builds an unbranded memory module (JEDEC outline, contacts, key notch, chips, passives) standing
// on a velvet-draped podium in front of the shop's deep-teal backdrop with a cyan rim glow.
// All module dimensions are in millimetres, in "display" orientation: x from the left end,
// y up from the contact edge, front face (label side) towards +z.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ---------------------------------------------------------------------------------------------
// Module specs (see README.md for where each number comes from)
// ---------------------------------------------------------------------------------------------
const DIMM_CHIPS_DDR3 = { w: 9.0, h: 11.0, y: 16.0, xs: [-55.5, -41, -26.5, -12, 12, 26.5, 41, 55.5] };
const DIMM_CHIPS_DDR45 = { w: 7.5, h: 11.0, y: 17.0, xs: [-55, -40.5, -26, -11.5, 11.5, 26, 40.5, 55] };

export const SPECS = {
  'desktop-ddr3': {
    form: 'dimm', W: 133.35, H: 30.0, T: 1.27, pitch: 1.0, nLeft: 48, nRight: 72, gap: 5.0,
    padW: 0.75, padTop: 4.0, notchW: 2.0, notchD: 4.3, curve: null,
    latchY: 17.3, latchR: 1.25, chamfer: 1.25, corner: 0.75, pcb: 'green3',
    chips: DIMM_CHIPS_DDR3, label: { w: 13.0, h: 11.0, y: 16.0 }, pmic: null,
  },
  'desktop-ddr4': {
    form: 'dimm', W: 133.35, H: 31.25, T: 1.27, pitch: 0.85, nLeft: 77, nRight: 67, gap: 3.0,
    padW: 0.6, padTop: 3.6, notchW: 1.8, notchD: 3.9, curve: { flat: 14, end: 64, rise: 1.0 },
    latchY: 17.8, latchR: 1.25, chamfer: 1.25, corner: 0.75, pcb: 'green4',
    chips: DIMM_CHIPS_DDR45, label: { w: 13.0, h: 11.0, y: 17.0 }, pmic: null,
  },
  'desktop-ddr5': {
    form: 'dimm', W: 133.35, H: 31.25, T: 1.27, pitch: 0.85, nLeft: 73, nRight: 71, gap: 3.0,
    padW: 0.6, padTop: 3.6, notchW: 1.8, notchD: 3.9, curve: null,
    latchY: 17.8, latchR: 1.25, chamfer: 1.25, corner: 0.75, pcb: 'black5',
    chips: DIMM_CHIPS_DDR45, label: { w: 13.0, h: 9.0, y: 15.9 }, pmic: { x: 0, y: 26.0 },
  },
  'laptop-ddr3l': {
    form: 'sodimm', W: 67.6, H: 30.0, T: 1.0, pitch: 0.6, nLeft: 36, nRight: 66, gap: 2.4,
    padW: 0.45, padTop: 3.0, notchW: 1.2, notchD: 3.4, curve: null,
    latchY: 20.0, latchR: 2.0, chamfer: 1.0, corner: 1.0, pcb: 'green3',
    chips: { w: 8.5, h: 11.0, y: 17.0, xs: [-25.5, -13, 13, 25.5] }, label: { w: 13.0, h: 11.0, y: 17.0 }, pmic: null,
  },
  'laptop-ddr4': {
    form: 'sodimm', W: 69.6, H: 30.0, T: 1.2, pitch: 0.5, nLeft: 58, nRight: 72, gap: 2.0,
    padW: 0.35, padTop: 3.0, notchW: 1.2, notchD: 3.3, curve: null,
    latchY: 20.0, latchR: 2.0, chamfer: 1.0, corner: 1.0, pcb: 'green4',
    chips: { w: 7.5, h: 11.0, y: 17.0, xs: [-24.5, -12.5, 12.5, 24.5] }, label: { w: 13.5, h: 11.0, y: 17.0 }, pmic: null,
  },
  'laptop-ddr5': {
    form: 'sodimm', W: 69.6, H: 30.0, T: 1.2, pitch: 0.5, nLeft: 64, nRight: 67, gap: 2.0,
    padW: 0.35, padTop: 3.0, notchW: 1.2, notchD: 3.3, curve: null,
    latchY: 20.0, latchR: 2.0, chamfer: 1.0, corner: 1.0, pcb: 'black5',
    chips: { w: 7.5, h: 11.0, y: 16.5, xs: [-24.5, -12.5, 12.5, 24.5] }, label: { w: 13.5, h: 8.0, y: 15.0 }, pmic: { x: 0, y: 25.0 },
  },
};

const PCB_COLORS = {
  green3: { mask: '#0d4526', trace: '#17623a', plane: '#105030', bare: '#41583a', edge: '#55663f' },
  green4: { mask: '#0b3d23', trace: '#125433', plane: '#0d4328', bare: '#3b5034', edge: '#4f6040' },
  black5: { mask: '#070809', trace: '#121516', plane: '#0b0c0d', bare: '#24241f', edge: '#262624' },
};

// ---------------------------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------------------------
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Height of the contact edge above y=0 at x (DDR4 desktop has the curved edge). */
function edgeY(spec, x) {
  if (!spec.curve) return 0;
  const dx = Math.abs(x - spec.W / 2);
  return spec.curve.rise * smooth(spec.curve.flat, spec.curve.end, dx);
}

/** Contact-pad centres (front side) and key notch centre, all in mm from the left end. */
export function contactLayout(spec) {
  const spanL = (spec.nLeft - 1) * spec.pitch;
  const spanR = (spec.nRight - 1) * spec.pitch;
  const margin = (spec.W - spanL - spanR - spec.gap) / 2;
  const xs = [];
  for (let i = 0; i < spec.nLeft; i++) xs.push(margin + i * spec.pitch);
  const r0 = margin + spanL + spec.gap;
  for (let j = 0; j < spec.nRight; j++) xs.push(r0 + j * spec.pitch);
  const notch = margin + spanL + spec.gap / 2;
  return { xs, notch, margin, spanL, spanR };
}

function outlineShape(spec) {
  const { W, H, chamfer: c, latchY: ly, latchR: lr, corner: rc, notchW: nw, notchD: nd } = spec;
  const { notch: xn } = contactLayout(spec);
  const s = new THREE.Shape();
  const e = (x) => edgeY(spec, x);
  s.moveTo(0, e(0) + c);
  s.lineTo(c, e(c));
  const step = 0.5;
  for (let x = c + step; x < xn - nw / 2; x += step) s.lineTo(x, e(x));
  s.lineTo(xn - nw / 2, e(xn - nw / 2));
  s.lineTo(xn - nw / 2, nd - nw / 2);
  s.absarc(xn, nd - nw / 2, nw / 2, Math.PI, 0, true);
  s.lineTo(xn + nw / 2, e(xn + nw / 2));
  for (let x = Math.ceil((xn + nw / 2) / step) * step; x < W - c; x += step) s.lineTo(x, e(x));
  s.lineTo(W - c, e(W - c));
  s.lineTo(W, e(W) + c);
  s.lineTo(W, ly - lr);
  s.absarc(W, ly, lr, -Math.PI / 2, Math.PI / 2, true);
  s.lineTo(W, H - rc);
  s.absarc(W - rc, H - rc, rc, 0, Math.PI / 2, false);
  s.lineTo(rc, H);
  s.absarc(rc, H - rc, rc, Math.PI / 2, Math.PI, false);
  s.lineTo(0, ly + lr);
  s.absarc(0, ly, lr, Math.PI / 2, -Math.PI / 2, true);
  s.lineTo(0, e(0) + c);
  return s;
}

// ---------------------------------------------------------------------------------------------
// Component layout (passives, SPD, PMIC) in module coordinates
// ---------------------------------------------------------------------------------------------
function layoutParts(spec) {
  const cx0 = spec.W / 2;
  const ch = spec.chips;
  const parts = { caps: [], bigcaps: [], rnets: [], res: [], spd: null, pmic: null, inductors: [] };
  const chipRects = ch.xs.map((x) => ({ x: cx0 + x, y: ch.y, w: ch.w, h: ch.h }));
  const bottom = ch.y - ch.h / 2;
  const top = ch.y + ch.h / 2;
  chipRects.forEach((c, i) => {
    // Series-termination resistor arrays under each chip, decoupling caps below them.
    const nArr = spec.form === 'dimm' ? 3 : 3;
    for (let k = 0; k < nArr; k++) parts.rnets.push({ x: c.x + (k - (nArr - 1) / 2) * 2.45, y: bottom - 1.45 });
    parts.caps.push({ x: c.x - 1.6, y: bottom - 3.15, rot: 0 });
    parts.caps.push({ x: c.x + 1.6, y: bottom - 3.15, rot: 0 });
    // Decoupling above the package.
    parts.caps.push({ x: c.x - 1.9, y: top + 1.15, rot: 0 });
    parts.caps.push({ x: c.x + 1.9, y: top + 1.15, rot: 0 });
    if (spec.form === 'dimm') parts.res.push({ x: c.x, y: top + 2.7, rot: 0 });
    // Side caps only between neighbouring chips of the same group.
    const next = chipRects[i + 1];
    if (next && Math.sign(next.x - cx0) === Math.sign(c.x - cx0)) {
      const gx = (c.x + c.w / 2 + next.x - next.w / 2) / 2;
      parts.caps.push({ x: gx, y: c.y + 2.6, rot: 1 });
      parts.caps.push({ x: gx, y: c.y - 1.2, rot: 1 });
    }
  });
  // SPD EEPROM / SPD hub below the label in the centre gap.
  const spdY = spec.padTop + 4.2;
  parts.spd = { x: cx0 + 3.2, y: spdY, w: 2.0, h: 3.0 };
  parts.caps.push({ x: cx0 - 0.4, y: spdY, rot: 1 });
  parts.res.push({ x: cx0 + 6.0, y: spdY + 0.6, rot: 1 });
  parts.res.push({ x: cx0 - 2.0, y: spdY, rot: 1 });
  if (spec.pmic) {
    const px = cx0 + spec.pmic.x;
    const py = spec.pmic.y;
    parts.pmic = { x: px + 0.8, y: py, s: 3.0 };
    parts.inductors.push({ x: px - 4.6, y: py + 1.45, w: 2.5, h: 2.0 });
    parts.inductors.push({ x: px - 4.6, y: py - 1.45, w: 2.5, h: 2.0 });
    parts.inductors.push({ x: px + 5.0, y: py + 0.2, w: 2.0, h: 2.5 });
    parts.bigcaps.push({ x: px - 1.4, y: py + 2.75, rot: 0 });
    parts.bigcaps.push({ x: px + 1.8, y: py + 2.75, rot: 0 });
    parts.bigcaps.push({ x: px - 1.6, y: py - 2.75, rot: 0 });
    parts.bigcaps.push({ x: px + 1.8, y: py - 2.75, rot: 0 });
    parts.caps.push({ x: px + 3.05, y: py - 0.9, rot: 1 });
  }
  return { chipRects, parts };
}

// ---------------------------------------------------------------------------------------------
// PCB texture (solder mask, copper traces under mask, vias, bare laminate between fingers)
// ---------------------------------------------------------------------------------------------
function pcbTextures(spec, layout) {
  const col = PCB_COLORS[spec.pcb];
  const pxmm = Math.min(3900 / spec.W, 56);
  const cw = Math.round(spec.W * pxmm);
  const chh = Math.round(spec.H * pxmm);
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = cw;
    c.height = chh;
    const g = c.getContext('2d');
    g.setTransform(pxmm, 0, 0, -pxmm, 0, chh);
    return [c, g];
  };
  const [cA, a] = mk(); // albedo
  const [cB, b] = mk(); // bump
  const R = rng(spec.W * 1000 + spec.nLeft * 7 + spec.nRight);
  const { xs } = contactLayout(spec);
  const cx0 = spec.W / 2;
  const { chipRects, parts } = layout;

  a.fillStyle = col.mask;
  a.fillRect(0, 0, spec.W, spec.H);
  b.fillStyle = '#808080';
  b.fillRect(0, 0, spec.W, spec.H);

  // Copper pours (slightly lighter plane areas) above the chip row and in the gaps.
  a.fillStyle = col.plane;
  b.fillStyle = '#868686';
  const chipTop = spec.chips.y + spec.chips.h / 2;
  const rect = (g, x, y, w, h) => g.fillRect(x, y, w, h);
  for (const g of [a, b]) {
    rect(g, 2.5, chipTop + 2.0, spec.W - 5, spec.H - chipTop - 3.2);
  }

  // Faint mottling of the mask.
  for (let i = 0; i < 420; i++) {
    a.fillStyle = `rgba(255,255,255,${0.003 + R() * 0.005})`;
    const r = 0.4 + R() * 2.2;
    a.beginPath();
    a.arc(R() * spec.W, R() * spec.H, r, 0, Math.PI * 2);
    a.fill();
  }

  const line = (g, pts, w) => {
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
    g.stroke();
  };
  const both = (fn) => {
    a.strokeStyle = col.trace;
    a.fillStyle = col.trace;
    b.strokeStyle = '#a8a8a8';
    b.fillStyle = '#a8a8a8';
    fn(a);
    fn(b);
  };

  // Bare laminate band between the fingers (the solder mask stops just above the pads).
  const maskEdge = spec.padTop + 0.35;
  a.fillStyle = col.bare;
  a.fillRect(0, 0, spec.W, maskEdge);
  b.fillStyle = '#7a7a7a';
  b.fillRect(0, 0, spec.W, maskEdge);
  a.fillStyle = 'rgba(0,0,0,0.25)';
  a.fillRect(0, maskEdge - 0.06, spec.W, 0.06);

  // Fan-out traces from each finger up to a via.
  const vias = [];
  xs.forEach((x, i) => {
    const h = maskEdge + 0.55 + ((i * 7) % 3) * 0.75 + R() * 0.3;
    both((g) => line(g, [[x, spec.padTop - 0.2], [x, h]], Math.min(0.16, spec.pitch * 0.3)));
    vias.push([x, h]);
  });

  // Horizontal fly-by bundles between the finger vias and the chip row, and above the chips.
  const bundle = (y0, n, sp, w, jog) => {
    for (let k = 0; k < n; k++) {
      const y = y0 + k * sp;
      const pts = [[2.6, y]];
      let x = 2.6;
      while (x < spec.W - 2.6) {
        x += 6 + R() * 14;
        if (jog && R() < 0.35 && x < spec.W - 5) {
          const dy = (R() < 0.5 ? -1 : 1) * sp * 0.5;
          pts.push([x, y], [x + Math.abs(dy), y + dy], [x + 3, y + dy], [x + 3 + Math.abs(dy), y]);
          x += 3 + Math.abs(dy);
        } else pts.push([Math.min(x, spec.W - 2.6), y]);
      }
      both((g) => line(g, pts, w));
    }
  };
  const chipBottom = spec.chips.y - spec.chips.h / 2;
  const zoneLo = maskEdge + 3.0;
  const zoneHi = chipBottom - 2.3;
  if (zoneHi - zoneLo > 0.6) bundle(zoneLo, Math.max(2, Math.floor((zoneHi - zoneLo) / 0.32)), 0.32, 0.12, true);
  bundle(chipTop + 3.6, spec.form === 'dimm' ? 7 : 6, 0.36, 0.13, true);

  // Short stubs from every chip edge (BGA escape routing peeking out from under the package).
  for (const c of chipRects) {
    for (let k = 0; k < 9; k++) {
      const x = c.x - c.w / 2 + 0.6 + (k * (c.w - 1.2)) / 8;
      both((g) => line(g, [[x, c.y - c.h / 2 + 0.2], [x, c.y - c.h / 2 - 0.9 - R() * 0.6]], 0.11));
      both((g) => line(g, [[x, c.y + c.h / 2 - 0.2], [x, c.y + c.h / 2 + 0.7 + R() * 0.5]], 0.11));
      vias.push([x, c.y + c.h / 2 + 0.9 + R() * 0.4]);
    }
  }

  // Scattered stitching vias in the free areas.
  for (let i = 0; i < spec.W * 1.2; i++) {
    const x = 2 + R() * (spec.W - 4);
    const y = maskEdge + 2 + R() * (spec.H - maskEdge - 3.5);
    const hit = chipRects.some((c) => Math.abs(x - c.x) < c.w / 2 + 0.4 && Math.abs(y - c.y) < c.h / 2 + 0.4);
    const lab = Math.abs(x - cx0) < spec.label.w / 2 + 0.5 && Math.abs(y - spec.label.y) < spec.label.h / 2 + 0.5;
    if (!hit && !lab) vias.push([x, y]);
  }
  for (const [x, y] of vias) {
    a.fillStyle = col.trace;
    a.beginPath();
    a.arc(x, y, 0.24, 0, Math.PI * 2);
    a.fill();
    a.fillStyle = 'rgba(0,0,0,0.55)';
    a.beginPath();
    a.arc(x, y, 0.1, 0, Math.PI * 2);
    a.fill();
    b.fillStyle = '#b4b4b4';
    b.beginPath();
    b.arc(x, y, 0.24, 0, Math.PI * 2);
    b.fill();
    b.fillStyle = '#505050';
    b.beginPath();
    b.arc(x, y, 0.1, 0, Math.PI * 2);
    b.fill();
  }

  // Tinned pads peeking out around the passives.
  const tin = '#b8bbbb';
  const padRect = (x, y, w, h) => {
    a.fillStyle = tin;
    a.fillRect(x - w / 2, y - h / 2, w, h);
  };
  for (const p of parts.caps) {
    const [dx, dy] = p.rot ? [0, 0.5] : [0.5, 0];
    padRect(p.x - dx, p.y - dy, p.rot ? 0.62 : 0.42, p.rot ? 0.42 : 0.62);
    padRect(p.x + dx, p.y + dy, p.rot ? 0.62 : 0.42, p.rot ? 0.42 : 0.62);
  }
  for (const p of parts.rnets) {
    for (let k = 0; k < 4; k++) {
      padRect(p.x - 0.75 + k * 0.5, p.y - 0.52, 0.28, 0.32);
      padRect(p.x - 0.75 + k * 0.5, p.y + 0.52, 0.28, 0.32);
    }
  }
  for (const p of parts.bigcaps) {
    padRect(p.x - 0.8, p.y, 0.75, 1.05);
    padRect(p.x + 0.8, p.y, 0.75, 1.05);
  }

  const mkTex = (c, srgb) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 8;
    t.repeat.set(1 / spec.W, 1 / spec.H);
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  };
  return { map: mkTex(cA, true), bump: mkTex(cB, false) };
}

/** Greyscale tint for each gold finger: slightly darker towards the edge, faint plating streaks. */
function padTexture() {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 256, 0, 0);
  gr.addColorStop(0, '#c9c9c9');
  gr.addColorStop(0.25, '#e6e6e6');
  gr.addColorStop(0.8, '#ffffff');
  gr.addColorStop(0.97, '#f2f2f2');
  gr.addColorStop(1, '#bdbdbd');
  g.fillStyle = gr;
  g.fillRect(0, 0, 32, 256);
  const R = rng(7);
  for (let y = 0; y < 256; y += 2) {
    g.fillStyle = `rgba(0,0,0,${R() * 0.05})`;
    g.fillRect(0, y, 32, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Tileable crushed-velvet normal map from smoothed noise. */
function velvetNormalMap() {
  const N = 512;
  const h = new Float32Array(N * N);
  const R = rng(31);
  for (const [cell, amp] of [[64, 1.0], [32, 0.6], [16, 0.35], [8, 0.2]]) {
    const n = N / cell;
    const grid = [];
    for (let i = 0; i < n * n; i++) grid.push(R());
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const gx = x / cell;
        const gy = y / cell;
        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const fx = gx - x0;
        const fy = gy - y0;
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);
        const v = (ix, iy) => grid[((iy + n) % n) * n + ((ix + n) % n)];
        const a = v(x0, y0) + (v(x0 + 1, y0) - v(x0, y0)) * sx;
        const b = v(x0, y0 + 1) + (v(x0 + 1, y0 + 1) - v(x0, y0 + 1)) * sx;
        h[y * N + x] += (a + (b - a) * sy) * amp;
      }
    }
  }
  const c = document.createElement('canvas');
  c.width = N;
  c.height = N;
  const g = c.getContext('2d');
  const img = g.createImageData(N, N);
  const k = 2.2;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = (h[y * N + ((x + 1) % N)] - h[y * N + ((x - 1 + N) % N)]) * k;
      const dy = (h[((y + 1) % N) * N + x] - h[((y - 1 + N) % N) * N + x]) * k;
      const l = Math.hypot(dx, dy, 1);
      const i = (y * N + x) * 4;
      img.data[i] = ((-dx / l) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((-dy / l) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / l) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function noiseTexture(size, base, amp, seed) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const R = rng(seed);
  for (let i = 0; i < size * size; i++) {
    const v = Math.max(0, Math.min(255, base + (R() - 0.5) * amp));
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------------------------------------------------------------------------------------------
// The module
// ---------------------------------------------------------------------------------------------
function lin(hex) {
  return new THREE.Color(hex);
}

function buildModule(spec) {
  const group = new THREE.Group();
  const layout = layoutParts(spec);
  const { chipRects, parts } = layout;
  const tex = pcbTextures(spec, layout);
  const col = PCB_COLORS[spec.pcb];
  const bevel = 0.05;
  const zf = spec.T / 2 + bevel; // front copper surface

  // PCB
  const geo = new THREE.ExtrudeGeometry(outlineShape(spec), {
    depth: spec.T,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: 0.04,
    bevelSegments: 1,
    curveSegments: 24,
  });
  geo.translate(0, 0, -spec.T / 2);
  const faceMat = new THREE.MeshPhysicalMaterial({
    map: tex.map,
    bumpMap: tex.bump,
    bumpScale: 0.6,
    roughness: 0.42,
    specularIntensity: 0.35,
    clearcoat: 0.45,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.1,
  });
  const edgeMat = new THREE.MeshPhysicalMaterial({ color: lin(col.edge), roughness: 0.7 });
  const pcb = new THREE.Mesh(geo, [faceMat, edgeMat]);
  pcb.castShadow = true;
  pcb.receiveShadow = true;
  group.add(pcb);

  // Gold contacts on both faces.
  const gold = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(1.0, 0.69, 0.27),
    metalness: 1.0,
    roughness: 0.24,
    envMapIntensity: 1.25,
  });
  gold.map = padTexture();
  const { xs } = contactLayout(spec);
  const padGeo = new THREE.BoxGeometry(1, 1, 1);
  const pads = new THREE.InstancedMesh(padGeo, gold, xs.length * 2);
  const m4 = new THREE.Matrix4();
  let idx = 0;
  for (const side of [1, -1]) {
    for (const x of xs) {
      const yb = edgeY(spec, x) + 0.12;
      const h = spec.padTop - yb;
      m4.compose(
        new THREE.Vector3(x, yb + h / 2, side * (zf + 0.018)),
        new THREE.Quaternion(),
        new THREE.Vector3(spec.padW, h, 0.036),
      );
      pads.setMatrixAt(idx++, m4);
    }
  }
  pads.castShadow = true;
  group.add(pads);

  // DRAM packages (FBGA, on a 0.25 mm ball stand-off) on both faces.
  const chipTex = noiseTexture(256, 34, 10, 11);
  chipTex.repeat.set(3, 3);
  const chipMat = new THREE.MeshPhysicalMaterial({
    color: lin('#3c3f43'),
    map: chipTex,
    roughness: 0.68,
    clearcoat: 0.12,
    clearcoatRoughness: 0.5,
    envMapIntensity: 0.9,
  });
  const gapMat = new THREE.MeshBasicMaterial({ color: 0x020202 });
  const dimpleMat = new THREE.MeshPhysicalMaterial({ color: lin('#1b1c1e'), roughness: 0.3, envMapIntensity: 1.0 });
  const cT = 1.1;
  const standoff = 0.28;
  for (const side of [1, -1]) {
    for (const c of chipRects) {
      const chip = new THREE.Mesh(new RoundedBoxGeometry(c.w, c.h, cT, 2, 0.07), chipMat);
      chip.position.set(c.x, c.y, side * (zf + standoff + cT / 2));
      chip.castShadow = true;
      chip.receiveShadow = true;
      group.add(chip);
      const under = new THREE.Mesh(new THREE.BoxGeometry(c.w - 0.5, c.h - 0.5, standoff + 0.02), gapMat);
      under.position.set(c.x, c.y, side * (zf + standoff / 2));
      group.add(under);
      // Moulded pin-1 dimple (no marking).
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), dimpleMat);
      d.position.set(c.x - c.w / 2 + 1.05, c.y + c.h / 2 - 1.05, side * (zf + standoff + cT + 0.004));
      if (side < 0) d.rotation.y = Math.PI;
      group.add(d);
    }
  }

  // Passives as instanced boxes.
  const bodies = { cap: [], rnet: [], res: [], tin: [], ind: [], big: [] };
  const push = (list, x, y, z, w, h, d) => list.push([x, y, z, w, h, d]);
  for (const p of parts.caps) {
    const [L, Wd] = [1.0, 0.5];
    const hgt = 0.5;
    const [w, h] = p.rot ? [Wd, L] : [L, Wd];
    push(bodies.cap, p.x, p.y, zf + hgt / 2, p.rot ? w : w - 0.44, p.rot ? h - 0.44 : h, hgt);
    const o = (L - 0.22) / 2;
    const [ox, oy] = p.rot ? [0, o] : [o, 0];
    const [tw, th] = p.rot ? [Wd, 0.22] : [0.22, Wd];
    push(bodies.tin, p.x - ox, p.y - oy, zf + (hgt + 0.02) / 2, tw, th, hgt + 0.02);
    push(bodies.tin, p.x + ox, p.y + oy, zf + (hgt + 0.02) / 2, tw, th, hgt + 0.02);
  }
  for (const p of parts.bigcaps) {
    push(bodies.big, p.x, p.y, zf + 0.42, 1.15, 0.8, 0.84);
    push(bodies.tin, p.x - 0.68, p.y, zf + 0.43, 0.26, 0.82, 0.86);
    push(bodies.tin, p.x + 0.68, p.y, zf + 0.43, 0.26, 0.82, 0.86);
  }
  for (const p of parts.res) {
    const [w, h] = p.rot ? [0.5, 0.56] : [0.56, 0.5];
    push(bodies.res, p.x, p.y, zf + 0.2, w, h, 0.38);
    const o = 0.39;
    const [ox, oy] = p.rot ? [0, o] : [o, 0];
    const [tw, th] = p.rot ? [0.5, 0.22] : [0.22, 0.5];
    push(bodies.tin, p.x - ox, p.y - oy, zf + 0.2, tw, th, 0.4);
    push(bodies.tin, p.x + ox, p.y + oy, zf + 0.2, tw, th, 0.4);
  }
  for (const p of parts.rnets) {
    push(bodies.rnet, p.x, p.y, zf + 0.22, 2.0, 0.66, 0.42);
    for (let k = 0; k < 4; k++) {
      push(bodies.tin, p.x - 0.75 + k * 0.5, p.y - 0.42, zf + 0.2, 0.26, 0.22, 0.4);
      push(bodies.tin, p.x - 0.75 + k * 0.5, p.y + 0.42, zf + 0.2, 0.26, 0.22, 0.4);
    }
  }
  for (const p of parts.inductors) {
    push(bodies.ind, p.x, p.y, zf + 0.5, p.w - 0.3, p.h, 1.0);
    const [ox, tw] = [(p.w - 0.3) / 2, 0.32];
    push(bodies.tin, p.x - ox, p.y, zf + 0.45, tw, p.h * 0.9, 0.9);
    push(bodies.tin, p.x + ox, p.y, zf + 0.45, tw, p.h * 0.9, 0.9);
  }
  const mats = {
    cap: new THREE.MeshPhysicalMaterial({ color: lin('#8d6f4c'), roughness: 0.55, envMapIntensity: 0.8 }),
    big: new THREE.MeshPhysicalMaterial({ color: lin('#7d6141'), roughness: 0.5, envMapIntensity: 0.8 }),
    rnet: new THREE.MeshPhysicalMaterial({ color: lin('#141414'), roughness: 0.55, envMapIntensity: 0.8 }),
    res: new THREE.MeshPhysicalMaterial({ color: lin('#121212'), roughness: 0.5, envMapIntensity: 0.8 }),
    tin: new THREE.MeshPhysicalMaterial({ color: lin('#d4d6d8'), metalness: 1, roughness: 0.32, envMapIntensity: 1.0 }),
    ind: new THREE.MeshPhysicalMaterial({ color: lin('#2c2e30'), roughness: 0.78, envMapIntensity: 0.6 }),
  };
  const unit = new THREE.BoxGeometry(1, 1, 1);
  for (const [k, list] of Object.entries(bodies)) {
    if (!list.length) continue;
    const im = new THREE.InstancedMesh(unit, mats[k], list.length);
    list.forEach(([x, y, z, w, h, d], i) => {
      m4.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(w, h, d));
      im.setMatrixAt(i, m4);
    });
    im.castShadow = true;
    im.receiveShadow = true;
    group.add(im);
  }

  // SPD EEPROM / SPD hub, and the PMIC (DDR5).
  const icMat = new THREE.MeshPhysicalMaterial({ color: lin('#202224'), roughness: 0.6, envMapIntensity: 0.9 });
  if (parts.spd) {
    const s = parts.spd;
    const ic = new THREE.Mesh(new RoundedBoxGeometry(s.w, s.h, 0.6, 2, 0.05), icMat);
    ic.position.set(s.x, s.y, zf + 0.32);
    ic.castShadow = true;
    group.add(ic);
  }
  if (parts.pmic) {
    const p = parts.pmic;
    const ic = new THREE.Mesh(new RoundedBoxGeometry(p.s, p.s, 0.8, 2, 0.06), icMat);
    ic.position.set(p.x, p.y, zf + 0.42);
    ic.castShadow = true;
    group.add(ic);
    // Exposed QFN terminals along each side.
    const term = new THREE.InstancedMesh(unit, mats.tin, 24);
    let t = 0;
    for (let k = 0; k < 6; k++) {
      const o = -p.s / 2 + 0.45 + k * ((p.s - 0.9) / 5);
      for (const [x, y, w, h] of [
        [p.x + o, p.y - p.s / 2 - 0.05, 0.22, 0.14],
        [p.x + o, p.y + p.s / 2 + 0.05, 0.22, 0.14],
        [p.x - p.s / 2 - 0.05, p.y + o, 0.14, 0.22],
        [p.x + p.s / 2 + 0.05, p.y + o, 0.14, 0.22],
      ]) {
        m4.compose(new THREE.Vector3(x, y, zf + 0.06), new THREE.Quaternion(), new THREE.Vector3(w, h, 0.12));
        term.setMatrixAt(t++, m4);
      }
    }
    group.add(term);
  }

  // Plain label (no printing): matte white, rounded corners, a hair proud of the mask.
  const L = spec.label;
  const lgeo = new THREE.ExtrudeGeometry(roundedRect(L.w - 0.3, L.h - 0.3, 0.75), {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.15,
    bevelSegments: 3,
    curveSegments: 12,
  });
  const lt = labelTexture();
  lt.repeat.set(1 / L.w, 1 / L.h);
  lt.offset.set(0.5, 0.5);
  const labelMat = new THREE.MeshPhysicalMaterial({ color: lin('#ffffff'), map: lt, metalness: 0.5, roughness: 0.44, envMapIntensity: 0.75 });
  const label = new THREE.Mesh(lgeo, labelMat);
  label.position.set(spec.W / 2, L.y, zf + 0.005);
  label.castShadow = true;
  label.receiveShadow = true;
  group.add(label);

  return group;
}

/** Matte foil label surface: faint sheen gradient and fine grain, no printing. */
function labelTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 512, 512);
  gr.addColorStop(0, '#d2d6d7');
  gr.addColorStop(0.5, '#c3c8c9');
  gr.addColorStop(1, '#cdd1d2');
  g.fillStyle = gr;
  g.fillRect(0, 0, 512, 512);
  const img = g.getImageData(0, 0, 512, 512);
  const R = rng(99);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (R() - 0.5) * 10;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

// ---------------------------------------------------------------------------------------------
// Backdrop: deep teal #08252E, smoky gradient, soft vertical velvet folds, cyan #00C5E0 glow
// ---------------------------------------------------------------------------------------------
const BACKDROP_GLSL = /* glsl */ `
  uniform vec2 uRes;
  uniform sampler2D uGlow;
  uniform vec4 uHalo;      // centre (uv), radii (uv)
  uniform float uHaloAmt;
  uniform float uGlowAmt;
  float bdHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float bdNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(bdHash(i), bdHash(i + vec2(1, 0)), u.x), mix(bdHash(i + vec2(0, 1)), bdHash(i + vec2(1, 1)), u.x), u.y);
  }
  float bdFbm(vec2 p) {
    float s = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) { s += a * bdNoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
    return s;
  }
  vec3 toLin(vec3 c) { return pow(c, vec3(2.2)); }
  vec3 toSrgb(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
  vec3 backdrop(vec2 uv) {
    vec3 base = toLin(vec3(8.0, 37.0, 46.0) / 255.0);
    vec3 cyan = toLin(vec3(0.0, 197.0, 224.0) / 255.0);
    float aspect = uRes.x / uRes.y;
    vec2 p = vec2(uv.x * aspect, uv.y);
    // Smoke: slow drifting fbm, stretched a little sideways.
    float smoke = bdFbm(p * vec2(2.2, 3.0) + vec2(0.0, 1.3));
    float wisps = bdFbm(p * vec2(5.0, 2.5) + vec2(smoke * 1.5, 4.0));
    // Soft vertical velvet folds (curtain), slightly wavy.
    float xw = p.x + 0.025 * sin(uv.y * 5.0 + p.x * 3.0);
    float folds = 0.55 * sin(xw * 19.0 + 1.3) + 0.3 * sin(xw * 37.0 + 0.4) + 0.15 * sin(xw * 71.0 + 2.0);
    folds = folds * 0.5 + 0.5;
    // Vertical falloff: darker at the very top and at the edges.
    float vy = smoothstep(1.08, 0.35, uv.y);
    float vx = 1.0 - 0.35 * pow(abs(uv.x - 0.5) * 2.0, 2.2);
    vec3 col = base * (0.62 + 0.42 * smoke + 0.2 * wisps) * (0.82 + 0.3 * folds) * (0.72 + 0.4 * vy) * vx;
    // Halo behind the product and a tight rim glow that follows its silhouette.
    vec2 d = (uv - uHalo.xy) / uHalo.zw;
    d.x *= 1.0;
    float halo = exp(-dot(d, d) * 1.6);
    float rim = texture2D(uGlow, uv).r;
    float lightK = (0.75 + 0.5 * folds) * (0.85 + 0.3 * smoke);
    col += cyan * (uHaloAmt * halo * lightK + uGlowAmt * rim * (0.85 + 0.25 * folds));
    return toSrgb(col);
  }
`;

function backdropMesh(uniforms) {
  const mat = new THREE.ShaderMaterial({
    uniforms,
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `void main() { gl_Position = vec4(position.xy, 0.9999, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${BACKDROP_GLSL}
      void main() {
        vec2 uv = gl_FragCoord.xy / uRes;
        vec3 c = backdrop(uv);
        // Fine grain so the gradient never bands.
        c += (bdHash(gl_FragCoord.xy) - 0.5) / 255.0;
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  m.frustumCulled = false;
  m.renderOrder = -1000;
  return m;
}

// ---------------------------------------------------------------------------------------------
// Velvet-draped podium
// ---------------------------------------------------------------------------------------------
const STAGE = { Rp: 76, Hp: 52, edge: 5, foot: 10, Rf: 900 };

function clothGeometry() {
  const { Rp, Hp, edge: e, foot: f, Rf } = STAGE;
  const prof = [];
  const add = (r, y, nr, ny, aR, aY) => prof.push({ r, y, nr, ny, aR, aY });
  // Top (flat where the product stands, faint wrinkles towards the rim).
  for (let i = 0; i <= 46; i++) {
    const t = i / 46;
    const r = (Rp - e) * Math.pow(t, 0.7);
    add(r, 0, 0, 1, 0, 0.35 * smooth(Rp * 0.78, Rp - e, r));
    prof[prof.length - 1].top = true;
  }
  // Rounded rim.
  for (let i = 1; i <= 16; i++) {
    const a = (i / 16) * (Math.PI / 2);
    add(Rp - e + e * Math.sin(a), -e + e * Math.cos(a), Math.sin(a), Math.cos(a), 0.4 + 0.8 * (i / 16), 0);
  }
  // Hanging drape.
  const nV = 50;
  for (let i = 1; i <= nV; i++) {
    const t = i / nV;
    add(Rp, -e - t * (Hp - e - f), 1, 0, 1.4 + 7.5 * Math.pow(t, 0.75), 0);
  }
  // Foot fillet onto the floor.
  for (let i = 1; i <= 16; i++) {
    const a = (i / 16) * (Math.PI / 2);
    add(Rp + f - f * Math.cos(a), -Hp + f - f * Math.sin(a), Math.cos(a), Math.sin(a), 8.9, 0);
  }
  // Floor spill.
  for (let i = 1; i <= 90; i++) {
    const t = i / 90;
    const r = Rp + f + (Rf - Rp - f) * Math.pow(t, 1.8);
    add(r, -Hp, 0, 1, 0, 7.0 * (1 - 0.75 * t));
  }
  // Arc length along the profile, for fold drift.
  let s = 0;
  prof.forEach((p, i) => {
    if (i) s += Math.hypot(p.r - prof[i - 1].r, p.y - prof[i - 1].y);
    p.s = s;
  });

  const nT = 900;
  const R = rng(4242);
  const waves = [];
  for (let k = 0; k < 9; k++) waves.push({ n: Math.round(7 + R() * 22), ph: R() * 6.28, a: 0.4 + R() * 0.6, drift: (R() - 0.5) * 0.02 });
  const fold = (th, s) => {
    let v = 0;
    let n = 0;
    for (const w of waves) {
      v += w.a * Math.sin(w.n * th + w.ph + w.drift * s);
      n += w.a;
    }
    v /= n * 0.55;
    return Math.sign(v) * Math.pow(Math.min(1.6, Math.abs(v)), 0.85);
  };
  const pos = new Float32Array((nT + 1) * prof.length * 3);
  const uvs = new Float32Array((nT + 1) * prof.length * 2);
  const idx = [];
  let o = 0;
  let q = 0;
  for (let j = 0; j <= nT; j++) {
    const th = -Math.PI + (j / nT) * Math.PI * 2; // seam at the back
    const sx = Math.sin(th);
    const cz = Math.cos(th);
    for (const p of prof) {
      const F = fold(th, p.s);
      // Floor: folds radiate out from the podium and ripple as the cloth pools.
      const ripple = p.aY > 0 && p.r > Rp ? Math.sin(p.r * 0.03 + 2.0 * Math.sin(th * 3.0 + 1.0)) * 0.25 : 0;
      const dr = p.aR * F;
      const dy = p.aY * (p.r > Rp ? 0.65 * F + ripple : F * 0.5);
      const r = p.r + dr * p.nr;
      const y = p.y + dr * p.ny + dy;
      pos[o++] = r * sx;
      pos[o++] = y;
      pos[o++] = r * cz;
      // ~30 world units per tile. Planar on the flat top (no polar whorl at the centre), polar on the drape.
      if (p.top) {
        uvs[q++] = (r * sx) / 30;
        uvs[q++] = (r * cz) / 30;
      } else {
        uvs[q++] = (j / nT) * ((2 * Math.PI * p.r) / 30);
        uvs[q++] = p.s / 30;
      }
    }
  }
  const P = prof.length;
  for (let j = 0; j < nT; j++) {
    for (let i = 0; i < P - 1; i++) {
      const a = j * P + i;
      const b = (j + 1) * P + i;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function velvetMaterial(uniforms) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: lin('#0a3540'),
    roughness: 0.92,
    sheen: 1.0,
    sheenRoughness: 0.38,
    sheenColor: lin('#17606c'),
    envMapIntensity: 0.12,
    normalMap: velvetNormalMap(),
    normalScale: new THREE.Vector2(0.25, 0.25),
  });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldP;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWorldP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWorldP;\n${BACKDROP_GLSL}`)
      .replace(
        '#include <dithering_fragment>',
        `
        // Fade the floor cloth into the backdrop with distance, like a falloff into darkness.
        float dist = length(vWorldP.xz);
        float fade = smoothstep(120.0, 380.0, dist);
        fade = max(fade, smoothstep(-40.0, -260.0, vWorldP.z) * 0.9);
        vec3 bd = backdrop(gl_FragCoord.xy / uRes);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, bd, clamp(fade, 0.0, 1.0));
        #include <dithering_fragment>
        `,
      );
  };
  return mat;
}

// ---------------------------------------------------------------------------------------------
// Studio environment for reflections (soft boxes, bounce card, cyan back panel)
// ---------------------------------------------------------------------------------------------
function envScene() {
  const s = new THREE.Scene();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(100, 64, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `varying vec3 vP; void main(){ vec3 d = normalize(vP);
        vec3 top = vec3(0.020, 0.075, 0.090); vec3 mid = vec3(0.010, 0.040, 0.050); vec3 bot = vec3(0.004, 0.012, 0.016);
        vec3 c = d.y > 0.0 ? mix(mid, top, d.y) : mix(mid, bot, -d.y);
        gl_FragColor = vec4(c, 1.0); }`,
    }),
  );
  s.add(sky);
  const panel = (w, h, pos, color, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.copy(pos);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  panel(55, 34, new THREE.Vector3(-45, 48, 52), '#fff6ec', 7.0); // key soft box, upper left front
  // Low front reflectors: a dim warm band right round the front, with brighter strips and dark gaps
  // so the gold contacts show light-and-dark banding from any of the camera angles used.
  const at = (az, el, d = 80) => {
    const a = THREE.MathUtils.degToRad(az);
    const e = THREE.MathUtils.degToRad(el);
    return new THREE.Vector3(d * Math.cos(e) * Math.sin(a), d * Math.sin(e), d * Math.cos(e) * Math.cos(a));
  };
  for (const az of [-80, -48, -16, 16, 48, 80]) panel(46, 26, at(az, -16, 84), '#ffe7c8', 0.55);
  panel(14, 9, at(-50, -11), '#fff3e4', 3.2);
  panel(9, 7, at(-66, -12), '#fff3e4', 2.4);
  panel(20, 9, at(-28, -9), '#fff0dc', 2.2);
  panel(16, 7, at(6, -4), '#fff6ea', 3.4);
  panel(18, 10, at(36, -10), '#ffeed8', 2.0);
  panel(70, 70, new THREE.Vector3(0, 85, 0), '#e9f4f6', 1.3); // overhead
  panel(120, 40, new THREE.Vector3(0, 15, -75), '#00c5e0', 3.5); // cyan back panel
  panel(30, 40, new THREE.Vector3(-80, 5, -25), '#00c5e0', 2.0); // cyan left kicker
  return s;
}

// ---------------------------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------------------------
const VIEWS = {
  main: { fov: 21.5, dist: 400, elev: 9.5, target: [0, 17, 0], yaw: -28 },
  flat: { fov: 20, dist: 473, elev: 4.0, target: [0, 20, 0], yaw: 0 },
};

let renderer;
let pmremTex;
let cloth;

function setup(size) {
  if (!renderer) {
    const canvas = document.createElement('canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    const pm = new THREE.PMREMGenerator(renderer);
    pmremTex = pm.fromScene(envScene(), 0.015).texture;
  }
  renderer.setPixelRatio(1);
  renderer.setSize(size, size, false);
}

function makeCamera(view) {
  const v = VIEWS[view];
  const cam = new THREE.PerspectiveCamera(v.fov, 1, 5, 5000);
  const el = THREE.MathUtils.degToRad(v.elev);
  const t = new THREE.Vector3(...v.target);
  cam.position.set(t.x, t.y + v.dist * Math.sin(el), t.z + v.dist * Math.cos(el));
  cam.lookAt(t);
  cam.updateMatrixWorld();
  return cam;
}

function contactShadowMesh(lenW, depthW) {
  // Soft occlusion under the contact edge: white-on-black canvas used as an alpha map on black.
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, 1024, 256);
  const sx = 1024 / (lenW + 40);
  const sy = 256 / 40;
  const cxp = 512;
  const cyp = 128;
  g.filter = 'blur(16px)';
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.fillRect(cxp - (lenW / 2 + 3) * sx, cyp - (depthW / 2 + 5) * sy, (lenW + 6) * sx, (depthW + 10) * sy);
  g.filter = 'blur(3px)';
  g.fillStyle = 'rgba(255,255,255,1.0)';
  g.fillRect(cxp - (lenW / 2 + 0.3) * sx, cyp - (depthW / 2 + 0.6) * sy, (lenW + 0.6) * sx, (depthW + 1.2) * sy);
  g.filter = 'none';
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(lenW + 40, 40),
    new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: t, transparent: true, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 1;
  return m;
}

/** Gaussian blur approximated by three box passes (float, separable). */
function gaussBlur(src, w, h, sigma) {
  const n = 3;
  const wIdeal = Math.sqrt((12 * sigma * sigma) / n + 1);
  let wl = Math.floor(wIdeal);
  if (wl % 2 === 0) wl--;
  const wu = wl + 2;
  const m = Math.round((12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4));
  const sizes = [];
  for (let i = 0; i < n; i++) sizes.push(i < m ? wl : wu);
  let a = Float32Array.from(src);
  let b = new Float32Array(w * h);
  const boxH = (inp, out, r) => {
    const iarr = 1 / (r + r + 1);
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let acc = 0;
      for (let x = -r - 1; x < r; x++) acc += inp[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        acc += inp[row + Math.min(w - 1, x + r)] - inp[row + Math.max(0, x - r - 1)];
        out[row + x] = acc * iarr;
      }
    }
  };
  const boxV = (inp, out, r) => {
    const iarr = 1 / (r + r + 1);
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r - 1; y < r; y++) acc += inp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        acc += inp[Math.min(h - 1, y + r) * w + x] - inp[Math.max(0, y - r - 1) * w + x];
        out[y * w + x] = acc * iarr;
      }
    }
  };
  for (const sz of sizes) {
    const r = (sz - 1) / 2;
    boxH(a, b, r);
    boxV(b, a, r);
  }
  return a;
}

/**
 * Render one image. opts: { module: slug|null, view: 'main'|'flat'|'plateFront'|'plate34', size }
 * Returns { png, meta }.
 */
export function render(opts) {
  const size = opts.size || 1024;
  setup(size);
  const viewKey = opts.view === 'plateFront' ? 'flat' : opts.view === 'plate34' ? 'main' : opts.view;
  const cam = makeCamera(viewKey);

  const scene = new THREE.Scene();
  scene.environment = pmremTex;
  scene.environmentIntensity = 1.0;

  const GS = 512;
  const glowTex = new THREE.DataTexture(new Uint16Array(GS * GS), GS, GS, THREE.RedFormat, THREE.HalfFloatType);
  glowTex.magFilter = THREE.LinearFilter;
  glowTex.minFilter = THREE.LinearFilter;
  glowTex.colorSpace = THREE.NoColorSpace;
  const uniforms = {
    uRes: { value: new THREE.Vector2(size, size) },
    uGlow: { value: glowTex },
    uHalo: { value: new THREE.Vector4(0.5, 0.55, 0.36, 0.3) },
    uHaloAmt: { value: 0.13 },
    uGlowAmt: { value: 0.85 },
  };
  const bd = backdropMesh(uniforms);
  scene.add(bd);

  if (!cloth) cloth = clothGeometry();
  const podium = new THREE.Mesh(cloth, velvetMaterial(uniforms));
  podium.receiveShadow = true;
  scene.add(podium);

  // Lights.
  const key = new THREE.SpotLight(0xfff4ea, 2.7, 0, THREE.MathUtils.degToRad(27), 0.8, 0);
  key.position.set(-160, 230, 190);
  key.target.position.set(0, 8, 0);
  scene.add(key.target);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.camera.near = 150;
  key.shadow.camera.far = 700;
  key.shadow.radius = 5;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x00c5e0, 1.0);
  rim.position.set(40, 80, -300);
  scene.add(rim);
  // Low cyan spill from behind the product: lights the back of the podium top and fold crests.
  // Inverse-square falloff so the podium top is brightest at the back rim and darkens forward.
  const spill = new THREE.SpotLight(0x00c5e0, 52000, 0, THREE.MathUtils.degToRad(42), 0.9, 2);
  spill.position.set(0, 12, -175);
  spill.target.position.set(0, -10, 60);
  scene.add(spill, spill.target);
  const rimL = new THREE.DirectionalLight(0x00c5e0, 1.4);
  rimL.position.set(-300, 60, -150);
  scene.add(rimL);
  const fill = new THREE.HemisphereLight(0x6fd0de, 0x02080a, 0.35);
  scene.add(fill);
  const front = new THREE.DirectionalLight(0xffffff, 0.45);
  front.position.set(60, 40, 400);
  scene.add(front);

  let module = null;
  let spec = null;
  if (opts.module) {
    spec = SPECS[opts.module];
    // Every module is shown at the same width; SO-DIMMs a touch smaller in the 3/4 view (they are taller).
    const k = (133.35 / spec.W) * (spec.form === 'sodimm' && viewKey === 'main' ? 0.86 : 1);
    const inner = buildModule(spec);
    inner.position.set(-spec.W / 2, 0.05 / k, 0); // a hair into the pile
    module = new THREE.Group();
    module.add(inner);
    module.scale.setScalar(k);
    module.rotation.y = THREE.MathUtils.degToRad(VIEWS[viewKey].yaw);
    scene.add(module);
    const cs = contactShadowMesh(133.35, 5.0);
    cs.position.y = 0.12;
    const csg = new THREE.Group();
    csg.add(cs);
    csg.rotation.y = module.rotation.y;
    scene.add(csg);
  }

  // Halo: centred on the product (or where a product would stand on an empty plate).
  const proj = (v) => {
    const p = v.clone().project(cam);
    return new THREE.Vector2((p.x + 1) / 2, (p.y + 1) / 2);
  };
  const hc = proj(new THREE.Vector3(0, 30, 0));
  uniforms.uHalo.value.set(hc.x, hc.y + 0.02, 0.4, 0.3);

  // Silhouette glow: render the module mask small, blur it in float (no 8-bit banding), and sample
  // it in the backdrop shader in screen space.
  const mask = new Float32Array(GS * GS);
  if (module) {
    const rt = new THREE.WebGLRenderTarget(GS, GS, { samples: 4 });
    const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    bd.visible = false;
    podium.visible = false;
    scene.overrideMaterial = white;
    renderer.setRenderTarget(rt);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    renderer.render(scene, cam);
    const px = new Uint8Array(GS * GS * 4);
    renderer.readRenderTargetPixels(rt, 0, 0, GS, GS, px);
    renderer.setRenderTarget(null);
    scene.overrideMaterial = null;
    bd.visible = true;
    podium.visible = true;
    for (let i = 0; i < GS * GS; i++) mask[i] = px[i * 4] / 255;
    rt.dispose();
  } else {
    // Empty plate: a soft elliptical glow where an item would stand (no hard silhouette).
    const c = proj(new THREE.Vector3(0, 0, 0));
    const t = proj(new THREE.Vector3(0, 50, 0));
    const cx = c.x * GS;
    const cy = ((c.y + t.y) / 2) * GS;
    const rx = 0.2 * GS;
    const ry = ((t.y - c.y) / 2) * GS * 1.15;
    for (let y = 0; y < GS; y++) {
      for (let x = 0; x < GS; x++) {
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        mask[y * GS + x] = d < 1 ? 0.55 * (1 - d) ** 0.5 : 0;
      }
    }
  }
  const glow = new Float32Array(GS * GS);
  const radii = module ? [[2.5, 0.55], [8, 0.42], [22, 0.26], [55, 0.12]] : [[20, 0.5], [45, 0.45], [80, 0.25]];
  for (const [r, w] of radii) {
    const b = gaussBlur(mask, GS, GS, r);
    for (let i = 0; i < glow.length; i++) glow[i] += b[i] * w;
  }
  const hf = glowTex.image.data;
  for (let i = 0; i < glow.length; i++) hf[i] = THREE.DataUtils.toHalfFloat(Math.min(glow[i], 4));
  glowTex.needsUpdate = true;

  renderer.setRenderTarget(null);
  renderer.render(scene, cam);
  const png = renderer.domElement.toDataURL('image/png');

  // Metadata for compositing onto the empty plates.
  const toPx = (v) => {
    const p = proj(v);
    return [Math.round(p.x * size), Math.round((1 - p.y) * size)];
  };
  const meta = {
    contactCentre: toPx(new THREE.Vector3(0, 0, 0)),
    topLeft: toPx(new THREE.Vector3(-STAGE.Rp, 0, 0)),
    topRight: toPx(new THREE.Vector3(STAGE.Rp, 0, 0)),
    topFront: toPx(new THREE.Vector3(0, 0, STAGE.Rp)),
    topBack: toPx(new THREE.Vector3(0, 0, -STAGE.Rp)),
    unitPx: toPx(new THREE.Vector3(0, 10, 0)),
    keyLight: key.position.clone().normalize().toArray().map((v) => +v.toFixed(3)),
    cameraElevationDeg: VIEWS[viewKey].elev,
  };
  // Dispose per-render resources.
  scene.traverse((o) => {
    if (o.isMesh && o !== podium) {
      o.geometry.dispose?.();
    }
  });
  return { png, meta };
}

window.renderRam = render;
window.ramReady = true;
