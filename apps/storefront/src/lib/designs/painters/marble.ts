import type { ProcDesign } from "../catalog"
import { mulberry32 } from "../noise"
import {
  grain,
  lerp,
  rgba,
  smoothPath,
  supportsFilter,
  vignette,
  type Ctx,
  type Pt,
} from "./shared"

function veinPoints(rnd: () => number, w: number, h: number, count: number, flow: boolean): Pt[] {
  // Veins span the tile edge to edge and mostly share the design's flow direction.
  const vertical = rnd() < 0.85 ? flow : !flow
  const start: Pt = vertical
    ? { x: rnd() * w, y: -h * 0.05 }
    : { x: -w * 0.05, y: rnd() * h }
  const end: Pt = vertical
    ? { x: rnd() * w, y: h * 1.05 }
    : { x: w * 1.05, y: rnd() * h }
  const pts: Pt[] = [start]
  for (let i = 1; i < count - 1; i++) {
    const t = i / (count - 1)
    pts.push({
      x: lerp(start.x, end.x, t) + (rnd() - 0.5) * w * 0.6,
      y: lerp(start.y, end.y, t) + (rnd() - 0.5) * h * 0.14,
    })
  }
  pts.push(end)
  return pts
}

/** A thicker stretch along part of the vein, where mineral pooled. */
function strokePool(ctx: Ctx, pts: readonly Pt[], rnd: () => number, s: number, hex: string): void {
  const from = Math.floor(rnd() * (pts.length - 3))
  const span = 2 + Math.floor(rnd() * 2)
  ctx.lineWidth = (2.5 + rnd() * 2.5) * s
  ctx.strokeStyle = rgba(hex, 0.3)
  strokeVein(ctx, pts.slice(from, from + span + 1))
}

function strokeVein(ctx: Ctx, pts: readonly Pt[]): void {
  ctx.beginPath()
  smoothPath(ctx, pts)
  ctx.stroke()
}

export function paintMarble(ctx: Ctx, w: number, h: number, design: ProcDesign): void {
  const s = w / 256
  const rnd = mulberry32(design.seed)
  const { base, a, b, ink } = design.palette
  const flow = rnd() < 0.75

  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  // Clouding: soft mineral blotches under everything.
  for (let i = 0; i < 40; i++) {
    const r = (20 + rnd() * 60) * s
    ctx.beginPath()
    ctx.ellipse(rnd() * w, rnd() * h, r, r * (0.45 + rnd() * 0.8), rnd() * Math.PI, 0, Math.PI * 2)
    ctx.fillStyle = rgba(i % 3 === 0 ? b : a, 0.035)
    ctx.fill()
  }

  // Wide diffuse veins.
  ctx.save()
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.lineWidth = 6 * s
  if (supportsFilter(ctx)) {
    ctx.filter = `blur(${5 * s}px)`
    ctx.strokeStyle = rgba(b, 0.28)
    for (let i = 0; i < 3; i++) strokeVein(ctx, veinPoints(rnd, w, h, 6, flow))
  } else {
    ctx.strokeStyle = rgba(b, 0.14)
    for (let i = 0; i < 3; i++) {
      const pts = veinPoints(rnd, w, h, 6, flow)
      ctx.translate(-1, 0)
      strokeVein(ctx, pts)
      ctx.translate(2, 0)
      strokeVein(ctx, pts)
      ctx.translate(-1, 0)
    }
  }
  ctx.restore()

  // Crisp veins with a faint glow, plus hairline branches.
  ctx.save()
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.shadowColor = rgba(a, 0.9)
  ctx.shadowBlur = 4 * s
  for (let i = 0; i < 6; i++) {
    const pts = veinPoints(rnd, w, h, 7, flow)
    ctx.lineWidth = (1 + rnd() * 2) * s
    ctx.strokeStyle = rgba(a, 0.6)
    strokeVein(ctx, pts)
    strokePool(ctx, pts, rnd, s, a)

    const branches = 1 + Math.floor(rnd() * 2)
    for (let k = 0; k < branches; k++) {
      const from = pts[1 + Math.floor(rnd() * (pts.length - 2))]
      const len = (30 + rnd() * 60) * s
      const ang = rnd() * Math.PI * 2
      const branch: Pt[] = [
        from,
        { x: from.x + Math.cos(ang) * len * 0.5 + (rnd() - 0.5) * 10 * s, y: from.y + Math.sin(ang) * len * 0.5 },
        { x: from.x + Math.cos(ang) * len, y: from.y + Math.sin(ang) * len + (rnd() - 0.5) * 10 * s },
      ]
      ctx.lineWidth = 0.7 * s
      ctx.strokeStyle = rgba(a, 0.35)
      strokeVein(ctx, branch)
    }
  }
  ctx.restore()

  vignette(ctx, w, h, ink, 0.22)
  grain(ctx, w, h, 0.012)
}
