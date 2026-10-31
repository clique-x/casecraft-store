import { DISPLAY_FAMILY } from "@/lib/fonts"
import type { ProcDesign } from "../catalog"
import { mulberry32 } from "../noise"
import { DEG, grain, rgba, white, type Ctx } from "./shared"

const BASE_PX = 56
const ROTATION = -8 * DEG
const FONT_LOAD_TIMEOUT_MS = 2500

// DISPLAY_FAMILY is already a quoted family list from next/font.
export function quoteFont(px: number): string {
  return `700 ${px}px ${DISPLAY_FAMILY}, system-ui, sans-serif`
}

let fontReady: Promise<void> | null = null

/** Main thread only: resolves once the display font is usable (or after a timeout). */
export function ensureQuoteFont(): Promise<void> {
  if (fontReady) return fontReady
  if (typeof document === "undefined" || !("fonts" in document)) {
    fontReady = Promise.resolve()
    return fontReady
  }
  const load = document.fonts.load(`700 ${BASE_PX}px ${DISPLAY_FAMILY}`).then(
    () => undefined,
    () => undefined
  )
  const timeout = new Promise<void>((resolve) => {
    setTimeout(resolve, FONT_LOAD_TIMEOUT_MS)
  })
  fontReady = Promise.race([load, timeout])
  return fontReady
}

function fitFontSize(ctx: Ctx, words: readonly string[], w: number, h: number, s: number): number {
  let px = BASE_PX * s
  const minPx = 26 * s
  const maxWidth = w * 0.84
  const maxHeight = h * 0.62
  for (let guard = 0; guard < 24; guard++) {
    ctx.font = quoteFont(px)
    const widest = Math.max(...words.map((word) => ctx.measureText(word).width))
    const tall = words.length * px * 0.98
    if ((widest <= maxWidth && tall <= maxHeight) || px <= minPx) break
    px *= 0.94
  }
  return px
}

export function paintQuote(ctx: Ctx, w: number, h: number, design: ProcDesign): void {
  const s = w / 256
  const rnd = mulberry32(design.seed)
  const { base, a, b, c, ink } = design.palette
  const text = design.quote ?? design.name.toLowerCase()
  const words = text.split(" ")

  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  // A soft tonal wash keeps the card from reading as flat vinyl.
  const wash = ctx.createRadialGradient(w * 0.3, h * 0.25, 0, w * 0.3, h * 0.25, h * 0.75)
  wash.addColorStop(0, rgba(b, 0.55))
  wash.addColorStop(1, rgba(b, 0))
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, w, h)

  // Sticker dot.
  const dotR = 10 * s
  const dotX = w * (0.66 + rnd() * 0.18)
  const dotY = h * (0.14 + rnd() * 0.1)
  ctx.beginPath()
  ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2)
  ctx.fillStyle = c
  ctx.fill()
  ctx.beginPath()
  ctx.arc(dotX - dotR * 0.3, dotY - dotR * 0.3, dotR * 0.3, 0, Math.PI * 2)
  ctx.fillStyle = white(0.55)
  ctx.fill()

  const px = fitFontSize(ctx, words, w, h, s)
  const lineHeight = px * 0.98

  ctx.save()
  ctx.translate(w / 2, h / 2 + px * 0.04)
  ctx.rotate(ROTATION)
  ctx.font = quoteFont(px)
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  const offset = 2 * s

  words.forEach((word, i) => {
    const y = (i - (words.length - 1) / 2) * lineHeight
    ctx.fillStyle = a
    ctx.fillText(word, offset, y + offset)
    ctx.fillStyle = ink
    ctx.fillText(word, 0, y)
  })
  ctx.restore()

  grain(ctx, w, h, 0.01)
}
