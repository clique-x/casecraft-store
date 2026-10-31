import { useSyncExternalStore } from 'react';
import type { CaseType } from '@/lib/medusa/fixtures';

export interface VariantSelection {
  modelSlug: string | null;
  caseType: CaseType;
}

export const DEFAULT_SELECTION: VariantSelection = { modelSlug: null, caseType: 'soft' };

let state: VariantSelection = DEFAULT_SELECTION;
const listeners = new Set<() => void>();

function emit(): void {
  for (const cb of listeners) cb();
}

function same(a: VariantSelection, b: VariantSelection): boolean {
  return a.modelSlug === b.modelSlug && a.caseType === b.caseType;
}

/**
 * Per-page selection shared by the buy box, the viewer, the sticky bar and the
 * "More for your phone" rail. The buy box owns reset on mount and unmount.
 */
export const variantStore = {
  get(): VariantSelection {
    return state;
  },
  set(partial: Partial<VariantSelection>): void {
    const next: VariantSelection = {
      modelSlug: partial.modelSlug !== undefined ? partial.modelSlug : state.modelSlug,
      caseType: partial.caseType ?? state.caseType,
    };
    if (same(state, next)) return;
    state = next;
    emit();
  },
  reset(initial: VariantSelection): void {
    if (same(state, initial)) return;
    state = { modelSlug: initial.modelSlug, caseType: initial.caseType };
    emit();
  },
  subscribe(cb: () => void): () => void {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};

const getServerSnapshot = (): VariantSelection => DEFAULT_SELECTION;

export function useVariantSelection(): VariantSelection {
  return useSyncExternalStore(variantStore.subscribe, variantStore.get, getServerSnapshot);
}
