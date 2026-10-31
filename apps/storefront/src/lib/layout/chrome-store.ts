import { useSyncExternalStore } from 'react';

type Listener = () => void;

const listeners = new Set<Listener>();
const state = { heroPresent: false, stickyCtaVisible: false };

function emit(): void {
  for (const cb of listeners) cb();
}

function subscribe(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * Page-level facts the persistent store chrome (header, FAB) reacts to.
 * Writers register from effects, so a page hidden by a navigation clears its flags.
 */
export const chromeStore = {
  setHeroPresent(present: boolean): void {
    if (state.heroPresent === present) return;
    state.heroPresent = present;
    emit();
  },
  setStickyCtaVisible(visible: boolean): void {
    if (state.stickyCtaVisible === visible) return;
    state.stickyCtaVisible = visible;
    emit();
  },
};

/** Whether a full-bleed dark hero is mounted on the current page; `serverFallback` is used for SSR and hydration. */
export function useHeroPresent(serverFallback: boolean): boolean {
  return useSyncExternalStore(
    subscribe,
    () => state.heroPresent,
    () => serverFallback,
  );
}

export function useStickyCtaVisible(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => state.stickyCtaVisible,
    () => false,
  );
}
