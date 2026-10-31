import type { ProcDesign } from "./catalog"
import { ensureQuoteFont, needsMainThread, paintDesign } from "./painters"
import { createCanvas, get2d, type AnyCanvas } from "./painters/shared"

export const ATLAS_COLS = 8
export const ATLAS_ROWS = 4
export type AtlasSize = 2048 | 1024

/** [u offset, v offset, u scale, v scale] in three.js texture space (v up, flipY). */
export type AtlasTile = readonly [u: number, v: number, su: number, sv: number]

export interface BuiltAtlas {
  canvas: HTMLCanvasElement
  blobUrl: string
  tileOf: (id: string) => AtlasTile
  cols: typeof ATLAS_COLS
  rows: typeof ATLAS_ROWS
}

export interface AtlasWorkerRequest {
  size: AtlasSize
  cols: number
  rows: number
  designs: ProcDesign[]
  slots: number[]
}

export type AtlasWorkerResponse =
  | { ok: true; bitmap: ImageBitmap }
  | { ok: false; error: string }

const WORKER_TIMEOUT_MS = 8000
const FRAME_BUDGET_MS = 4
const BLANK_TILE: AtlasTile = [0, 0, 0, 0]

interface Slotted {
  design: ProcDesign
  slot: number
}

function slotRect(slot: number, tileW: number, tileH: number): [number, number] {
  return [(slot % ATLAS_COLS) * tileW, Math.floor(slot / ATLAS_COLS) * tileH]
}

function canUseWorker(): boolean {
  return (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof ImageBitmap !== "undefined"
  )
}

function paintInWorker(request: AtlasWorkerRequest): Promise<ImageBitmap> {
  return new Promise<ImageBitmap>((resolve, reject) => {
    let worker: Worker
    try {
      worker = new Worker(new URL("./atlas.worker.ts", import.meta.url))
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)))
      return
    }
    const finish = (): void => {
      clearTimeout(timer)
      worker.terminate()
    }
    const timer = setTimeout(() => {
      finish()
      reject(new Error("atlas worker timed out"))
    }, WORKER_TIMEOUT_MS)
    worker.onmessage = (event: MessageEvent<AtlasWorkerResponse>) => {
      finish()
      if (event.data.ok) resolve(event.data.bitmap)
      else reject(new Error(event.data.error))
    }
    worker.onerror = (event) => {
      finish()
      reject(new Error(event.message || "atlas worker failed"))
    }
    worker.postMessage(request)
  })
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => resolve())
    else setTimeout(resolve, 16)
  })
}

function paintTileInto(
  ctx: CanvasRenderingContext2D,
  scratch: AnyCanvas,
  item: Slotted,
  tileW: number,
  tileH: number
): void {
  const sctx = get2d(scratch)
  sctx.clearRect(0, 0, tileW, tileH)
  paintDesign(sctx, tileW, tileH, item.design)
  const [x, y] = slotRect(item.slot, tileW, tileH)
  ctx.drawImage(scratch, x, y)
}

/** Fallback when no worker is available: a few milliseconds of painting per frame. */
async function paintIncrementally(
  ctx: CanvasRenderingContext2D,
  items: readonly Slotted[],
  tileW: number,
  tileH: number
): Promise<void> {
  const scratch = createCanvas(tileW, tileH)
  let i = 0
  while (i < items.length) {
    await nextFrame()
    const start = performance.now()
    do {
      paintTileInto(ctx, scratch, items[i], tileW, tileH)
      i++
    } while (i < items.length && performance.now() - start < FRAME_BUDGET_MS)
  }
}

function toBlobUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve) => {
    const done = (blob: Blob | null): void => {
      resolve(blob ? URL.createObjectURL(blob) : "")
    }
    try {
      canvas.toBlob((blob) => {
        if (blob) done(blob)
        else canvas.toBlob(done, "image/png")
      }, "image/webp", 0.82)
    } catch {
      done(null)
    }
  })
}

export async function buildAtlas(
  designs: readonly ProcDesign[],
  size: AtlasSize
): Promise<BuiltAtlas> {
  if (designs.length > ATLAS_COLS * ATLAS_ROWS) {
    throw new Error(`buildAtlas: ${designs.length} designs exceed ${ATLAS_COLS * ATLAS_ROWS} tiles`)
  }
  const tileW = size / ATLAS_COLS
  const tileH = size / ATLAS_ROWS

  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("buildAtlas: 2d context unavailable")

  const slotted: Slotted[] = designs.map((design, slot) => ({ design, slot }))
  const offThread = slotted.filter((item) => !needsMainThread(item.design))
  const onThread = slotted.filter((item) => needsMainThread(item.design))

  let paintedOffThread = false
  if (canUseWorker()) {
    try {
      const bitmap = await paintInWorker({
        size,
        cols: ATLAS_COLS,
        rows: ATLAS_ROWS,
        designs: offThread.map((item) => item.design),
        slots: offThread.map((item) => item.slot),
      })
      ctx.drawImage(bitmap, 0, 0)
      bitmap.close()
      paintedOffThread = true
    } catch {
      paintedOffThread = false
    }
  }
  if (!paintedOffThread) await paintIncrementally(ctx, offThread, tileW, tileH)

  if (onThread.length > 0) {
    await ensureQuoteFont()
    const scratch = createCanvas(tileW, tileH)
    for (const item of onThread) paintTileInto(ctx, scratch, item, tileW, tileH)
  }

  const blobUrl = await toBlobUrl(canvas)

  const tiles = new Map<string, AtlasTile>()
  for (const { design, slot } of slotted) {
    const col = slot % ATLAS_COLS
    const row = Math.floor(slot / ATLAS_COLS)
    tiles.set(design.id, [col / ATLAS_COLS, 1 - (row + 1) / ATLAS_ROWS, 1 / ATLAS_COLS, 1 / ATLAS_ROWS])
  }

  return {
    canvas,
    blobUrl,
    tileOf: (id) => tiles.get(id) ?? BLANK_TILE,
    cols: ATLAS_COLS,
    rows: ATLAS_ROWS,
  }
}
