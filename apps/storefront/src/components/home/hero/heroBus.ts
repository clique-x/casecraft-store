import { useSyncExternalStore } from 'react';
import { featuredStore, heroState, type ChangeSource } from '@/lib/hero-state';

export * from './heroConfig';

type Listener = () => void;

interface Store<T> {
  get(): T;
  set(next: T): void;
  subscribe(cb: Listener): () => void;
}

function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => value,
    set(next) {
      if (Object.is(next, value)) return;
      value = next;
      for (const cb of listeners) cb();
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
  };
}

function useStore<T>(store: Store<T>, serverValue: T): T {
  return useSyncExternalStore(store.subscribe, store.get, () => serverValue);
}

/** Chip strip selection: `undefined` follows `my_phone`, `null` is "All", else a model slug. */
export const chipSelection = createStore<string | null | undefined>(undefined);
export function useChipSelection(): string | null | undefined {
  return useStore(chipSelection, undefined);
}

/** Whether auto-advance runs on this page (drives the pause button's visibility). */
export const autoLive = createStore(false);
export function useAutoLive(): boolean {
  return useStore(autoLive, false);
}

/** Set by HeadlineFlip when the model name does not fit line 2; the kicker carries it instead. */
export const kickerOverride = createStore<string | null>(null);
export function useKickerOverride(): string | null {
  return useStore(kickerOverride, null);
}

/**
 * Every deliberate stage interaction stamps the idle clock: auto-advance waits
 * IDLE_AFTER_INTERACTION_MS and then resumes. Only the pause button stops it for good.
 */
export function markInteraction(): void {
  heroState.lastInteractionAt = performance.now();
}

export interface HeroController {
  beat(dir: 1 | -1, source: ChangeSource): void;
  goTo(index: number, source: ChangeSource): void;
}

let controller: HeroController | null = null;

/**
 * Commands from the label, dots, chips and keyboard. The stage controller registers
 * itself; before it does (or without it) the store moves and the DOM follows in CSS.
 */
export const heroCommands = {
  register(next: HeroController): () => void {
    controller = next;
    return () => {
      if (controller === next) controller = null;
    };
  },
  beat(dir: 1 | -1, source: ChangeSource = 'user'): void {
    if (source === 'user') markInteraction();
    if (controller) controller.beat(dir, source);
    else if (dir > 0) featuredStore.next(source);
    else featuredStore.prev(source);
  },
  goTo(index: number, source: ChangeSource = 'user'): void {
    if (source === 'user') markInteraction();
    if (controller) controller.goTo(index, source);
    else featuredStore.set(index, source);
  },
};
