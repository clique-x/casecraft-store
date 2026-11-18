'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { formatInr } from '@/lib/catalog/photos';
import { useMediaQuery } from '@/lib/device/use-media-query';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { cn } from '@/lib/utils';

export interface ExploreRange {
  label: string;
  href: string;
  /** A product photo on the teal stage, or a transparent cutout; square either way. */
  image: string;
  imageSet?: string;
  /** What the photo shows: the product's name. */
  alt: string;
  /** Lowest price in the range, from the live catalogue. */
  fromInr: number;
  /** A transparent cutout: shown whole on a glow, instead of filling the frame. */
  cutout: boolean;
}

export interface ExploreDepartment {
  key: string;
  name: string;
  href: string;
  /** One line under the name. */
  blurb: string;
  ranges: ExploreRange[];
}

/** How long each range's picture stays before the next one takes its place (ms). */
const TURN_MS = 3200;
/** The studio set's own teal, so photos shot on it sit in the panel without an edge. */
const SURFACE = 'bg-[radial-gradient(130%_120%_at_70%_25%,#0b5364_0%,#06323c_46%,#021a20_100%)]';

function Panel({ department, on, desktop, tick, onOpen }: { department: ExploreDepartment; on: boolean; desktop: boolean; tick: number; onOpen: () => void }) {
  const { ranges } = department;
  // The range under the pointer or with focus holds its picture; otherwise the ranges take turns.
  const [held, setHeld] = useState<number | null>(null);
  const shown = held ?? tick % ranges.length;
  const fromInr = Math.min(...ranges.map((r) => r.fromInr));
  // On a desktop a closed panel is a single button; its links must not take focus from behind it.
  const closed = desktop && !on;

  return (
    <li
      data-open={on}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onOpen()}
      onPointerLeave={() => setHeld(null)}
      className={cn(
        'group/panel relative isolate flex w-[80%] shrink-0 snap-start flex-col overflow-hidden rounded-[1.25rem] text-white shadow-[0_18px_40px_-28px_rgba(0,22,25,.6)] sm:w-[44%]',
        // Desktop: the panels share the row, and the open one takes most of it.
        'lg:w-auto lg:min-w-0 lg:shrink lg:basis-0 lg:transition-[flex-grow] lg:duration-[550ms] lg:ease-out-expo motion-reduce:lg:transition-none',
        on ? 'lg:grow-[4.6]' : 'lg:grow',
        SURFACE,
      )}
    >
      {/*
        The picture. On a desktop it is a square as tall as the panel, centred in a window that is the panel's
        width until the panel is wider than the square: as the panel opens, the window only uncovers more of the
        same picture, so nothing resizes on the way. On phones the square is faded at its sides and foot, where
        a studio photo's own backdrop would otherwise end in an edge against the card.
      */}
      <div className="relative h-40 shrink-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[min(100%,23rem)] lg:[mask-image:none]">
        <div className="absolute -top-[12%] left-1/2 aspect-square h-[130%] -translate-x-1/2 [mask-image:linear-gradient(to_right,transparent,black_24%,black_76%,transparent)] lg:top-0 lg:h-full lg:[mask-image:none]">
          {ranges.map((r, k) => (
            // eslint-disable-next-line @next/next/no-img-element -- pre-sized static variants, no optimizer
            <img
              key={r.label}
              src={r.image}
              srcSet={r.imageSet}
              sizes="(min-width: 64rem) 368px, 80vw"
              alt={k === shown ? r.alt : ''}
              loading="lazy"
              decoding="async"
              draggable={false}
              className={cn(
                'absolute inset-0 size-full transition-opacity duration-700 ease-out',
                r.cutout ? 'object-contain p-[18%] drop-shadow-[0_18px_22px_rgba(0,0,0,.5)] lg:p-[20%]' : 'object-cover',
                k === shown ? 'opacity-100' : 'opacity-0',
              )}
            />
          ))}
        </div>
      </div>
      {/*
        Desktop, open: one flat ground under the text that runs on over the picture's near half and fades out
        there, so there is no line where the picture begins.
      */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-[calc(100%-11.5rem)] bg-[linear-gradient(to_right,#06323c_0%,#06323c_calc(100%-12.5rem),transparent_100%)] opacity-0 transition-opacity duration-500 group-data-[open=true]/panel:opacity-100 lg:block"
      />

      {/* Desktop, closed: the whole panel is one button that opens it. */}
      <button
        type="button"
        aria-expanded={on}
        tabIndex={on ? -1 : 0}
        onClick={onOpen}
        onFocus={onOpen}
        className={cn(
          'absolute inset-0 z-20 hidden cursor-pointer flex-col justify-end bg-gradient-to-t from-black/75 via-black/15 to-transparent p-4 text-left outline-none transition-opacity duration-300 focus-visible:ring-2 focus-visible:ring-gh-mint focus-visible:ring-inset lg:flex',
          on ? 'pointer-events-none opacity-0' : 'opacity-100 delay-150',
        )}
      >
        <span className="block text-[0.9375rem] leading-tight font-bold">{department.name}</span>
        <span className="mt-1 block text-caption text-white/70 tabular-nums">from {formatInr(fromInr)}</span>
      </button>

      {/* The department and its ranges. A fixed width on a desktop, so the text never re-wraps as the panel moves. */}
      <div
        inert={closed}
        className={cn(
          'relative z-10 flex flex-1 flex-col px-4 pt-1 pb-4 lg:absolute lg:inset-y-0 lg:left-0 lg:w-[19.5rem] lg:p-6 lg:transition-opacity lg:duration-300',
          on ? 'lg:opacity-100 lg:delay-200' : 'lg:opacity-0',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-xl leading-tight font-bold tracking-[-0.02em] lg:text-[1.625rem]">{department.name}</h4>
          <Link
            href={department.href}
            aria-label={`All ${department.name.toLowerCase()}`}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-white/40 outline-none transition-colors hover:border-white hover:bg-white hover:text-gh-teal focus-visible:ring-2 focus-visible:ring-gh-mint lg:size-10"
          >
            <ArrowUpRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>
        <p className="mt-1 text-[0.8125rem] leading-snug text-white/70 lg:mt-2">{department.blurb}</p>

        <ul className="mt-3 lg:mt-auto">
          {ranges.map((r, k) => (
            <li key={r.label}>
              <Link
                href={r.href}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setHeld(k)}
                onFocus={() => setHeld(k)}
                onBlur={() => setHeld(null)}
                className="group/row flex items-center justify-between gap-3 border-t border-white/12 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-gh-mint"
              >
                <span className="flex min-w-0 items-center gap-2.5 text-[0.9375rem] font-semibold">
                  <span className={cn('size-1.5 shrink-0 rounded-full transition-colors duration-300', k === shown ? 'bg-gh-mint' : 'bg-white/25')} />
                  <span className="truncate">{r.label}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-caption text-white/65 tabular-nums transition-colors group-hover/row:text-white">
                  from {formatInr(r.fromInr)}
                  <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-[opacity,transform] duration-200 group-hover/row:translate-x-0 group-hover/row:opacity-100 group-focus-visible/row:translate-x-0 group-focus-visible/row:opacity-100" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/**
 * "More to explore": every other department as a panel. On a desktop the panels stand in one row and the one
 * under the pointer opens to show its ranges, each a link with its lowest price; on phones and tablets they are
 * cards to swipe through, all open. In an open panel the picture changes to each range in turn, and to a range
 * as the pointer reaches it.
 *
 * Opening a panel animates only flex-grow; the text and the picture keep their size throughout, so the row
 * moves without re-wrapping or rescaling anything.
 */
export function DepartmentExplorer({ departments }: { departments: ExploreDepartment[] }) {
  const root = useRef<HTMLDivElement>(null);
  const desktop = useMediaQuery('(min-width: 1024px)');
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(0);
  const [tick, setTick] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !inView) return;
    const timer = window.setInterval(() => setTick((t) => t + 1), TURN_MS);
    return () => window.clearInterval(timer);
  }, [reduced, inView]);

  if (departments.length === 0) return null;
  return (
    <div ref={root} className="mt-8 lg:mt-10">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-[1.25rem] leading-tight font-bold tracking-[-0.02em] text-gh-ink lg:text-[1.5rem]">More to explore</h3>
        <p className="hidden text-sm text-gh-ink/60 sm:block">Sealed brands, Cash on Delivery</p>
      </div>
      <ul
        aria-label="Shop by department"
        className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:h-[23rem] lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {departments.map((d, i) => (
          <Panel key={d.key} department={d} on={open === i} desktop={desktop} tick={tick} onOpen={() => setOpen(i)} />
        ))}
      </ul>
    </div>
  );
}

export default DepartmentExplorer;
