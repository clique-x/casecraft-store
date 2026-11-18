'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Plus } from 'lucide-react';
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

/**
 * One size hint for every picture of a range, so the round frame and the big picture share a download. On a
 * card the square is 160 to 290 px; 180 px asks a phone for the 480 px file, which is all that size needs.
 */
const SIZES = '(min-width: 80rem) 368px, 180px';
/** How often the pictures move on (ms). A panel changes on every second beat, and its neighbours on the beats between. */
const BEAT_MS = 2400;
/**
 * How many closed panels' worth of the row the open panel takes; the same number as in its class, xl:grow-[5.6].
 * It leaves the open panel room for its text and its picture side by side from 1280px up.
 */
const OPEN_GROW = 5.6;
/** The gap between panels in rem; the same as the list's gap-3. */
const GAP_REM = 0.75;
/** The studio set's own teal, so photos shot on it sit in the panel without an edge. */
const SURFACE = 'bg-[radial-gradient(130%_120%_at_70%_25%,#0b5364_0%,#06323c_46%,#021a20_100%)]';

interface PanelProps {
  department: ExploreDepartment;
  index: number;
  on: boolean;
  /** The row layout (xl and up), where a closed panel is a single button. */
  row: boolean;
  beat: number;
  onOpen: () => void;
}

