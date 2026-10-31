import type { ProcDesign } from "../catalog"
import { mulberry32 } from "../noise"
import { grain, hsla, luminance, rgba, white, type Ctx } from "./shared"

const HUES = 7
const HUE_STEP = 51

export function paintHolo(ctx: Ctx, w: number, h: number, design: ProcDesign): void {
  const s = w / 256
  const rnd = mulberry32(design.seed)
  const { base, c, ink } = design.palette
  const dark = luminance(base) < 0.3

  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  const angle0 = rnd() * Math.PI * 2
  const hue0 = rnd() * 360
  const cx = w * (0.5 + (rnd() - 0.5) * 0.5)
  const cy = h * (0.5 + (rnd() - 0.5) * 0.5)
  const alpha = dark ? 0.85 : 0.62

  ctx.save()
  if (dark) ctx.globalCompositeOperation = "screen"
  if (typeof ctx.createConicGradient === "function") {
    const g = ctx.createConicGradient(angle0, cx, cy)
    for (let i = 0; i <= HUES; i++) {
      g.addColorStop(i / HUES, hsla(hue0 + (i % HUES) * HUE_STEP, 85, 62, alpha))
    }
    ctx.fillStyle = g
  } else {
    const dx = Math.cos(angle0) * w
    const dy = Math.sin(angle0) * h
    const g = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy)
    for (let i = 0; i <= HUES; i++) {
      g.addColorStop(i / HUES, hsla(hue0 + (i % HUES) * HUE_STEP, 85, 62, alpha))
    }
    ctx.fillStyle = g
  }
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  // Silver core: the spokes converge into metal instead of a hard pinwheel.
  if (!dark) {
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.5)
    core.addColorStop(0, rgba(base, 0.8))
    core.addColorStop(0.35, rgba(base, 0.35))
    core.addColorStop(1, rgba(base, 0))
    ctx.fillStyle = core
    ctx.fillRect(0, 0, w, h)
  }

  // Specular bloom where the foil catches the light.
  const hx = w * (0.2 + rnd() * 0.6)
  const hy = h * (0.15 + rnd() * 0.5)
  const bloom = ctx.createRadialGradient(hx, hy, 0, hx, hy, w * 0.7)
  bloom.addColorStop(0, rgba(c, dark ? 0.35 : 0.55))
  bloom.addColorStop(0.45, rgba(c, 0.12))
  bloom.addColorStop(1, rgba(c, 0))
  ctx.save()
  ctx.globalCompositeOperation = "screen"
  ctx.fillStyle = bloom
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  // Diagonal diffraction stripes.
  const period = 14 * s
  const diag = Math.hypot(w, h)
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.rotate(Math.PI / 4)
  const stripes = ctx.createLinearGradient(-diag / 2, 0, diag / 2, 0)
  const cycles = Math.ceil(diag / period)
  for (let i = 0; i < cycles; i++) {
    const t0 = i / cycles
    const t1 = (i + 0.5) / cycles
    const peak = 0.08 * (0.55 + 0.45 * Math.sin(i * 0.9 + angle0))
    stripes.addColorStop(t0, white(0))
    stripes.addColorStop(Math.min(1, t1), white(peak))
  }
  ctx.fillStyle = stripes
  ctx.fillRect(-diag, -diag, diag * 2, diag * 2)
  ctx.restore()

  // Soft edge darkening so the foil reads as a surface rather than a flat gradient.
  const edge = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.hypot(w, h) * 0.6)
  edge.addColorStop(0, rgba(ink, 0))
  edge.addColorStop(1, rgba(ink, dark ? 0.35 : 0.14))
  ctx.fillStyle = edge
  ctx.fillRect(0, 0, w, h)

  grain(ctx, w, h, 0.02)
}
