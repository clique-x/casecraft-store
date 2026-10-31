import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  /** CSS length or custom property for the slab's top edge inside a `position: relative` parent. */
  top: string;
  /** Omitted: the slab runs to the parent's bottom edge. */
  height?: string;
  className?: string;
}

/** The deep-teal counter slab with its coral top line; paints over whatever stands behind it. */
export function Ledge({ top, height, className }: Props) {
  const style: CSSProperties = height ? { top, height } : { top, bottom: 0 };
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-x-0 border-t-2 border-accent bg-ink-2', className)}
      style={style}
    />
  );
}
