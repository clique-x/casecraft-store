'use client';

import { AnimatePresence, m } from 'motion/react';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { useFeaturedItem } from '@/lib/hero-state';
import { EASE_OUT_EXPO } from '@/lib/motion/tokens';

const EASE: [number, number, number, number] = [...EASE_OUT_EXPO];

/** The featured design's name as an outlined watermark behind the stage (lg only); re-renders on a beat. */
export function HeroWord() {
  const item = useFeaturedItem();
  const reduced = useReducedMotion();
  const duration = reduced ? 0 : 0.7;
  return (
    <div className="hero-word" aria-hidden="true">
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span
          key={item.id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration, ease: EASE }}
          className="block"
        >
          {item.design}
        </m.span>
      </AnimatePresence>
    </div>
  );
}

export default HeroWord;
