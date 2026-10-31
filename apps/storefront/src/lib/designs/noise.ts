/** Deterministic PRNG; returns a function yielding floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash2(ix: number, iy: number, seed: number): number {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

function quintic(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/** Smooth value noise in [-1, 1]. */
export function valueNoise2D(x: number, y: number, seed = 0): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = quintic(x - x0)
  const fy = quintic(y - y0)
  const v00 = hash2(x0, y0, seed)
  const v10 = hash2(x0 + 1, y0, seed)
  const v01 = hash2(x0, y0 + 1, seed)
  const v11 = hash2(x0 + 1, y0 + 1, seed)
  const top = v00 + (v10 - v00) * fx
  const bottom = v01 + (v11 - v01) * fx
  return (top + (bottom - top) * fy) * 2 - 1
}

/** Fractal Brownian motion over valueNoise2D, normalised to [-1, 1]. */
export function fbm(
  x: number,
  y: number,
  octaves = 3,
  lacunarity = 2.0,
  gain = 0.5,
  seed = 0
): number {
  let amp = 1
  let freq = 1
  let sum = 0
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise2D(x * freq, y * freq, seed + i * 101) * amp
    norm += amp
    amp *= gain
    freq *= lacunarity
  }
  return sum / norm
}
