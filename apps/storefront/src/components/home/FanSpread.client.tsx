'use client';

import { useRef, type ReactNode } from 'react';
import { useMotionValueEvent, useScroll, useSpring } from 'motion/react';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';

interface Props {
  children: ReactNode;
  className?: string;
}

const SPRING = { stiffness: 120, damping: 24, mass: 0.8 } as const;

/**
 * Writes `--spread` (0 → 1) on its root as the fan scrolls from the viewport's bottom edge to its
 * centre, so the outer covers slide out from behind the middle one. Reduced motion keeps the
 * fan open (`--spread` defaults to 1 in the slot transforms).
 */
export function FanSpread({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center 60%'] });
  const spread = useSpring(scrollYProgress, SPRING);

  useMotionValueEvent(spread, 'change', (v) => {
    if (reduced) return;
    ref.current?.style.setProperty('--spread', Math.min(1, Math.max(0, v)).toFixed(3));
  });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export default FanSpread;
