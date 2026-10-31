import type { ProcDesign } from "../catalog"
import { mulberry32 } from "../noise"
import { DEG, grain, rgba, type Ctx } from "./shared"

export function paintMinimal(ctx: Ctx, w: number, h: number, design: ProcDesign): void {
  const s = w / 256
  const rnd = mulberry32(design.seed)
  const { base, a, b, ink } = design.palette

  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  // Barely-there paper tone so the off-white is not dead flat.
  const tone = ctx.createLinearGradient(0, 0, w * 0.3, h)
  tone.addColorStop(0, rgba(b, 0))
  tone.addColorStop(1, rgba(b, 0.35))
  ctx.fillStyle = tone
  ctx.fillRect(0, 0, w, h)

  const radius = w * (0.5 + rnd() * 0.2)
  const cx = w * (0.15 + rnd() * 0.7)
  const cy = h * (0.3 + rnd() * 0.45)
  const start = rnd() * Math.PI * 2
  const sweep = (90 + rnd() * 50) * DEG

  ctx.save()
  ctx.lineWidth = 2 * s
  ctx.lineCap = "round"
  ctx.strokeStyle = ink
  ctx.beginPath()
  ctx.arc(cx, cy, radius, start, start + sweep)
  ctx.stroke()
  ctx.restore()

  // Dot placed off the arc's end so the two elements talk to each other.
  const endAng = start + sweep
  const dx = cx + Math.cos(endAng) * radius
  const dy = cy + Math.sin(endAng) * radius
  const inside = dx > w * 0.12 && dx < w * 0.88 && dy > h * 0.1 && dy < h * 0.9
  const dotX = inside ? dx + Math.cos(endAng + Math.PI / 2) * 22 * s : w * (0.25 + rnd() * 0.5)
  const dotY = inside ? dy + Math.sin(endAng + Math.PI / 2) * 22 * s : h * (0.6 + rnd() * 0.25)
  const px = Math.min(Math.max(dotX, 16 * s), w - 16 * s)
  const py = Math.min(Math.max(dotY, 16 * s), h - 16 * s)
  ctx.beginPath()
  ctx.arc(px, py, 8 * s, 0, Math.PI * 2)
  ctx.fillStyle = a
  ctx.fill()

  grain(ctx, w, h, 0.01)
}
