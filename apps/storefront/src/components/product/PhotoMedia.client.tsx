'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { ChevronLeft, ChevronRight, Expand, XIcon } from 'lucide-react';
import { PhotoStage } from '@/components/product/viewer/PhotoStage.client';
import { gallerySrc, gallerySrcSet, photoAlt, photoSrc, type PhotoEntry } from '@/lib/catalog/photos';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { cn } from '@/lib/utils';

interface PhotoMediaProps {
  entry: PhotoEntry;
  /** Product title for accessible names. */
  title: string;
}

const COLUMN_SIZES = '(min-width: 80rem) 640px, (min-width: 64rem) 50vw, 100vw';
const THUMB_SIZES = '72px';

/**
 * Every image of a photographed cover in the left column of the product page.
 * Desktop: a sticky thumbnail strip beside a column of large images (the tilt stage first, then the
 * gallery in the owner's order) that scrolls with the page; the strip follows the scroll and jumps
 * to any image. Phones: a full-bleed swipe carousel with a counter and progress bar. Any image opens
 * a full-screen viewer that swipes, and answers the arrow keys.
 */
export function PhotoMedia({ entry, title }: PhotoMediaProps) {
  const labels = entry.gallery ?? [];
  const alt = photoAlt(entry);
  const reduced = useReducedMotion();
  const [viewer, setViewer] = useState<number | null>(null);

  return (
    <>
      <DesktopColumn entry={entry} title={title} labels={labels} alt={alt} reduced={reduced} onOpen={setViewer} />
      <PhoneCarousel entry={entry} labels={labels} alt={alt} onOpen={setViewer} />
      <Viewer
        entry={entry}
        labels={labels}
        alt={alt}
        title={title}
        index={viewer}
        reduced={reduced}
        onClose={() => setViewer(null)}
      />
    </>
  );
}

interface PartProps {
  entry: PhotoEntry;
  labels: string[];
  alt: string;
  onOpen: (n: number) => void;
}

// --- desktop -----------------------------------------------------------------------------------

function DesktopColumn({
  entry,
  title,
  labels,
  alt,
  reduced,
  onOpen,
}: PartProps & { title: string; reduced: boolean }) {
  const columnRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // The image crossing the middle band of the viewport is the active one.
  useEffect(() => {
    const column = columnRef.current;
    if (!column) return;
    const items = [...column.querySelectorAll<HTMLElement>('[data-media]')];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.media));
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [labels.length]);

  const jump = (i: number) => {
    columnRef.current?.querySelector<HTMLElement>(`[data-media="${i}"]`)?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="hidden lg:grid lg:grid-cols-[4.5rem_minmax(0,1fr)] lg:gap-4">
      <nav aria-label="Photos" className="sticky top-24 self-start">
        <ul className="flex max-h-[calc(100svh-7rem)] flex-col gap-2 overflow-y-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <li>
            <ThumbButton active={active === 0} label="Turn the cover" onClick={() => jump(0)}>
              {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer */}
              <img
                src={photoSrc(entry.id, 320)}
                alt=""
                width={entry.imageW}
                height={entry.imageH}
                decoding="async"
                className="size-full object-contain p-1.5"
              />
            </ThumbButton>
          </li>
          {labels.map((label, n) => (
            <li key={n}>
              <ThumbButton active={active === n + 1} label={label} onClick={() => jump(n + 1)}>
                {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer */}
                <img
                  src={gallerySrc(entry.id, n, 480)}
                  alt=""
                  sizes={THUMB_SIZES}
                  width={480}
                  height={480}
                  decoding="async"
                  loading="lazy"
                  className="size-full object-cover"
                />
              </ThumbButton>
            </li>
          ))}
        </ul>
      </nav>

      <div ref={columnRef} className="flex min-w-0 flex-col gap-4">
        <div data-media={0} className="scroll-mt-24">
          <PhotoStage entry={entry} title={title} className="lg:aspect-square" />
        </div>
        {labels.map((label, n) => (
          <figure key={n} data-media={n + 1} className="scroll-mt-24">
            <MediaButton label={label} onClick={() => onOpen(n)} className="rounded-card">
              {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer */}
              <img
                src={gallerySrc(entry.id, n)}
                srcSet={gallerySrcSet(entry.id, n)}
                sizes={COLUMN_SIZES}
                width={960}
                height={960}
                alt={`${alt}: ${label}`}
                decoding="async"
                loading="lazy"
                className="size-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out-expo motion-safe:group-hover/media:scale-[1.04]"
              />
            </MediaButton>
          </figure>
        ))}
      </div>
    </div>
  );
}

function ThumbButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'block aspect-square w-full overflow-hidden rounded-xl bg-ink-2 outline-none transition-[box-shadow,opacity,transform] duration-300 ease-out-expo focus-visible:ring-3 focus-visible:ring-accent-2',
        active ? 'opacity-100 ring-2 ring-fg' : 'opacity-60 ring-1 ring-fg/10 hover:opacity-100 hover:-translate-y-0.5',
      )}
    >
      {children}
    </button>
  );
}

