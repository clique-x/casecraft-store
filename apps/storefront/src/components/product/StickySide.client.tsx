'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const HEADER_PX = 80;
const GAP_PX = 24;

/**
 * The buy column beside a long image column (lg and up). Short enough for the screen: it sticks
 * under the header. Taller: it scrolls with the page until its last line is in view, then holds
 * there, so nothing in it is ever out of reach while the images keep scrolling.
 */
export function StickySide({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(HEADER_PX);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const fits = el.offsetHeight + HEADER_PX + GAP_PX <= window.innerHeight;
      setTop(fits ? HEADER_PX : window.innerHeight - el.offsetHeight - GAP_PX);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div ref={ref} className={cn('lg:sticky lg:self-start', className)} style={{ top }}>
      {children}
    </div>
  );
}
