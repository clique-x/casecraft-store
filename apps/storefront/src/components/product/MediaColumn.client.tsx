'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { BadgeCheck, ChevronLeft, ChevronRight, Expand, XIcon } from 'lucide-react';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { useVariantSelection } from '@/lib/product/variant-store';
import { cn } from '@/lib/utils';

/** One square gallery image, as plain data so a server page can hand it over. */
export interface MediaImage {
  label: string;
  alt: string;
  /** Thumbnail strip. */
  src160: string;
  src480: string;
  src960: string;
  src1440: string;
  srcSet: string;
}

/** An image the browser should fetch first at one breakpoint (the first thing that paints there). */
export interface MediaPreload {
  src: string;
  srcSet?: string;
  sizes?: string;
}

/** The interactive first view (the tilt stage, or a colour-aware product stage) ahead of the gallery. */
export interface MediaLead {
  node: ReactNode;
  label: string;
  thumbSrc: string;
  /** The thumbnail is a cutout to fit whole rather than a photo to crop. */
  thumbContain?: boolean;
  /** Also the first slide on phones. Off for stages that answer sideways drags, which would fight the swipe. */
  onPhones?: boolean;
  /** Desktop's first paint when the lead is there. */
  preload?: MediaPreload;
}

interface MediaColumnProps {
  /** Product title for accessible names. */
  title: string;
  images: MediaImage[];
  lead?: MediaLead;
  /** Corner badge on the first image, e.g. "Original boAt". */
  badge?: string;
  /**
   * Gallery index per option slug (a gadget's colours). Picking an option in the buy box brings its
   * image into view: the desktop column scrolls to it, the phone carousel slides to it.
   */
  optionIndex?: Readonly<Record<string, number>>;
}

/** A request to bring gallery image `index` into view; `seq` makes repeat requests distinct. */
interface Focus {
  index: number;
  seq: number;
}

const COLUMN_SIZES = '(min-width: 80rem) 640px, (min-width: 64rem) 50vw, 100vw';
// Phones show the carousel edge to edge, but 82vw keeps a 3x screen on the 960 px file (a third the
// bytes of 1440) with no visible softening at that size.
const PHONE_SIZES = '82vw';
const DESKTOP = '(min-width: 64rem)';
const PHONE = '(max-width: 63.98rem)';

/**
 * Every image of a product in the left column of the product page.
 * Desktop: a sticky thumbnail strip beside a column of large images (the lead first, then the
 * gallery in the owner's order) that scrolls with the page; the strip follows the scroll and jumps
 * to any image. Phones: a full-bleed swipe carousel with a counter and progress bar. Any gallery
 * image opens a full-screen viewer that swipes and answers the arrow keys.
 *
 * Both layouts are in the HTML; each preloads only its own first image (by media query) and the rest
 * load lazily, so a phone never downloads the desktop column's images and the other way round.
 */
export function MediaColumn({ title, images, lead, badge, optionIndex }: MediaColumnProps) {
  const reduced = useReducedMotion();
  const [viewer, setViewer] = useState<number | null>(null);
  const focus = useOptionFocus(optionIndex);
  const phoneLead = lead?.onPhones ? lead : undefined;
  const phoneFirst: MediaPreload | undefined = phoneLead
    ? phoneLead.preload
    : images[0] && { src: images[0].src960, srcSet: images[0].srcSet, sizes: PHONE_SIZES };
  const desktopFirst: MediaPreload | undefined = lead
    ? lead.preload
    : images[0] && { src: images[0].src960, srcSet: images[0].srcSet, sizes: COLUMN_SIZES };

  return (
    <>
      {desktopFirst && <Preload media={DESKTOP} image={desktopFirst} />}
      {phoneFirst && <Preload media={PHONE} image={phoneFirst} />}
      <DesktopColumn
        images={images}
        lead={lead}
        badge={badge}
        focus={focus}
        reduced={reduced}
        onOpen={setViewer}
      />
      <PhoneCarousel images={images} lead={phoneLead} badge={badge} focus={focus} reduced={reduced} onOpen={setViewer} />
      <Viewer images={images} title={title} index={viewer} reduced={reduced} onClose={() => setViewer(null)} />
    </>
  );
}

/** Follows the option picked in the buy box; the option the page opens with is not a request. */
function useOptionFocus(optionIndex: MediaColumnProps['optionIndex']): Focus | null {
  const { modelSlug } = useVariantSelection();
  const target = optionIndex && modelSlug ? optionIndex[modelSlug] : undefined;
  const [focus, setFocus] = useState<Focus | null>(null);
  const [seen, setSeen] = useState(target);
  // Adjust state on change during render, the same way PhotoStage resets on a new entry.
  if (seen !== target) {
    setSeen(target);
    if (target !== undefined && seen !== undefined) setFocus((f) => ({ index: target, seq: (f?.seq ?? 0) + 1 }));
  }
  return focus;
}

/** Corner badge on the first image. */
function Badge({ text }: { text: string }) {
  return (
    <span className="pointer-events-none absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-pill bg-paper/90 px-3 py-1 text-caption font-bold text-fg backdrop-blur">
      <BadgeCheck className="size-4 text-brand" aria-hidden="true" />
      {text}
    </span>
  );
}

/** React hoists this into <head>, so the first image starts downloading before the page's scripts run. */
function Preload({ media, image }: { media: string; image: MediaPreload }) {
  return (
    <link
      rel="preload"
      as="image"
      href={image.src}
      imageSrcSet={image.srcSet}
      imageSizes={image.sizes}
      media={media}
      fetchPriority="high"
    />
  );
}

interface PartProps {
  images: MediaImage[];
  onOpen: (n: number) => void;
}

// --- desktop -----------------------------------------------------------------------------------

