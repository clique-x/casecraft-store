import { useSyncExternalStore } from 'react';
import { getPhoto, HERO_ORDER, type PhotoEntry } from '@/lib/catalog/photos';

/**
 * Plain mutable scene state. The hero controller, GSAP and gesture handlers read and write it
 * directly; nothing here triggers a React render.
 */
export const heroState = {
  scroll: 0,
  inView: true,
  pointer: { x: 0, y: 0 },
  // -Infinity, not 0: performance.now() starts at navigation, so 0 would read as a click at page load.
  lastInteractionAt: Number.NEGATIVE_INFINITY,
  beatActive: false,
};

type Listener = () => void;

/** `auto` marks changes the visitor did not ask for (auto-advance, cast resets). */
export type ChangeSource = 'user' | 'auto';

const DEFAULT_CAST: readonly number[] = HERO_ORDER.map((e) => e.id);
const FALLBACK_ITEM: PhotoEntry = HERO_ORDER[0];

let cast: readonly number[] = DEFAULT_CAST;
let featuredIndex = 0;
let lastSource: ChangeSource = 'auto';
const listeners = new Set<Listener>();

function emit(): void {
  for (const cb of listeners) cb();
}

function wrap(i: number): number {
  const n = Math.max(1, cast.length);
  return ((i % n) + n) % n;
}

function sameCast(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

export const featuredStore = {
  /**
   * Replaces the cast (photo ids). The current front stays current when it belongs to the new
   * cast; otherwise the index resets to 0 and the controller runs a beat to it. An empty list
   * restores HERO_ORDER.
   */
  setCast(ids: number[]): void {
    const next: readonly number[] = ids.length > 0 ? Object.freeze([...ids]) : DEFAULT_CAST;
    if (sameCast(next, cast)) return;
    const currentId = cast[featuredIndex];
    cast = next;
    const keep = next.indexOf(currentId);
    featuredIndex = keep >= 0 ? keep : 0;
    emit();
  },
  cast(): readonly number[] {
    return cast;
  },
  index(): number {
    return featuredIndex;
  },
  set(i: number, source: ChangeSource = 'user'): void {
    const next = wrap(i);
    if (next === featuredIndex) return;
    featuredIndex = next;
    lastSource = source;
    emit();
  },
  next(source: ChangeSource = 'user'): void {
    featuredStore.set(featuredIndex + 1, source);
  },
  prev(source: ChangeSource = 'user'): void {
    featuredStore.set(featuredIndex - 1, source);
  },
  /** Whether the latest change came from the visitor or from auto-advance. */
  lastSource(): ChangeSource {
    return lastSource;
  },
  subscribe(cb: Listener): () => void {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  itemId(): number {
    return cast[featuredIndex] ?? DEFAULT_CAST[0];
  },
  /** Number of covers the cycle wraps over. */
  limit(): number {
    return cast.length;
  },
};

function getServerIndex(): number {
  return 0;
}

function getServerItemId(): number {
  return DEFAULT_CAST[0];
}

function getServerCast(): readonly number[] {
  return DEFAULT_CAST;
}

export function useFeaturedIndex(): number {
  return useSyncExternalStore(featuredStore.subscribe, featuredStore.index, getServerIndex);
}

/** The cast as a stable array reference; changes only on `setCast`. */
export function useFeaturedCast(): readonly number[] {
  return useSyncExternalStore(featuredStore.subscribe, featuredStore.cast, getServerCast);
}

export function itemAt(i: number): PhotoEntry {
  const id = cast[wrap(i)];
  return (id === undefined ? undefined : getPhoto(id)) ?? FALLBACK_ITEM;
}

/** Subscribes by item id, so a cast change that keeps the index still re-renders. */
export function useFeaturedItem(): PhotoEntry {
  const id = useSyncExternalStore(featuredStore.subscribe, featuredStore.itemId, getServerItemId);
  return getPhoto(id) ?? FALLBACK_ITEM;
}

const flagListeners = new Set<Listener>();
let autoAdvancePaused = false;

function emitFlags(): void {
  for (const cb of flagListeners) cb();
}

function subscribeFlags(cb: Listener): () => void {
  flagListeners.add(cb);
  return () => {
    flagListeners.delete(cb);
  };
}

function getServerFlag(): boolean {
  return false;
}

export const autoAdvance = {
  paused(): boolean {
    return autoAdvancePaused;
  },
  setPaused(paused: boolean): void {
    if (autoAdvancePaused === paused) return;
    autoAdvancePaused = paused;
    emitFlags();
  },
};

export function useAutoAdvancePaused(): boolean {
  return useSyncExternalStore(subscribeFlags, autoAdvance.paused, getServerFlag);
}
