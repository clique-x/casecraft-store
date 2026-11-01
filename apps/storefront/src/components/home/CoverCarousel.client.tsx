'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatInr } from '@/lib/catalog/photos';
import { cn } from '@/lib/utils';

export interface CarouselCover {
  id: string;
  handle: string;
  title: string;
  priceInr: number;
  thumb: ReactNode;
}

interface Props {
  covers: CarouselCover[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** "Galaxy Z Fold 8 Ultra" */
  phoneName: string;
  /** The phone's page, listing every cover for it. */
  allHref: string;
}

const ARROW =
  'grid size-10 place-items-center rounded-full border border-border bg-paper text-fg shadow-sm transition-[opacity,background-color,border-color] outline-none hover:border-fg focus-visible:outline-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-35';

/**
 * Every in-stock design for the visitor's phone as same-size tiles in a snap carousel, with
 * previous/next buttons that page by roughly one view and fade edges while more is hidden.
 */
export function CoverCarousel({ covers, selectedId, onSelect, phoneName, allHref }: Props) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 });
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
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: smooth ? 'smooth' : 'auto' });
  };

  const selected = covers.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="mt-8">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-base font-bold text-fg">Choose your design</p>
          <p className="flex flex-wrap items-center gap-x-3 text-caption text-fg-muted">
            <span>
              {covers.length} {covers.length === 1 ? 'design' : 'designs'} for {phoneName}
            </span>
            <Link
              href={allHref}
              className="inline-flex items-center gap-0.5 font-semibold whitespace-nowrap text-brand underline-offset-4 hover:underline"
            >
              See all <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </p>
        </div>
        {covers.length > 3 && (
          <div className="flex shrink-0 gap-2">
            <button type="button" aria-label="Previous designs" onClick={() => page(-1)} disabled={edges.start} className={ARROW}>
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button type="button" aria-label="More designs" onClick={() => page(1)} disabled={edges.end} className={ARROW}>
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <div className="relative mt-4">
        <ul
          ref={track}
          aria-label={`Designs for ${phoneName}`}
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pt-1 pb-3 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {covers.map((c) => {
            const on = c.id === selectedId;
            return (
              <li key={c.id} className="w-[6.75rem] shrink-0 snap-start sm:w-[7.5rem] lg:w-[8rem]">
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onSelect(c.id)}
                  className="group/tile flex w-full flex-col gap-1.5 rounded-xl text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <span
                    className={cn(
                      'relative block aspect-[3/4] w-full overflow-hidden rounded-xl bg-paper p-2 transition-shadow',
                      on ? 'ring-2 ring-fg' : 'ring-1 ring-border group-hover/tile:ring-fg/40',
                    )}
                  >
                    <span className="flex h-full w-full items-center justify-center [&>*]:max-h-full [&>*]:max-w-full">{c.thumb}</span>
                    {on && (
                      <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-fg text-paper">
                        <Check className="size-3" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span className="block truncate px-0.5 text-caption leading-tight font-semibold text-fg">{c.title}</span>
                  <span className="-mt-1 block px-0.5 text-caption text-fg-muted tabular-nums">{formatInr(c.priceInr)}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {/* Edge fades hint at more designs in that direction. */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 hidden w-10 bg-gradient-to-r from-surface-2 to-transparent transition-opacity sm:block',
            edges.start ? 'opacity-0' : 'opacity-100',
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 hidden w-10 bg-gradient-to-l from-surface-2 to-transparent transition-opacity sm:block',
            edges.end ? 'opacity-0' : 'opacity-100',
          )}
        />
      </div>

      {selected && (
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-fg-muted" aria-live="polite">
          In your combos: <strong className="text-fg">{selected.title}</strong>
          <span className="tabular-nums">· {formatInr(selected.priceInr)}</span>
          <Link href={`/products/${selected.handle}`} className="font-semibold text-brand underline-offset-4 hover:underline">
            View design
          </Link>
        </p>
      )}
    </div>
  );
}
