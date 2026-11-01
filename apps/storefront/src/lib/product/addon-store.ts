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

/** Accessories that replace each other: only one screen guard at a time. */
export const EXCLUSIVE_GROUPS: readonly (readonly string[])[] = [['glass-clear', 'glass-privacy']];

export const addonStore = {
  get(): readonly string[] {
    return selected;
  },
  toggle(id: string): void {
    if (selected.includes(id)) {
      selected = selected.filter((x) => x !== id);
    } else {
      const rivals = EXCLUSIVE_GROUPS.find((g) => g.includes(id)) ?? [];
      selected = [...selected.filter((x) => !rivals.includes(x)), id];
    }
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