/** A square image that opens the full-screen viewer; the label rides on the corner. */
function MediaButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${label} full screen`}
      className={cn(
        'group/media relative block aspect-square w-full cursor-zoom-in overflow-hidden bg-ink-2 outline-none focus-visible:ring-3 focus-visible:ring-accent-2 focus-visible:ring-inset',
        className,
      )}
    >
      {children}
      <span className="pointer-events-none absolute bottom-3 left-3 rounded-pill bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
        {label}
      </span>
      <span className="pointer-events-none absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover/media:opacity-100 group-focus-visible/media:opacity-100">
        <Expand className="size-4" aria-hidden="true" />
      </span>
    </button>
  );
}

// --- phones --------------------------------------------------------------------------------------

/**
 * Which slide of a snap-scrolling row is in view. It binds through a callback ref, so a row that
 * mounts a render later (the viewer's, inside a portal) is tracked too.
 */
function useSnapIndex(count: number) {
  const [el, setEl] = useState<HTMLUListElement | null>(null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const w = el.clientWidth || 1;
        setIndex(Math.max(0, Math.min(count - 1, Math.round(el.scrollLeft / w))));
      });
    };
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [el, count]);
  return { el, setEl, index };
}

function PhoneCarousel({ entry, labels, alt, onOpen }: PartProps) {
  const { setEl, index } = useSnapIndex(labels.length);
  const count = labels.length;

  return (
    <div className="-mx-4 sm:-mx-6 lg:hidden">
      <div className="relative">
        <ul
          ref={setEl}
          aria-label="Photos"
          className="flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {labels.map((label, n) => (
            <li
              key={n}
              aria-roledescription="slide"
              aria-label={`${n + 1} of ${count}: ${label}`}
              className="w-full shrink-0 snap-center snap-always"
            >
              <MediaButton label={label} onClick={() => onOpen(n)}>
                {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer */}
                <img
                  src={gallerySrc(entry.id, n)}
                  srcSet={gallerySrcSet(entry.id, n)}
                  sizes="100vw"
                  width={960}
                  height={960}
                  alt={`${alt}: ${label}`}
                  decoding="async"
                  loading={n === 0 ? 'eager' : 'lazy'}
                  fetchPriority={n === 0 ? 'high' : 'auto'}
                  className="size-full object-cover"
                />
              </MediaButton>
            </li>
          ))}
        </ul>
        <span
          aria-live="polite"
          className="pointer-events-none absolute top-3 right-3 rounded-pill bg-black/45 px-2.5 py-1 text-xs font-semibold text-white tabular-nums backdrop-blur-sm"
        >
          {index + 1} / {count}
        </span>
      </div>
      <div aria-hidden="true" className="mx-4 mt-3 flex gap-1 sm:mx-6">
        {labels.map((_, n) => (
          <span
            key={n}
            className={cn('h-1 flex-1 rounded-pill transition-colors duration-300', n === index ? 'bg-fg' : 'bg-fg/15')}
          />
        ))}
      </div>
    </div>
  );
}

// --- full-screen viewer --------------------------------------------------------------------------

function Viewer({
  entry,
  labels,
  alt,
  title,
  index,
  reduced,
  onClose,
}: Omit<PartProps, 'onOpen'> & {
  title: string;
  index: number | null;
  reduced: boolean;
  onClose: () => void;
}) {
  const open = index !== null;
  const count = labels.length;
  const { el, setEl, index: current } = useSnapIndex(count);
  const start = index ?? 0;

  // The row mounts a render after the dialog opens; land it on the tapped image before the first paint.
  const placeRow = useCallback(
    (node: HTMLUListElement | null) => {
      if (node) node.scrollLeft = start * node.clientWidth;
      setEl(node);
    },
    [start, setEl],
  );

  const show = (n: number) => {
    if (!el) return;
    const next = Math.max(0, Math.min(count - 1, n));
    el.scrollTo({ left: next * el.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
  };
  const go = (dir: number) => show(current + dir);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          onKeyDown={onKeyDown}
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col text-white outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.98] data-closed:animate-out data-closed:fade-out-0"
        >
          <DialogPrimitive.Title className="sr-only">Photos of {title}</DialogPrimitive.Title>
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <p className="text-sm font-medium tabular-nums" aria-live="polite">
              {current + 1} / {count}
              <span className="ml-3 text-white/60">{labels[current]}</span>
            </p>
            <DialogPrimitive.Close
              aria-label="Close"
              className="grid size-11 place-items-center rounded-full bg-white/10 transition-colors outline-none hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
            >
              <XIcon className="size-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <div className="relative min-h-0 flex-1">
            <ul
              ref={placeRow}
              className="flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {labels.map((label, n) => (
                <li
                  key={n}
                  className="grid h-full w-full shrink-0 snap-center snap-always place-items-center px-2 sm:px-16"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer */}
                  <img
                    src={gallerySrc(entry.id, n, 1440)}
                    srcSet={gallerySrcSet(entry.id, n)}
                    sizes="(min-width: 64rem) 85svh, 100vw"
                    width={1440}
                    height={1440}
                    alt={`${alt}: ${label}`}
                    decoding="async"
                    loading={Math.abs(n - start) <= 1 ? 'eager' : 'lazy'}
                    className="max-h-full w-auto max-w-full rounded-card object-contain"
                  />
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={current === 0}
              aria-label="Previous photo"
              className="absolute top-1/2 left-3 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 transition-colors outline-none hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-30 sm:grid"
            >
              <ChevronLeft className="size-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={current === count - 1}
              aria-label="Next photo"
              className="absolute top-1/2 right-3 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 transition-colors outline-none hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-30 sm:grid"
            >
              <ChevronRight className="size-6" aria-hidden="true" />
            </button>
          </div>

          <div className="flex justify-center gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
            {labels.map((label, n) => (
              <button
                key={n}
                type="button"
                onClick={() => show(n)}
                aria-label={label}
                aria-current={n === current ? 'true' : undefined}
                className={cn(
                  'size-14 shrink-0 overflow-hidden rounded-lg outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-white',
                  n === current ? 'opacity-100 ring-2 ring-white' : 'opacity-50 hover:opacity-90',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer */}
                <img
                  src={gallerySrc(entry.id, n, 480)}
                  alt=""
                  width={480}
                  height={480}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
