"use client"

import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  SRGBColorSpace,
} from "three"
import { CYCLE_ORDER, getDesign, type ProcDesign } from "./catalog"
import { fbm } from "./noise"
import { ensureQuoteFont, needsMainThread, paintDesign } from "./painters"

export type FeaturedSize = 512 | 256

const LRU_SIZE = 4
const THICKNESS_W = 128
const THICKNESS_H = 256

const cache = new Map<string, Promise<CanvasTexture>>()

function keyOf(design: ProcDesign, size: FeaturedSize): string {
  return `${design.id}:${size}`
}

function configure(texture: CanvasTexture, anisotropy: number): CanvasTexture {
  texture.colorSpace = SRGBColorSpace
  texture.generateMipmaps = true
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.anisotropy = anisotropy
  texture.needsUpdate = true
  return texture
}

async function paint(design: ProcDesign, size: FeaturedSize): Promise<CanvasTexture> {
  if (needsMainThread(design)) await ensureQuoteFont()
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size * 2
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("featured-texture: 2d context unavailable")
  paintDesign(ctx, canvas.width, canvas.height, design)
  return configure(new CanvasTexture(canvas), size === 512 ? 4 : 1)
}

function load(design: ProcDesign, size: FeaturedSize): Promise<CanvasTexture> {
  const key = keyOf(design, size)
  const hit = cache.get(key)
  if (hit) {
    cache.delete(key)
    cache.set(key, hit)
    return hit
  }
  const promise = paint(design, size)
  promise.catch(() => {
    cache.delete(key)
  })
  cache.set(key, promise)
  evict()
  return promise
}

function evict(): void {
  while (cache.size > LRU_SIZE) {
    const oldest = cache.keys().next().value
    if (oldest === undefined) return
    const dropped = cache.get(oldest)
    cache.delete(oldest)
    dropped?.then((texture) => texture.dispose()).catch(() => undefined)
  }
}

function nextInCycle(id: string): ProcDesign | undefined {
  const i = CYCLE_ORDER.indexOf(id)
  if (i === -1) return undefined
  return getDesign(CYCLE_ORDER[(i + 1) % CYCLE_ORDER.length])
}

function whenIdle(cb: () => void): void {
  if (typeof requestIdleCallback === "function") requestIdleCallback(() => cb(), { timeout: 1200 })
  else setTimeout(cb, 60)
}

function prefetchNext(design: ProcDesign, size: FeaturedSize): void {
  const next = nextInCycle(design.id)
  if (!next || cache.has(keyOf(next, size))) return
  whenIdle(() => {
    if (!cache.has(keyOf(next, size))) load(next, size).catch(() => undefined)
  })
}

/** Paints one design at size × 2·size on demand; LRU of 4, next design in cycle order prefetched. */
export function getFeaturedTexture(design: ProcDesign, size: FeaturedSize): Promise<CanvasTexture> {
  const texture = load(design, size)
  prefetchNext(design, size)
  return texture
}

let thicknessMap: CanvasTexture | null = null
let flatThicknessMap: CanvasTexture | null = null

function dataTexture(fill: (x: number, y: number) => number): CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = THICKNESS_W
  canvas.height = THICKNESS_H
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("featured-texture: 2d context unavailable")
  const img = ctx.createImageData(THICKNESS_W, THICKNESS_H)
  for (let y = 0; y < THICKNESS_H; y++) {
    for (let x = 0; x < THICKNESS_W; x++) {
      const v = Math.round(fill(x, y) * 255)
      const i = (y * THICKNESS_W + x) * 4
      img.data[i] = v
      img.data[i + 1] = v
      img.data[i + 2] = v
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const texture = new CanvasTexture(canvas)
  // Thickness is data, not colour: sRGB decoding would skew the film distribution.
  texture.colorSpace = NoColorSpace
  texture.generateMipmaps = true
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

/** Shared 128×256 three-octave fbm grey map for iridescenceThicknessMap on holo designs. */
export function getThicknessMap(): CanvasTexture {
  if (!thicknessMap) {
    thicknessMap = dataTexture((x, y) => 0.5 + 0.5 * fbm(x * 0.045, y * 0.045, 3, 2, 0.5, 91))
  }
  return thicknessMap
}

/** Constant mid-grey map so non-holo designs keep the thickness slot filled without a recompile. */
export function getFlatThicknessMap(): CanvasTexture {
  if (!flatThicknessMap) flatThicknessMap = dataTexture(() => 0.5)
  return flatThicknessMap
}
