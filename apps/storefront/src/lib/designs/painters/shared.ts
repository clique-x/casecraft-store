import type { ProcDesign } from "../catalog"
import { mulberry32 } from "../noise"

export type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
export type AnyCanvas = HTMLCanvasElement | OffscreenCanvas
export type Painter = (ctx: Ctx, w: number, h: number, design: ProcDesign) => void

export function createCanvas(w: number, h: number): AnyCanvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h)
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  return c
}

export function get2d(canvas: AnyCanvas): Ctx {
  const ctx =
    "transferToImageBitmap" in canvas ? canvas.getContext("2d") : canvas.getContext("2d")
  if (!ctx) throw new Error("designs: 2d canvas context unavailable")
  return ctx
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${clamp01(alpha)})`
}

export function white(alpha: number): string {
  return `rgba(255,255,255,${clamp01(alpha)})`
}

export function hsla(h: number, s: number, l: number, a: number): string {
  return `hsla(${((h % 360) + 360) % 360},${s}%,${l}%,${clamp01(a)})`
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export const TAU = Math.PI * 2
export const DEG = Math.PI / 180

let filterSupport: boolean | null = null

/** Safari lacks ctx.filter; an expando assignment would read back, so check the prototype first. */
export function supportsFilter(ctx: Ctx): boolean {
  if (filterSupport !== null) return filterSupport
  try {
    if (!("filter" in ctx)) {
      filterSupport = false
    } else {
      const prev = ctx.filter
      ctx.filter = "blur(1px)"
      filterSupport = ctx.filter === "blur(1px)"
      ctx.filter = prev || "none"
    }
  } catch {
    filterSupport = false
  }
  return filterSupport
}

let grainSource: AnyCanvas | null = null

function grainCanvas(): AnyCanvas {
  if (grainSource) return grainSource
  const size = 64
  const c = createCanvas(size, size)
  const ctx = get2d(c)
  const img = ctx.createImageData(size, size)
  const rnd = mulberry32(7)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 256)
    img.data[i] = v
    img.data[i + 1] = v
    img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  grainSource = c
  return c
}

export function grain(ctx: Ctx, w: number, h: number, alpha: number): void {
  const pattern = ctx.createPattern(grainCanvas(), "repeat")
  if (!pattern) return
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.globalCompositeOperation = "overlay"
  ctx.fillStyle = pattern
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

export function vignette(ctx: Ctx, w: number, h: number, hex: string, edgeAlpha: number): void {
  const g = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.3,
    w / 2,
    h / 2,
    Math.hypot(w, h) * 0.55
  )
  g.addColorStop(0, rgba(hex, 0))
  g.addColorStop(1, rgba(hex, edgeAlpha))
  ctx.save()
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

export interface Pt {
  x: number
  y: number
}

/** Catmull-Rom through the points, emitted as cubic Béziers on the current path. */
export function smoothPath(ctx: Ctx, pts: readonly Pt[], tension = 1): void {
  if (pts.length < 2) return
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const k = tension / 6
    ctx.bezierCurveTo(
      p1.x + (p2.x - p0.x) * k,
      p1.y + (p2.y - p0.y) * k,
      p2.x - (p3.x - p1.x) * k,
      p2.y - (p3.y - p1.y) * k,
      p2.x,
      p2.y
    )
  }
}
