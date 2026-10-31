import type { Family, ProcDesign } from "../catalog"
import { paintAurora } from "./aurora"
import { paintHolo } from "./holo"
import { paintMarble } from "./marble"
import { paintMinimal } from "./minimal"
import { paintQuote } from "./quote"
import type { Ctx, Painter } from "./shared"
import { paintSticker } from "./sticker"
import { paintY2k } from "./y2k"

export type { Ctx, Painter } from "./shared"
export { ensureQuoteFont } from "./quote"

export const PAINTERS: Readonly<Record<Family, Painter>> = {
  marble: paintMarble,
  holo: paintHolo,
  aurora: paintAurora,
  y2k: paintY2k,
  quote: paintQuote,
  sticker: paintSticker,
  minimal: paintMinimal,
}

/** Families that read page fonts and therefore must paint on the main thread. */
export function needsMainThread(design: ProcDesign): boolean {
  return design.family === "quote"
}

export function paintDesign(ctx: Ctx, w: number, h: number, design: ProcDesign): void {
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = "source-over"
  PAINTERS[design.family](ctx, w, h, design)
  ctx.restore()
}