function DesktopColumn({
  images,
  lead,
  badge,
  focus,
  reduced,
  onOpen,
}: PartProps & { lead?: MediaLead; badge?: string; focus: Focus | null; reduced: boolean }) {
  const columnRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const offset = lead ? 1 : 0;

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
  }, [images.length, offset]);

  const jump = useCallback(
    (i: number) => {
      columnRef.current
        ?.querySelector<HTMLElement>(`[data-media="${i}"]`)
        ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    },
    [reduced],
  );

  // A colour picked in the buy box: bring its image up, when this column is the one on screen.
  useEffect(() => {
    if (!focus || !columnRef.current?.offsetParent) return;
    jump(focus.index + offset);
  }, [focus, offset, jump]);

  return (
    <div className="hidden lg:grid lg:grid-cols-[4.5rem_minmax(0,1fr)] lg:gap-4">
      <nav aria-label="Photos" className="sticky top-24 self-start">
        <ul className="flex max-h-[calc(100svh-7rem)] flex-col gap-2 overflow-y-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {lead && (
            <li>
              <ThumbButton active={active === 0} label={lead.label} onClick={() => jump(0)}>
                {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer */}
                <img
                  src={lead.thumbSrc}
                  alt=""
                  width={160}
                  height={160}
                  decoding="async"
                  loading="lazy"
                  className={cn('size-full', lead.thumbContain ? 'object-contain p-1.5' : 'object-cover')}
                />
              </ThumbButton>
            </li>
          )}
          {images.map((img, n) => (
            <li key={n}>
              <ThumbButton active={active === n + offset} label={img.label} onClick={() => jump(n + offset)}>
                {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer */}
                <img
                  src={img.src160}
                  alt=""
                  width={160}
                  height={160}
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
        {lead && (
          <div data-media={0} className="scroll-mt-24">
            {lead.node}
          </div>
        )}
        {images.map((img, n) => (
          <figure key={n} data-media={n + offset} className="scroll-mt-24">
            <MediaButton label={img.label} onClick={() => onOpen(n)} className="rounded-card">
              {n === 0 && !lead && badge && <Badge text={badge} />}
              {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer */}
              <img
                src={img.src960}
                srcSet={img.srcSet}
                sizes={COLUMN_SIZES}
                width={960}
                height={960}
                alt={img.alt}
                decoding="async"
                loading="lazy"
                fetchPriority="low"
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
        active ? 'opacity-100 ring-2 ring-fg' : 'opacity-60 ring-1 ring-fg/10 hover:-translate-y-0.5 hover:opacity-100',
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

function PhoneCarousel({
  images,
  lead,
  badge,
  focus,
  reduced,
  onOpen,
}: PartProps & { lead?: MediaLead; badge?: string; focus: Focus | null; reduced: boolean }) {
  const offset = lead ? 1 : 0;
  const count = images.length + offset;
  const { el, setEl, index } = useSnapIndex(count);

  // A colour picked in the buy box: slide to its image without moving the page.
  useEffect(() => {
    if (!focus || !el?.offsetParent) return;
    el.scrollTo({ left: (focus.index + offset) * el.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
  }, [focus, offset, el, reduced]);

  return (
    <div className="-mx-4 sm:-mx-6 lg:hidden">
      <div className="relative">
        <ul
          ref={setEl}
          aria-label="Photos"
          className="flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {lead && (
            <li
              aria-roledescription="slide"
              aria-label={`1 of ${count}: ${lead.label}`}
              className="w-full shrink-0 snap-center snap-always"
            >
              {lead.node}
            </li>
          )}
          {images.map((img, n) => (
            <li
              key={n}
              aria-roledescription="slide"
              aria-label={`${n + offset + 1} of ${count}: ${img.label}`}
              className="w-full shrink-0 snap-center snap-always"
            >
              <MediaButton label={img.label} onClick={() => onOpen(n)}>
                {n === 0 && !lead && badge && <Badge text={badge} />}
                {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer */}
                <img
                  src={img.src960}
                  srcSet={img.srcSet}
                  sizes={PHONE_SIZES}
                  width={960}
                  height={960}
                  alt={img.alt}
                  decoding="async"
                  // Lazy even for the first slide: on desktop this carousel is hidden and must not download.
                  // Phones get the first image from the head preload, so it still paints first; the slides
                  // beside it wait behind it.
                  loading="lazy"
                  fetchPriority={n === 0 && !lead ? 'high' : 'low'}
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
        {Array.from({ length: count }, (_, n) => (
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
  images,
  title,
  index,
  reduced,
  onClose,
}: {
  images: MediaImage[];
  title: string;
  index: number | null;
  reduced: boolean;
  onClose: () => void;
}) {
  const open = index !== null;
  const count = images.length;
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
              <span className="ml-3 text-white/60">{images[current]?.label}</span>
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
              {images.map((img, n) => (
                <li
                  key={n}
                  className="grid h-full w-full shrink-0 snap-center snap-always place-items-center px-2 sm:px-16"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer */}
                  <img
                    src={img.src1440}
                    srcSet={img.srcSet}
                    sizes="(min-width: 64rem) 85svh, 100vw"
                    width={1440}
                    height={1440}
                    alt={img.alt}
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
            {images.map((img, n) => (
              <button
                key={n}
                type="button"
                onClick={() => show(n)}
                aria-label={img.label}
                aria-current={n === current ? 'true' : undefined}
                className={cn(
                  'size-14 shrink-0 overflow-hidden rounded-lg outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-white',
                  n === current ? 'opacity-100 ring-2 ring-white' : 'opacity-50 hover:opacity-90',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer */}
                <img src={img.src160} alt="" width={160} height={160} loading="lazy" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
