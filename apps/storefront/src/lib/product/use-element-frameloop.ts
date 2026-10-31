'use client';

import { useEffect, useState, type RefObject } from 'react';

export type ElementFrameloop = 'always' | 'demand' | 'never';

interface Options {
  reducedMotion: boolean;
  enabled: boolean;
}

/**
 * Element visibility → R3F frameloop. The loop is 'never' while the element is
 * scrolled away or the tab is hidden, 'demand' under reduced motion (redraws
 * only on interaction) and 'always' otherwise.
 */
export function useElementFrameloop(
  target: RefObject<HTMLElement | null>,
  { reducedMotion, enabled }: Options,
): { frameloop: ElementFrameloop; inView: boolean } {
  const [inView, setInView] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = target.current;
    if (!el || !enabled) return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setInView(entry.isIntersecting);
      },
      { threshold: 0 },
    );
    io.observe(el);

    const onVisibility = () => setVisible(document.visibilityState === 'visible');
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [target, enabled]);

  const active = inView && visible;
  const frameloop: ElementFrameloop = !active ? 'never' : reducedMotion ? 'demand' : 'always';

  return { frameloop, inView };
}
