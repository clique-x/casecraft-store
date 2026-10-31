'use client';

import { useEffect } from 'react';
import { heroState } from '@/lib/hero-state';
import type { GsapBundle } from './useHeroBeats';

const FADE_START = 0.6;
const FADE_END = 0.95;
const VARS = ['--scroll-ry', '--scroll-y', '--scroll-y2', '--scroll-sheen', '--scroll-s', '--halo-o', '--scene-opacity'] as const;

/**
 * Scrubbed hero progress, no pin: the rig turns and rises, the backstage rises faster,
 * the halo dims and the scene fades out between 60 % and 95 % of the hero height.
 * Writes custom properties on the section only; reduced motion keeps a CSS-only fade.
 */
export function useHeroScroll(section: HTMLElement | null, bundle: GsapBundle | null, enabled: boolean): void {
  useEffect(() => {
    if (!section || !bundle || !enabled) return;
    const { gsap, ScrollTrigger } = bundle;
    const style = section.style;
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          heroState.scroll = p;
          const fade = 1 - Math.min(1, Math.max(0, (p - FADE_START) / (FADE_END - FADE_START)));
          style.setProperty('--scroll-ry', `${(-18 * p).toFixed(3)}deg`);
          style.setProperty('--scroll-y', `${(-40 * p).toFixed(2)}px`);
          style.setProperty('--scroll-y2', `${(-30 * p).toFixed(2)}px`);
          style.setProperty('--scroll-sheen', `${(-14 * p).toFixed(2)}%`);
          style.setProperty('--scroll-s', (1 - 0.14 * p).toFixed(4));
          style.setProperty('--halo-o', (1 - 0.6 * p).toFixed(3));
          style.setProperty('--scene-opacity', fade.toFixed(3));
        },
      });
      return () => {
        trigger.kill();
      };
    });

    return () => {
      mm.revert();
      heroState.scroll = 0;
      for (const name of VARS) style.removeProperty(name);
    };
  }, [section, bundle, enabled]);
}
