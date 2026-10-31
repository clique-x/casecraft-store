'use client';

import { useCallback, useSyncExternalStore } from 'react';

const snapshots = new Map<string, boolean>();

/**
 * Intersection state of the first element matching `selector`; `null` until known,
 * `false` when absent. Toggling `enabled` re-queries the element, so callers that
 * outlive the page (layout chrome) can follow a hero that mounts or unmounts.
 */
export function useInView(selector: string, enabled = true): boolean | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!enabled) return () => {};
      snapshots.delete(selector);
      const el = document.querySelector(selector);
      if (!el) {
        snapshots.set(selector, false);
        onChange();
        return () => {};
      }
      const io = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          if (!entry) return;
          snapshots.set(selector, entry.isIntersecting);
          onChange();
        },
        { threshold: 0 },
      );
      io.observe(el);
      return () => io.disconnect();
    },
    [selector, enabled],
  );
  return useSyncExternalStore(
    subscribe,
    () => (enabled ? (snapshots.get(selector) ?? null) : null),
    () => null,
  );
}
