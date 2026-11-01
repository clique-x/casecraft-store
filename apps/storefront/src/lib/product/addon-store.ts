import { useSyncExternalStore } from 'react';

/**
 * Accessory ids ticked under "Complete the protection" on a cover page, shared by the buy box
 * and the sticky bar so both add the same set. The buy box resets it when the page changes.
 */
let selected: readonly string[] = [];
const listeners = new Set<() => void>();
const EMPTY: readonly string[] = [];

function emit(): void {
  for (const cb of listeners) cb();
}


export const addonStore = {
  get(): readonly string[] {
    return selected;
  },
  /** Any combination is allowed, including both screen guards (e.g. one spare, or one per phone). */
  toggle(id: string): void {
    selected = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    emit();
  },
  set(ids: readonly string[]): void {
    selected = [...ids];
    emit();
  },
  reset(): void {
    if (selected.length === 0) return;
    selected = EMPTY;
    emit();
  },
  subscribe(cb: () => void): () => void {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};

export function useSelectedAddons(): readonly string[] {
  return useSyncExternalStore(addonStore.subscribe, addonStore.get, () => EMPTY);
}
