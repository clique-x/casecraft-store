'use client';

import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const MAX_DEG = 5;

/**
 * A glass card that tilts a few degrees toward the pointer and carries a glare that follows it.
 * Pure CSS variables, no animation loop: nothing runs until the pointer moves, and touch screens
 * get the card at rest.
 */
export function GlassTilt({ className, delay, children }: { className?: string; /** Entrance delay, for the stagger. */ delay?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${((0.5 - py) * MAX_DEG * 2).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((px - 0.5) * MAX_DEG * 2).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn('glass-tilt group/glass relative', className)}
      style={delay ? ({ ['--d' as string]: delay } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
