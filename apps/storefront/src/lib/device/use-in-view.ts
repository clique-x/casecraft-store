'use client';

import { useCallback, useSyncExternalStore } from 'react';

const snapshots = new Map<string, boolean>();

/**
 * Intersection state of the first element matching `selector`; `null` until known,
 * `false` when absent. Toggling `enabled` re-queries the element, so callers that
 * outlive the page (layout chrome) can follow a hero that mounts or unmounts.
 * With `whole`, the element only counts as in view while all of it is on screen.
 */
export function useInView(selector: string, enabled = true, whole = false): boolean | null {
  const key = whole ? `${selector}|whole` : selector;
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!enabled) return () => {};
      snapshots.delete(key);
      const el = document.querySelector(selector);
      if (!el) {
        snapshots.set(key, false);
        onChange();
        return () => {};
      }
      const io = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          if (!entry) return;
          snapshots.set(key, whole ? entry.intersectionRatio >= 0.99 : entry.isIntersecting);
          onChange();
        },
        { threshold: whole ? [0, 0.99, 1] : 0 },
      );
      io.observe(el);
      return () => io.disconnect();
    },
    [selector, key, enabled, whole],
  );
  return useSyncExternalStore(
    subscribe,
    () => (enabled ? (snapshots.get(key) ?? null) : null),
    () => null,
  );
}
