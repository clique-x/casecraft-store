'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';
import { m, useMotionValue, useSpring } from 'motion/react';
import { useFinePointer } from '@/lib/device/use-fine-pointer';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  className?: string;
  /** Fraction of the pointer offset the child follows. */
  strength?: number;
}

const SPRING = { stiffness: 220, damping: 18, mass: 0.6 } as const;

/** Fine-pointer only: the child leans towards the cursor while it hovers and springs back on leave. */
export function Magnetic({ children, className, strength = 0.28 }: Props) {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const active = fine && !reduced;
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, SPRING);
  const y = useSpring(my, SPRING);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!active || e.pointerType === 'touch') return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * strength);
    my.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <m.div
      ref={ref}
      style={active ? { x, y } : undefined}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      className={cn('inline-flex', className)}
    >
      {children}
    </m.div>
  );
}

export default Magnetic;