function Panel({ department, index, on, row, beat, onOpen }: PanelProps) {
  const { ranges } = department;
  // The range under the pointer or with focus holds its picture; otherwise the ranges take turns. Counting in
  // twos, offset by the panel's place, keeps the row from changing all at once.
  const [held, setHeld] = useState<number | null>(null);
  const first = Math.floor(index / 2);
  const turn = Math.floor((beat + index) / 2);
  const shown = held ?? turn % ranges.length;
  // A range's photo is in the page from the turn before its own (so it is ready), and stays once shown. Before
  // that it is not rendered, so a department with four ranges costs two downloads up front, not four.
  const reached = (k: number) => k === held || turn + 1 - first >= ranges.length - 1 || (((k - first) % ranges.length) + ranges.length) % ranges.length <= turn + 1 - first;
  const fromInr = Math.min(...ranges.map((r) => r.fromInr));
  // In the row a closed panel is a single button; its links must not take focus from behind it.
  const closed = row && !on;

  return (
    <li
      data-open={on}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onOpen()}
      onPointerLeave={() => setHeld(null)}
      className={cn(
        'group/panel relative isolate flex w-[88%] shrink-0 snap-start flex-col overflow-hidden rounded-[1.25rem] text-white shadow-[0_18px_40px_-28px_rgba(0,22,25,.6)] max-xl:[container-type:inline-size] min-[360px]:w-[80%] sm:w-[44%] lg:w-[30%]',
        // The row: the panels share it, and the open one takes most of it. --win is the big picture's window.
        'xl:w-auto xl:min-w-0 xl:shrink xl:basis-0 xl:transition-[flex-grow] xl:duration-[550ms] xl:ease-out-expo xl:[--win:19rem] min-[90rem]:[--win:23rem] motion-reduce:xl:transition-none',
        on ? 'xl:grow-[5.6]' : 'xl:grow',
        SURFACE,
      )}
    >
      {/*
        The big picture: a square that always shows the whole photo, so no product is cut off.

        On cards its box takes the height the text leaves, so a department with one range shows its product
        larger than one with four; the square is as tall as that box, but never wider than the card (the card
        is a size container below xl, and 100cqw its width). A studio photo is faded at its sides and foot,
        where its own backdrop would otherwise end in an edge against the card.

        In the row the square is as tall as the panel, in a window at the panel's right edge that fades in from
        its left. It shows only while the panel is open (a closed panel is too narrow for it and would show a
        strip) and keeps its size as the panel opens.
      */}
      <div className="relative min-h-40 flex-1 overflow-hidden xl:absolute xl:inset-y-0 xl:right-0 xl:w-(--win) xl:opacity-0 xl:transition-opacity xl:duration-500 xl:[mask-image:linear-gradient(to_right,transparent,black_2.75rem)] xl:group-data-[open=true]/panel:opacity-100">
        <div className="absolute top-0 left-1/2 aspect-square h-full max-h-[100cqw] -translate-x-1/2 xl:max-h-none">
          {ranges.map((r, k) =>
            reached(k) ? (
              // eslint-disable-next-line @next/next/no-img-element -- pre-sized static variants, no optimizer
              <img
                key={r.label}
                src={r.image}
                srcSet={r.imageSet}
                sizes={SIZES}
                alt={k === shown ? r.alt : ''}
                loading="lazy"
                decoding="async"
                draggable={false}
                className={cn(
                  'absolute inset-0 size-full transition-opacity duration-700 ease-out',
                  r.cutout
                    ? 'object-contain p-[13%] drop-shadow-[0_18px_22px_rgba(0,0,0,.5)] xl:p-[20%]'
                    : 'object-cover [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent),linear-gradient(to_bottom,black_72%,transparent)] xl:[mask-image:none]',
                  k === shown ? 'opacity-100' : 'opacity-0',
                )}
              />
            ) : null,
          )}
        </div>
      </div>
      {/*
        The row, closed: the panel is one button that opens it, with the whole product in a round frame, the
        department and its lowest price. Its face is exactly as wide as a closed panel (--bar) and anchored left,
        so the frame is the same size and in the same place in every panel, and stays put while one opens.
      */}
      <button
        type="button"
        aria-expanded={on}
        tabIndex={on ? -1 : 0}
        onClick={onOpen}
        onFocus={onOpen}
        className={cn(
          'absolute inset-0 z-20 hidden cursor-pointer bg-gradient-to-t from-black/35 to-transparent to-55% outline-none transition-opacity duration-300 focus-visible:ring-2 focus-visible:ring-gh-mint focus-visible:ring-inset xl:block',
          on ? 'pointer-events-none opacity-0' : 'opacity-100 delay-150',
        )}
      >
        <span className="flex h-full w-(--bar) flex-col items-center pt-[4.25rem] pb-4 text-center">
          <span className="relative block aspect-square w-[76%] shrink-0 overflow-hidden rounded-full bg-[radial-gradient(closest-side,#10707f_0%,#07404c_100%)] shadow-[0_16px_32px_-14px_rgba(0,0,0,.75)] ring-1 ring-white/20 transition-shadow duration-300 group-hover/panel:ring-white/45">
            {ranges.map((r, k) =>
              reached(k) ? (
                // eslint-disable-next-line @next/next/no-img-element -- pre-sized static variants, no optimizer
                <img
                  key={r.label}
                  src={r.image}
                  srcSet={r.imageSet}
                  // The big picture's size hint, so the two share one download.
                  sizes={SIZES}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className={cn(
                    'absolute inset-0 size-full transition-opacity duration-700 ease-out',
                    r.cutout ? 'object-contain p-[15%]' : 'scale-[1.16] object-cover',
                    k === shown ? 'opacity-100' : 'opacity-0',
                  )}
                />
              ) : null,
            )}
          </span>
          <span className="mt-4 block px-2 text-[0.875rem] leading-tight font-bold text-balance min-[90rem]:text-[0.9375rem]">{department.name}</span>
          <span className="mt-1 block px-2 text-caption text-white/65 tabular-nums">from {formatInr(fromInr)}</span>
          <span aria-hidden="true" className="mt-auto grid size-7 place-items-center rounded-full border border-white/25 text-white/70 transition-colors duration-300 group-hover/panel:border-white/60 group-hover/panel:text-white">
            <Plus className="size-3.5" strokeWidth={2} />
          </span>
        </span>
      </button>

      {/* The department and its ranges. A fixed width in the row, so the text never re-wraps as the panel moves. */}
      <div
        inert={closed}
        className={cn(
          'relative z-10 flex shrink-0 flex-col px-4 pt-1 pb-4 xl:absolute xl:inset-y-0 xl:left-0 xl:w-[18.5rem] xl:p-6 xl:transition-opacity xl:duration-300 min-[90rem]:w-[19.5rem]',
          on ? 'xl:opacity-100 xl:delay-200' : 'xl:opacity-0',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-xl leading-tight font-bold tracking-[-0.02em] xl:text-[1.625rem]">{department.name}</h4>
          <Link
            href={department.href}
            aria-label={`All ${department.name.toLowerCase()}`}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-white/40 outline-none transition-colors hover:border-white hover:bg-white hover:text-gh-teal focus-visible:ring-2 focus-visible:ring-gh-mint xl:size-10"
          >
            <ArrowUpRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>
        <p className="mt-1 text-[0.8125rem] leading-snug text-white/70 xl:mt-2">{department.blurb}</p>

        <ul className="mt-3 xl:mt-auto">
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
                  {/* For the pointer, in the row; on cards it would only take room from the label. */}
                  <ArrowRight className="hidden size-3.5 -translate-x-1 opacity-0 transition-[opacity,transform] duration-200 group-hover/row:translate-x-0 group-hover/row:opacity-100 group-focus-visible/row:translate-x-0 group-focus-visible/row:opacity-100 xl:block" aria-hidden="true" />
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
 * "More to explore": every other department as a panel. From xl up the panels stand in one row: the one under
 * the pointer is open and lists its ranges, each a link with its lowest price, and the others show their product
 * whole in a round frame. Below xl they are cards to swipe through, all open. The pictures change to each range
 * in turn, and in an open panel to a range as the pointer reaches it.
 *
 * Opening a panel animates only flex-grow; the text, the big picture and the round frames keep their size and
 * place throughout, so the row moves without re-wrapping or rescaling anything.
 */
export function DepartmentExplorer({ departments }: { departments: ExploreDepartment[] }) {
  const root = useRef<HTMLDivElement>(null);
  const row = useMediaQuery('(min-width: 1280px)');
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(0);
  const [beat, setBeat] = useState(0);
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
    const timer = window.setInterval(() => setBeat((t) => t + 1), BEAT_MS);
    return () => window.clearInterval(timer);
  }, [reduced, inView]);

  if (departments.length === 0) return null;
  const n = departments.length;
  // A closed panel's width in the row: the list's width less the gaps, shared between the closed panels and the
  // open one. The list is a size container (xl), so 100cqw is its width wherever --bar is used inside it.
  const bar = `calc((100cqw - ${(n - 1) * GAP_REM}rem) / ${n - 1 + OPEN_GROW})`;
  return (
    <div ref={root} className="mt-8 lg:mt-10">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-[1.25rem] leading-tight font-bold tracking-[-0.02em] text-gh-ink lg:text-[1.5rem]">More to explore</h3>
        <p className="hidden text-sm text-gh-ink/60 sm:block">Sealed brands, Cash on Delivery</p>
      </div>
      <ul
        aria-label="Shop by department"
        style={{ '--bar': bar } as CSSProperties}
        className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-10 lg:scroll-px-10 lg:px-10 xl:mx-0 xl:h-[23rem] xl:overflow-visible xl:px-0 xl:pb-0 xl:[container-type:inline-size] [&::-webkit-scrollbar]:hidden"
      >
        {departments.map((d, i) => (
          <Panel key={d.key} department={d} index={i} on={open === i} row={row} beat={beat} onOpen={() => setOpen(i)} />
        ))}
      </ul>
    </div>
  );
}

export default DepartmentExplorer;
