import type { ProcDesign } from "./catalog"
import { mulberry32 } from "./noise"

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = rgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

function white(alpha: number): string {
  return `rgba(255,255,255,${alpha})`
}

function pct(v: number): string {
  return `${Math.round(v * 1000) / 10}%`
}

/** Fractal turbulence in the vein colour, used as a zero-byte marble texture. */
function marbleTurbulence(seed: number, veinHex: string): string {
  const [r, g, b] = rgb(veinHex).map((c) => (c / 255).toFixed(3))
  const matrix = `0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0.45 0.45 0.45 0 -0.32`
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='600'>` +
    `<filter id='m'><feTurbulence type='turbulence' baseFrequency='0.006 0.011' numOctaves='3' seed='${seed % 1000}' stitchTiles='stitch'/>` +
    `<feColorMatrix values='${matrix}'/></filter>` +
    `<rect width='100%' height='100%' filter='url(#m)'/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

export function designCss(design: ProcDesign): string {
  const rnd = mulberry32(design.seed)
  const { base, a, b, c, ink } = design.palette

  switch (design.family) {
    case "marble": {
      const x1 = 15 + rnd() * 70
      const y1 = 10 + rnd() * 40
      const x2 = 15 + rnd() * 70
      const y2 = 55 + rnd() * 35
      return [
        `${marbleTurbulence(design.seed, a)} center / cover no-repeat`,
        `radial-gradient(ellipse 70% 45% at ${pct(x1 / 100)} ${pct(y1 / 100)}, ${rgba(a, 0.42)}, transparent 70%)`,
        `radial-gradient(ellipse 80% 50% at ${pct(x2 / 100)} ${pct(y2 / 100)}, ${rgba(b, 0.38)}, transparent 70%)`,
        `radial-gradient(ellipse 120% 120% at 50% 50%, transparent 55%, ${rgba(ink, 0.22)})`,
        base,
      ].join(", ")
    }
    case "holo": {
      const from = Math.round(rnd() * 360)
      const hue0 = Math.round(rnd() * 360)
      const stops = Array.from({ length: 8 }, (_, i) => `hsla(${(hue0 + (i % 7) * 51) % 360},85%,62%,0.75)`)
      const cx = 50 + (rnd() - 0.5) * 40
      const cy = 50 + (rnd() - 0.5) * 40
      return [
        `repeating-linear-gradient(45deg, ${white(0)} 0 6px, ${white(0.08)} 6px 12px)`,
        `radial-gradient(circle at ${pct(cx / 100)} ${pct((cy - 20) / 100)}, ${rgba(c, 0.5)}, transparent 60%)`,
        `conic-gradient(from ${from}deg at ${pct(cx / 100)} ${pct(cy / 100)}, ${stops.join(", ")})`,
        base,
      ].join(", ")
    }
    case "aurora": {
      const xs = [a, b, c].map(() => 15 + rnd() * 70)
      const ys = [a, b, c].map(() => 20 + rnd() * 45)
      return [
        `linear-gradient(to bottom, transparent 60%, ${rgba(base, 0.75)})`,
        `radial-gradient(ellipse 45% 70% at ${pct(xs[0] / 100)} ${pct(ys[0] / 100)}, ${rgba(a, 0.7)}, transparent 70%)`,
        `radial-gradient(ellipse 45% 70% at ${pct(xs[1] / 100)} ${pct(ys[1] / 100)}, ${rgba(b, 0.65)}, transparent 70%)`,
        `radial-gradient(ellipse 45% 70% at ${pct(xs[2] / 100)} ${pct(ys[2] / 100)}, ${rgba(c, 0.6)}, transparent 70%)`,
        base,
      ].join(", ")
    }
    case "y2k":
      return [
        `linear-gradient(135deg, ${white(0.2)}, ${rgba(c, 0.28)} 50%, ${white(0.2)})`,
        `repeating-conic-gradient(${a} 0 25%, ${b} 0 50%) 0 0 / 33.333% 16.667%`,
        base,
      ].join(", ")
    case "quote": {
      const dx = 66 + rnd() * 18
      const dy = 14 + rnd() * 10
      return [
        `radial-gradient(circle closest-side at ${pct(dx / 100)} ${pct(dy / 100)}, ${c} 0 22%, transparent 24%)`,
        `radial-gradient(ellipse 90% 70% at 30% 25%, ${rgba(b, 0.55)}, transparent 70%)`,
        base,
      ].join(", ")
    }
    case "sticker": {
      const x1 = 20 + rnd() * 30
      const y1 = 15 + rnd() * 30
      const x2 = 55 + rnd() * 30
      const y2 = 55 + rnd() * 30
      return [
        `radial-gradient(circle at ${pct(x1 / 100)} ${pct(y1 / 100)}, ${rgba(a, 0.9)} 0 8%, transparent 9%)`,
        `radial-gradient(circle at ${pct(x2 / 100)} ${pct(y2 / 100)}, ${rgba(b, 0.9)} 0 7%, transparent 8%)`,
        base,
      ].join(", ")
    }
    case "minimal": {
      const x = 30 + rnd() * 40
      const y = 55 + rnd() * 30
      return [
        `radial-gradient(circle at ${pct(x / 100)} ${pct(y / 100)}, ${a} 0 3%, transparent 3.5%)`,
        base,
      ].join(", ")
    }
  }
}
