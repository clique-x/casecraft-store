export type Tier = 'high' | 'mid' | 'low' | 'none';

export interface TierSettings {
  count: number;
  dpr: [number, number];
  atlas: 2048 | 1024;
  featured: 512 | 256;
  smoothness: number;
  antialias: boolean;
  env: boolean;
}

export const TIER_SETTINGS: Record<Exclude<Tier, 'none'>, TierSettings> = {
  high: { count: 24, dpr: [1, 1.75], atlas: 2048, featured: 512, smoothness: 4, antialias: true, env: true },
  mid: { count: 16, dpr: [1, 1.25], atlas: 1024, featured: 512, smoothness: 2, antialias: false, env: true },
  low: { count: 10, dpr: [1, 1], atlas: 1024, featured: 256, smoothness: 2, antialias: false, env: false },
};

export const TIER_LADDER: readonly Tier[] = ['high', 'mid', 'low', 'none'];

const STORAGE_KEY = 'heroTier';

interface ConnectionLike {
  saveData?: boolean;
  effectiveType?: string;
}

interface NavigatorExtras {
  connection?: ConnectionLike;
  deviceMemory?: number;
}

const NONE_RENDERERS = /Mali-4|Mali-T|Adreno \(TM\) [3-4]\d\d|PowerVR SGX|SwiftShader|llvmpipe/i;
const LOW_RENDERERS = /Mali-G5\d|Adreno \(TM\) 5\d\d|Adreno \(TM\) 61\d/i;

let cached: Tier | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const cb of listeners) cb();
}

/** Decided tier, or null until `detectTier()` has run on the client. */
export function getCachedTier(): Tier | null {
  return cached;
}

export function subscribeTier(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function isTier(v: string | null): v is Tier {
  return v === 'high' || v === 'mid' || v === 'low' || v === 'none';
}

export function readPersistedTier(): Tier | null {
  try {
    const v = window.sessionStorage.getItem(STORAGE_KEY);
    return isTier(v) ? v : null;
  } catch {
    return null;
  }
}

export function persistTier(t: Tier): void {
  const changed = cached !== t;
  cached = t;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, t);
  } catch {
    /* storage unavailable: the module cache still holds the decision */
  }
  if (changed) notify();
}

/** Returns the GPU renderer string, or null when WebGL2 is unavailable. */
function probeRenderer(): string | null {
  const canvas = document.createElement('canvas');
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true, powerPreference: 'high-performance' });
  } catch {
    gl = null;
  }
  if (!gl) return null;
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  let renderer = '';
  if (info) {
    const value: unknown = gl.getParameter(info.UNMASKED_RENDERER_WEBGL);
    renderer = typeof value === 'string' ? value : '';
  } else {
    const value: unknown = gl.getParameter(gl.RENDERER);
    renderer = typeof value === 'string' ? value : '';
  }
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return renderer;
}

export function detectTier(): Tier {
  if (cached) return cached;
  if (typeof window === 'undefined') return 'none';

  const persisted = readPersistedTier();
  if (persisted) {
    persistTier(persisted);
    return persisted;
  }

  const nav = navigator as Navigator & NavigatorExtras;
  const conn = nav.connection;
  const effectiveType = conn?.effectiveType ?? '';
  const memory = nav.deviceMemory ?? Infinity;
  const cores = nav.hardwareConcurrency ?? Infinity;

  let tier: Tier;
  const renderer = probeRenderer();

  if (
    conn?.saveData === true ||
    effectiveType === 'slow-2g' ||
    effectiveType === '2g' ||
    renderer === null ||
    memory <= 2 ||
    NONE_RENDERERS.test(renderer)
  ) {
    tier = 'none';
  } else if (memory <= 3 || cores <= 4 || effectiveType === '3g' || LOW_RENDERERS.test(renderer)) {
    tier = 'low';
  } else if (window.innerWidth < 1024) {
    tier = 'mid';
  } else {
    tier = 'high';
  }

  persistTier(tier);
  return tier;
}

export function demoteTier(t: Tier): Tier {
  const i = TIER_LADDER.indexOf(t);
  return TIER_LADDER[Math.min(i + 1, TIER_LADDER.length - 1)] ?? 'none';
}

/* ---------------------------------------------------------------------------------------------
 * Scene tier: the CSS hero on `/`. Decided once per session from connection and memory hints
 * only; it never creates a WebGL context. Reduced motion is read separately by the consumer.
 * ------------------------------------------------------------------------------------------- */

export type SceneTier = 'full' | 'lite' | 'static';

const SCENE_STORAGE_KEY = 'sceneTier';

let sceneCached: SceneTier | null = null;
const sceneListeners = new Set<() => void>();

function notifyScene(): void {
  for (const cb of sceneListeners) cb();
}

function isSceneTier(v: string | null): v is SceneTier {
  return v === 'full' || v === 'lite' || v === 'static';
}

/** Decided scene tier, or null until `detectSceneTier()` has run on the client. */
export function getCachedSceneTier(): SceneTier | null {
  return sceneCached;
}

export function subscribeSceneTier(cb: () => void): () => void {
  sceneListeners.add(cb);
  return () => {
    sceneListeners.delete(cb);
  };
}

export function readPersistedSceneTier(): SceneTier | null {
  try {
    const v = window.sessionStorage.getItem(SCENE_STORAGE_KEY);
    return isSceneTier(v) ? v : null;
  } catch {
    return null;
  }
}

export function persistSceneTier(t: SceneTier): void {
  const changed = sceneCached !== t;
  sceneCached = t;
  try {
    window.sessionStorage.setItem(SCENE_STORAGE_KEY, t);
  } catch {
    /* storage unavailable: the module cache still holds the decision */
  }
  if (changed) notifyScene();
}

export function detectSceneTier(): SceneTier {
  if (sceneCached) return sceneCached;
  if (typeof window === 'undefined') return 'static';

  const persisted = readPersistedSceneTier();
  if (persisted) {
    persistSceneTier(persisted);
    return persisted;
  }

  const nav = navigator as Navigator & NavigatorExtras;
  const conn = nav.connection;
  const effectiveType = conn?.effectiveType ?? '';
  const memory = nav.deviceMemory ?? Infinity;
  const cores = nav.hardwareConcurrency ?? Infinity;

  let tier: SceneTier;
  if (conn?.saveData === true || effectiveType === 'slow-2g' || effectiveType === '2g' || memory <= 2) {
    tier = 'static';
  } else if (memory <= 3 || cores <= 4 || effectiveType === '3g') {
    tier = 'lite';
  } else {
    tier = 'full';
  }

  persistSceneTier(tier);
  return tier;
}
