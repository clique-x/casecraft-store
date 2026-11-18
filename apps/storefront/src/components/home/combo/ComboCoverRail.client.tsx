'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RailCover {
  id: string;
  title: string;
  src: string;
  srcSet: string;
}

interface Props {
  covers: RailCover[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** "Designs for iPhone 16 Pro" */
  label: string;
}

const ARROW =
  'absolute top-1/2 z-10 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-paper text-fg shadow-md transition-opacity outline-none hover:border-fg focus-visible:outline-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-0 lg:grid';

/**
 * Every design for the visitor's phone as small tiles in one swipeable row. It bleeds to the card's edges on
 * phones so the next tile peeks in; on desktop, arrows appear only while more is hidden on that side.
 */
export function ComboCoverRail({ covers, selectedId, onSelect, label }: Props) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const start = el.scrollLeft <= 4;
    const end = el.scrollLeft >= max - 4;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      ro.disconnect();
    };
  }, [measure, covers.length]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: smooth ? 'smooth' : 'auto' });
  };

  return (
    <div className="relative">
      <ul
        ref={track}
        aria-label={label}
        className="-mx-4 flex snap-x gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-px-4 px-4 py-1.5 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-1 lg:px-1 [&::-webkit-scrollbar]:hidden"
      >
        {covers.map((c) => {
          const on = c.id === selectedId;
          return (
            <li key={c.id} className="shrink-0 snap-start">
              <button
                type="button"
                aria-pressed={on}
                aria-label={c.title}
                title={c.title}
                onClick={(e) => {
                  onSelect(c.id);
                  e.currentTarget.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
                }}
                className={cn(
                  'relative block aspect-[4/5] w-12 overflow-hidden rounded-[0.6rem] bg-surface-2 transition-[box-shadow,transform] duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-95 lg:w-[3.75rem]',
                  on ? 'ring-2 ring-fg ring-offset-2 ring-offset-paper' : 'ring-1 ring-border hover:ring-fg/50',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- small catalogue photo at a fixed size */}
                <img src={c.src} srcSet={c.srcSet} sizes="60px" alt="" loading="lazy" className="size-full object-cover" />
                {on && (
                  <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-fg text-paper">
                    <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" aria-label="Previous designs" onClick={() => page(-1)} disabled={edges.start} className={cn(ARROW, '-left-3')}>
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>
      <button type="button" aria-label="More designs" onClick={() => page(1)} disabled={edges.end} className={cn(ARROW, '-right-3')}>
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export default ComboCoverRail;
