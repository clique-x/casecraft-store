import type { AtlasWorkerRequest, AtlasWorkerResponse } from "./atlas"
import type { Family } from "./catalog"
import { paintAurora } from "./painters/aurora"
import { paintHolo } from "./painters/holo"
import { paintMarble } from "./painters/marble"
import { paintMinimal } from "./painters/minimal"
import type { Painter } from "./painters/shared"
import { paintSticker } from "./painters/sticker"
import { paintY2k } from "./painters/y2k"

// Text families are absent on purpose: workers cannot see the page's fonts.
const PAINTERS: Partial<Record<Family, Painter>> = {
  marble: paintMarble,
  holo: paintHolo,
  aurora: paintAurora,
  y2k: paintY2k,
  sticker: paintSticker,
  minimal: paintMinimal,
}

function reply(response: AtlasWorkerResponse, transfer: Transferable[] = []): void {
  self.postMessage(response, { transfer })
}

function paintAtlas(request: AtlasWorkerRequest): ImageBitmap {
  const { size, cols, rows, designs, slots } = request
  const tileW = size / cols
  const tileH = size / rows

  const atlas = new OffscreenCanvas(size, size)
  const ctx = atlas.getContext("2d")
  const scratch = new OffscreenCanvas(tileW, tileH)
  const sctx = scratch.getContext("2d")
  if (!ctx || !sctx) throw new Error("atlas.worker: 2d context unavailable")

  designs.forEach((design, i) => {
    const painter = PAINTERS[design.family]
    if (!painter) return
    sctx.save()
    sctx.setTransform(1, 0, 0, 1, 0, 0)
    sctx.clearRect(0, 0, tileW, tileH)
    painter(sctx, tileW, tileH, design)
    sctx.restore()
    const slot = slots[i]
    ctx.drawImage(scratch, (slot % cols) * tileW, Math.floor(slot / cols) * tileH)
  })

  return atlas.transferToImageBitmap()
}

self.addEventListener("message", (event: MessageEvent<AtlasWorkerRequest>) => {
  try {
    const bitmap = paintAtlas(event.data)
    reply({ ok: true, bitmap }, [bitmap])
  } catch (err) {
    reply({ ok: false, error: err instanceof Error ? err.message : String(err) })
  }
})
