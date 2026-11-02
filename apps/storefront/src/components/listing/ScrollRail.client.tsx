'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal.client';
import { cn } from '@/lib/utils';

/**
 * Sideways only: `overflow-y-hidden` stops the list becoming a vertical scroller when a card's
 * shadow, tilt or entrance animation reaches past its bottom edge (with `overflow-x: auto` alone the
 * browser makes the y axis scrollable too, so the wheel scrolls the row instead of the page).
 * The scrollbar is hidden at every size; mouse users get the arrow buttons instead.
 */
const RAIL =
  '-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-px-4 px-4 pt-2 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:snap-proximity lg:gap-5 lg:scroll-px-0 lg:px-0';

const ARROW =
  'absolute top-[38%] z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-paper/95 text-fg shadow-md backdrop-blur transition-colors outline-none hover:border-fg focus-visible:outline-2 focus-visible:outline-brand lg:grid';

interface ScrollRailProps {
  /** Accessible name for the list. */
  label: string;
  /** The `li` items. */
  children: ReactNode;
  /** For callers that observe the list (e.g. the centre card on touch). */
  ref?: Ref<HTMLUListElement>;
  className?: string;
}

/** Horizontal card row: swipe on touch, arrow buttons on desktop. The row fades in as one piece. */
export function ScrollRail({ label, children, ref, className }: ScrollRailProps) {
  const list = useRef<HTMLUListElement | null>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const setList = useCallback(
    (node: HTMLUListElement | null) => {
      list.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const measure = useCallback(() => {
    const el = list.current;
    if (!el) return;
    const start = el.scrollLeft <= 4;
    const end = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4;
    // Only re-render when an arrow appears or disappears, not on every scroll frame.
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      ro.disconnect();
    };
  }, [measure]);

  const page = (dir: 1 | -1) => {
    const el = list.current;
    if (!el) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: smooth ? 'smooth' : 'auto' });
  };

  return (
    <Reveal className="relative mt-6">
      <ul ref={setList} aria-label={label} className={cn(RAIL, className)}>
        {children}
      </ul>
      {!edges.start && (
        <button type="button" aria-label="Scroll back" onClick={() => page(-1)} className={cn(ARROW, '-left-5')}>
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
      )}
      {!edges.end && (
        <button type="button" aria-label="Scroll for more" onClick={() => page(1)} className={cn(ARROW, '-right-5')}>
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      )}
    </Reveal>
  );
}
