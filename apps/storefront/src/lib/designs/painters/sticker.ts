import type { ProcDesign } from "../catalog"
import { mulberry32 } from "../noise"
import { DEG, grain, rgba, white, type Ctx } from "./shared"

type Kind = "star" | "heart" | "smiley" | "cloud" | "sparkle" | "moon" | "bolt"

const ALL_KINDS: readonly Kind[] = ["star", "heart", "smiley", "cloud", "sparkle", "moon", "bolt"]

const KIND_BIAS: Record<string, readonly Kind[]> = {
  "smiley-days": ["smiley", "smiley", "heart", "sparkle", "cloud", "smiley"],
  "star-sign": ["star", "sparkle", "moon", "star", "sparkle", "star"],
}

interface Placed {
  x: number
  y: number
  r: number
  rot: number
  kind: Kind
  fill: string
}

function starPath(ctx: Ctx, r: number, points = 5, inner = 0.45): void {
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * inner
    const ang = -Math.PI / 2 + (i * Math.PI) / points
    const x = Math.cos(ang) * rad
    const y = Math.sin(ang) * rad
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function heartPath(ctx: Ctx, r: number): void {
  const w = r * 1.05
  ctx.moveTo(0, r * 0.95)
  ctx.bezierCurveTo(-w * 1.3, r * 0.1, -w * 0.9, -r * 0.95, 0, -r * 0.35)
  ctx.bezierCurveTo(w * 0.9, -r * 0.95, w * 1.3, r * 0.1, 0, r * 0.95)
  ctx.closePath()
}

function cloudPath(ctx: Ctx, r: number): void {
  ctx.moveTo(-r * 0.9, r * 0.35)
  ctx.arc(-r * 0.55, r * 0.1, r * 0.45, Math.PI * 0.75, Math.PI * 1.6)
  ctx.arc(-r * 0.05, -r * 0.25, r * 0.55, Math.PI * 1.15, Math.PI * 1.9)
  ctx.arc(r * 0.5, r * 0.05, r * 0.45, Math.PI * 1.3, Math.PI * 0.2)
  ctx.lineTo(r * 0.55, r * 0.5)
  ctx.lineTo(-r * 0.6, r * 0.5)
  ctx.closePath()
}

function sparklePath(ctx: Ctx, r: number): void {
  const pinch = r * 0.16
  ctx.moveTo(0, -r)
  ctx.quadraticCurveTo(pinch, -pinch, r, 0)
  ctx.quadraticCurveTo(pinch, pinch, 0, r)
  ctx.quadraticCurveTo(-pinch, pinch, -r, 0)
  ctx.quadraticCurveTo(-pinch, -pinch, 0, -r)
  ctx.closePath()
}

function moonPath(ctx: Ctx, r: number): void {
  ctx.arc(0, 0, r, Math.PI * 0.25, Math.PI * 1.75, false)
  ctx.arc(r * 0.45, 0, r * 0.78, Math.PI * 1.65, Math.PI * 0.35, true)
  ctx.closePath()
}

function boltPath(ctx: Ctx, r: number): void {
  ctx.moveTo(r * 0.1, -r)
  ctx.lineTo(-r * 0.55, r * 0.1)
  ctx.lineTo(-r * 0.05, r * 0.1)
  ctx.lineTo(-r * 0.2, r)
  ctx.lineTo(r * 0.55, -r * 0.15)
  ctx.lineTo(r * 0.05, -r * 0.15)
  ctx.closePath()
}

function shapePath(ctx: Ctx, kind: Kind, r: number): void {
  ctx.beginPath()
  switch (kind) {
    case "star":
      starPath(ctx, r)
      break
    case "heart":
      heartPath(ctx, r)
      break
    case "smiley":
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      break
    case "cloud":
      cloudPath(ctx, r)
      break
    case "sparkle":
      sparklePath(ctx, r)
      break
    case "moon":
      moonPath(ctx, r)
      break
    case "bolt":
      boltPath(ctx, r)
      break
  }
}

function drawSticker(ctx: Ctx, p: Placed, ink: string, s: number): void {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot)
  ctx.lineJoin = "round"
  ctx.lineCap = "round"

  // Die-cut white border with a soft drop shadow, then the colour fill and ink outline.
  shapePath(ctx, p.kind, p.r)
  ctx.shadowColor = rgba(ink, 0.18)
  ctx.shadowBlur = 3 * s
  ctx.shadowOffsetX = 1.5 * s
  ctx.shadowOffsetY = 2.5 * s
  ctx.lineWidth = 7 * s
  ctx.strokeStyle = white(1)
  ctx.stroke()
  ctx.shadowColor = "transparent"
  ctx.fillStyle = white(1)
  ctx.fill()

  shapePath(ctx, p.kind, p.r)
  ctx.fillStyle = p.fill
  ctx.fill()
  ctx.lineWidth = 2 * s
  ctx.strokeStyle = ink
  ctx.stroke()

  if (p.kind === "smiley") {
    ctx.fillStyle = ink
    ctx.beginPath()
    ctx.arc(-p.r * 0.32, -p.r * 0.2, p.r * 0.1, 0, Math.PI * 2)
    ctx.arc(p.r * 0.32, -p.r * 0.2, p.r * 0.1, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0, p.r * 0.1, p.r * 0.5, Math.PI * 0.15, Math.PI * 0.85)
    ctx.lineWidth = 2 * s
    ctx.stroke()
  }
  ctx.restore()
}

export function paintSticker(ctx: Ctx, w: number, h: number, design: ProcDesign): void {
  const s = w / 256
  const rnd = mulberry32(design.seed)
  const { base, a, b, c, ink } = design.palette
  const kinds = KIND_BIAS[design.id] ?? ALL_KINDS
  const fills = [white(1), white(1), a, b, c]

  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  // Faint confetti dots behind the stickers.
  for (let i = 0; i < 26; i++) {
    ctx.beginPath()
    ctx.arc(rnd() * w, rnd() * h, (1.5 + rnd() * 2) * s, 0, Math.PI * 2)
    ctx.fillStyle = rgba([a, b, c][i % 3], 0.35)
    ctx.fill()
  }

  const target = 6 + Math.floor(rnd() * 2)
  const placed: Placed[] = []
  const gap = 6 * s
  for (let i = 0; i < target; i++) {
    const r = (22 + rnd() * 20) * s
    for (let attempt = 0; attempt < 60; attempt++) {
      const x = r + gap + rnd() * (w - 2 * (r + gap))
      const y = r + gap + rnd() * (h - 2 * (r + gap))
      const clear = placed.every((q) => Math.hypot(q.x - x, q.y - y) > q.r + r + gap)
      if (!clear) continue
      placed.push({
        x,
        y,
        r,
        rot: (rnd() - 0.5) * 50 * DEG,
        kind: kinds[i % kinds.length],
        fill: fills[Math.floor(rnd() * fills.length)],
      })
      break
    }
  }
  placed.forEach((p) => drawSticker(ctx, p, ink, s))

  grain(ctx, w, h, 0.01)
}
