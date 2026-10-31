import type { ProcDesign } from "../catalog"
import { fbm, mulberry32 } from "../noise"
import { grain, rgba, white, type Ctx } from "./shared"

export function paintAurora(ctx: Ctx, w: number, h: number, design: ProcDesign): void {
  const s = w / 256
  const rnd = mulberry32(design.seed)
  const { base, a, b, c, ink } = design.palette

  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  const ribbons = [a, b, c, ink]
  const strip = Math.max(4, Math.round(8 * s))
  const rows = Math.ceil(h / strip)

  // Each ribbon is a tall radial gradient (vertical stretch k) drawn in horizontal
  // strips, each strip shifted by fbm so the curtain folds. Strips must not overlap:
  // the screen blend would brighten the seams into scanlines.
  ctx.save()
  ctx.globalCompositeOperation = "screen"
  ribbons.forEach((hex, i) => {
    const k = 1.9 + rnd() * 0.7
    const x = w * (0.12 + rnd() * 0.76)
    const cy = h * (0.22 + rnd() * 0.46)
    const radius = w * (0.26 + rnd() * 0.16)
    const alpha = 0.62 + rnd() * 0.18
    const g = ctx.createRadialGradient(x, cy / k, 0, x, cy / k, radius)
    g.addColorStop(0, rgba(hex, alpha))
    g.addColorStop(0.4, rgba(hex, alpha * 0.6))
    g.addColorStop(1, rgba(hex, 0))
    ctx.fillStyle = g
    const noiseSeed = design.seed + i * 37
    const fold = (0.6 + rnd() * 0.8) * 18 * s
    for (let r = 0; r < rows; r++) {
      const y = r * strip
      const dx = fbm((y / s) * 0.02, i * 3.1, 3, 2, 0.5, noiseSeed) * fold
      ctx.setTransform(1, 0, 0, k, dx, 0)
      ctx.fillRect(-Math.abs(dx) - 1, y / k, w + Math.abs(dx) * 2 + 2, strip / k)
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  })
  ctx.restore()

  // Ground the ribbons with a dark horizon.
  const horizon = ctx.createLinearGradient(0, h * 0.6, 0, h)
  horizon.addColorStop(0, rgba(base, 0))
  horizon.addColorStop(1, rgba(base, 0.75))
  ctx.fillStyle = horizon
  ctx.fillRect(0, 0, w, h)

  // Stars.
  for (let i = 0; i < 180; i++) {
    const big = rnd() < 0.08
    const size = (big ? 2 : 1) * s
    ctx.fillStyle = white(0.2 + rnd() * 0.7)
    ctx.fillRect(rnd() * w, rnd() * h * 0.85, size, size)
  }

  grain(ctx, w, h, 0.015)
}
