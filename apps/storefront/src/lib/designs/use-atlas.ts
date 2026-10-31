"use client"

import { useEffect, useSyncExternalStore } from "react"
import type { CanvasTexture } from "three"
import { buildAtlas, type AtlasSize, type AtlasTile } from "./atlas"
import { DESIGNS } from "./catalog"

export type { AtlasTile }

export interface Atlas {
  texture: CanvasTexture
  blobUrl: string
  tileOf: (id: string) => AtlasTile
  cols: 8
  rows: 4
}

const pending = new Map<AtlasSize, Promise<Atlas>>()
const resolved = new Map<AtlasSize, Atlas>()
const listeners = new Set<() => void>()

function notify(): void {
  listeners.forEach((cb) => cb())
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function anyResolved(): Atlas | null {
  for (const atlas of resolved.values()) return atlas
  return null
}

/**
 * Builds the 8×4 atlas once per page life for the given size and caches it at module scope.
 * three is imported on demand: thumbnails import this module, and they must not pull three
 * into the route's first-load JS.
 */
export function getAtlas(size: AtlasSize): Promise<Atlas> {
  const hit = pending.get(size)
  if (hit) return hit
  const promise = Promise.all([buildAtlas(DESIGNS, size), import("three")]).then(([built, three]) => {
    const { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } = three
    const texture = new CanvasTexture(built.canvas)
    texture.colorSpace = SRGBColorSpace
    texture.generateMipmaps = true
    texture.minFilter = LinearMipmapLinearFilter
    texture.magFilter = LinearFilter
    texture.anisotropy = size === 2048 ? 4 : 1
    texture.needsUpdate = true
    const atlas: Atlas = {
      texture,
      blobUrl: built.blobUrl,
      tileOf: built.tileOf,
      cols: built.cols,
      rows: built.rows,
    }
    resolved.set(size, atlas)
    notify()
    return atlas
  })
  promise.catch(() => {
    pending.delete(size)
  })
  pending.set(size, promise)
  return promise
}

/**
 * Subscribes to the atlas. With `enabled` the hook requests the build; without it
 * the hook only observes, falling back to whichever size another caller built
 * (thumbnails use the sprite as a CSS background, so any size serves).
 */
export function useAtlas(size: AtlasSize, enabled = true): { atlas: Atlas | null; ready: boolean } {
  const atlas = useSyncExternalStore(
    subscribe,
    () => resolved.get(size) ?? anyResolved(),
    () => null
  )

  useEffect(() => {
    if (!enabled) return
    getAtlas(size).catch(() => undefined)
  }, [size, enabled])

  return { atlas, ready: atlas !== null }
}
