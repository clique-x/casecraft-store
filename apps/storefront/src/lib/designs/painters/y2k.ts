import type { ProcDesign } from "../catalog"
import { mulberry32 } from "../noise"
import { grain, rgba, white, type Ctx } from "./shared"

const COLS = 6
const ROWS = 12
const EDGE_STEPS = 6

export function paintY2k(ctx: Ctx, w: number, h: number, design: ProcDesign): void {
  const s = w / 256
  const rnd = mulberry32(design.seed)
  const { a, b, c } = design.palette

  ctx.fillStyle = b
  ctx.fillRect(0, 0, w, h)

  const cw = w / COLS
  const rh = h / ROWS
  const amp = 8 * s * (0.8 + rnd() * 0.6)
  const k = ((1.2 + rnd() * 0.8) * Math.PI * 2) / w
  const phase = rnd() * Math.PI * 2
  const wave = (x: number): number => Math.sin(x * k + phase) * amp

  // Each dark cell is a quad whose top and bottom edges follow the wave, so the
  // whole board bends smoothly instead of stepping per column.
  ctx.fillStyle = a
  for (let r = -1; r <= ROWS; r++) {
    for (let col = 0; col < COLS; col++) {
      if ((r + col) % 2 !== 0) continue
      const x0 = col * cw
      const y0 = r * rh
      const y1 = y0 + rh
      ctx.beginPath()
      ctx.moveTo(x0, y0 + wave(x0))
      for (let i = 1; i <= EDGE_STEPS; i++) {
        const x = x0 + (cw * i) / EDGE_STEPS
        ctx.lineTo(x, y0 + wave(x))
      }
      for (let i = EDGE_STEPS; i >= 0; i--) {
        const x = x0 + (cw * i) / EDGE_STEPS
        ctx.lineTo(x, y1 + wave(x))
      }
      ctx.closePath()
      ctx.fill()
    }
  }

  // Glossy diagonal tint.
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, white(0.2))
  g.addColorStop(0.5, rgba(c, 0.2))
  g.addColorStop(1, white(0.2))
  ctx.save()
  ctx.globalCompositeOperation = "overlay"
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  const tint = ctx.createLinearGradient(0, 0, w, h)
  tint.addColorStop(0, rgba(c, 0.12))
  tint.addColorStop(0.5, rgba(c, 0.3))
  tint.addColorStop(1, rgba(c, 0.08))
  ctx.fillStyle = tint
  ctx.fillRect(0, 0, w, h)

  grain(ctx, w, h, 0.01)
}
