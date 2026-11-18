'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Popover } from 'radix-ui';
import { ArrowRightIcon, CheckIcon, XIcon } from 'lucide-react';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { formatInr } from '@/lib/catalog/photos';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { cn } from '@/lib/utils';

export interface QuickLookImage {
  /** The picture at reading size, with its width variants. */
  src: string;
  srcSet?: string;
  /** A 160px copy for the thumbnail strip. */
  thumb: string;
  /** "In hand", "On the phone" */
  caption: string;
}

export interface QuickLookItem {
  /** The product, so a different cover in the same slot shows from its first picture. */
  id: string;
  /** "Cover", "Screen glass" */
  kind: string;
  title: string;
  href: string;
  priceInr: number;
  /** True when the price is the cheapest of several, before a phone is picked. */
  from?: boolean;
  /** An add-on's price on its own, struck through beside the price with a cover. */
  wasInr?: number;
  features: readonly string[];
  images: QuickLookImage[];
}

export type QuickLookSide = 'top' | 'right' | 'left';

interface Props {
  item: QuickLookItem | null;
  /** The stage card the pop-over points at. */
  anchor: HTMLElement | null;
  /** A pop-over beside the card (larger screens), or a sheet from the bottom (phones). */
  mode: 'popover' | 'sheet';
  side: QuickLookSide;
  /** How far in from the screen's left edge the pop-over must stay (px): the page's own margin. */
  inset: number;
  /** Opened by a click or the keyboard, not by the pointer resting on a card: focus may move into it. */
  pinned: boolean;
  onClose: () => void;
  /** The pointer moving onto the pop-over keeps it open; moving off lets it close. */
  onHoverChange: (inside: boolean) => void;
  /** True for clicks the stage handles itself (another card), so they do not also close the pop-over. */
  isOwnTrigger: (target: EventTarget | null) => boolean;
}

function Price({ item, className }: { item: QuickLookItem; className?: string }) {
  return (
    <p className={cn('flex items-baseline gap-2 tabular-nums', className)}>
      <span className="text-xl font-extrabold tracking-tight">
        {item.from && <span className="mr-1 text-caption font-semibold tracking-normal text-fg-muted">from</span>}
        {formatInr(item.priceInr)}
      </span>
      {item.wasInr !== undefined && item.wasInr > item.priceInr && (
        <>
          <s className="text-caption text-fg-muted">{formatInr(item.wasInr)}</s>
          <span className="text-caption font-semibold text-brand-coral">with a cover</span>
        </>
      )}
    </p>
  );
}

function Features({ features, className }: { features: readonly string[]; className?: string }) {
  return (
    <ul className={cn('flex flex-col gap-1.5', className)}>
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2 text-[0.8125rem] leading-snug text-fg">
          <span className="mt-px grid size-4 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
            <CheckIcon className="size-2.5" strokeWidth={3.5} aria-hidden="true" />
          </span>
          {f}
        </li>
      ))}
    </ul>
  );
}

function Thumbs({ images, active, onPick, onPeek, className }: { images: QuickLookImage[]; active: number; onPick: (i: number) => void; onPeek?: (i: number) => void; className?: string }) {
  if (images.length < 2) return null;
  return (
    <div role="group" aria-label="Photos" className={cn('flex gap-1.5', className)}>
      {images.map((img, i) => (
        <button
          key={img.thumb}
          type="button"
          aria-label={img.caption}
          aria-current={i === active}
          onClick={() => onPick(i)}
          onPointerEnter={onPeek ? (e) => e.pointerType === 'mouse' && onPeek(i) : undefined}
          className={cn(
            'relative aspect-square min-w-0 flex-1 overflow-hidden rounded-md bg-gh-teal outline-none transition-[box-shadow,opacity] duration-200 focus-visible:ring-2 focus-visible:ring-brand',
            i === active ? 'opacity-100 ring-2 ring-fg ring-offset-1 ring-offset-paper' : 'opacity-70 ring-1 ring-border hover:opacity-100',
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 160px catalogue thumbnail */}
          <img src={img.thumb} alt="" loading="lazy" draggable={false} className="size-full object-cover" />
        </button>
      ))}
    </div>
  );
}

/**
 * The picture for the pop-over. Every photo of the product is in place from the moment it opens, so choosing
 * one is a cross-fade with nothing to wait for; the frame is the studio's own teal while a photo loads.
 */
function FadeMedia({ images, active, className }: { images: QuickLookImage[]; active: number; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-gh-teal', className)}>
      {images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants
        <img
          key={img.src}
          src={img.src}
          srcSet={img.srcSet}
          sizes="216px"
          alt={i === active ? img.caption : ''}
          fetchPriority={i === 0 ? 'high' : 'low'}
          draggable={false}
          className={cn('absolute inset-0 size-full object-cover transition-opacity duration-300 ease-out', i === active ? 'opacity-100' : 'opacity-0')}
        />
      ))}
      <span className="absolute bottom-2 left-2 line-clamp-2 max-w-[calc(100%-1rem)] rounded-lg bg-black/55 px-2 py-0.5 text-[0.6875rem] leading-snug font-semibold text-white backdrop-blur-sm">{images[active]?.caption}</span>
      {images.length > 1 && (
        <span className="absolute top-2 right-2 rounded-full bg-black/55 px-1.5 py-0.5 text-[0.625rem] font-semibold text-white tabular-nums backdrop-blur-sm">
          {active + 1}/{images.length}
        </span>
      )}
    </div>
  );
}

/** The pop-over's contents: the picture and its thumbnails on the left, the product on the right. */
function PopoverBody({ item, onClose }: { item: QuickLookItem; onClose: () => void }) {
  const [active, setActive] = useState(0);
  return (
    <div className="flex animate-in gap-4 duration-200 fade-in-0">
      <div className="flex w-[13.5rem] shrink-0 flex-col gap-2">
        <FadeMedia images={item.images} active={active} className="aspect-square rounded-xl" />
        <Thumbs images={item.images} active={active} onPick={setActive} onPeek={setActive} className="[&>button]:max-w-12" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="pt-0.5 text-label font-bold tracking-[0.16em] text-brand uppercase">{item.kind}</p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-mt-1 -mr-1 grid size-7 shrink-0 place-items-center rounded-full text-fg-muted outline-none transition-colors hover:bg-surface-2 hover:text-fg focus-visible:ring-2 focus-visible:ring-brand"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-1 line-clamp-2 text-base leading-snug font-bold text-balance">{item.title}</p>
        <Price item={item} className="mt-1.5" />
        <Features features={item.features} className="mt-3" />
        <Link
          href={item.href}
          className="group/more mt-auto inline-flex h-9 items-center gap-1.5 self-start rounded-full bg-fg px-4 text-[0.8125rem] font-semibold text-paper outline-none transition-colors hover:bg-[#2b2b2b] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          Full details
          <ArrowRightIcon className="size-3.5 transition-transform duration-200 group-hover/more:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/** The sheet's contents: the photos to swipe through, then the product. */
function SheetBody({ item }: { item: QuickLookItem }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const frame = useRef(0);

  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = track.current;
      if (el) setActive(Math.round(el.scrollLeft / el.clientWidth));
    });
  };
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pt-3 pb-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-label font-bold tracking-[0.16em] text-brand uppercase">{item.kind}</p>
            <DrawerTitle className="mt-1 line-clamp-2 font-sans text-lg leading-snug font-bold text-fg">{item.title}</DrawerTitle>
            <DrawerDescription className="sr-only">Photos and features of this product.</DrawerDescription>
          </div>
          <DrawerClose aria-label="Close" className="-mr-1 grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-fg outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <XIcon className="size-4" aria-hidden="true" />
          </DrawerClose>
        </div>

        {/* Swiping here moves between photos; the sheet itself is dragged by its handle and header. */}
        <div className="relative mt-3">
          <div
            ref={track}
            data-vaul-no-drag
            onScroll={onScroll}
            className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl bg-gh-teal [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {item.images.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants
              <img
                key={img.src}
                src={img.src}
                srcSet={img.srcSet}
                sizes="(max-width: 640px) 100vw, 480px"
                alt={img.caption}
                loading={i === 0 ? 'eager' : 'lazy'}
                draggable={false}
                className="aspect-[5/4] w-full shrink-0 snap-center object-cover"
              />
            ))}
          </div>
          <span className="pointer-events-none absolute bottom-2 left-2 line-clamp-2 max-w-[calc(100%-1rem)] rounded-lg bg-black/55 px-2 py-0.5 text-[0.6875rem] leading-snug font-semibold text-white backdrop-blur-sm">{item.images[active]?.caption}</span>
          {item.images.length > 1 && (
            <span className="pointer-events-none absolute top-2 right-2 rounded-full bg-black/55 px-1.5 py-0.5 text-[0.625rem] font-semibold text-white tabular-nums backdrop-blur-sm">
              {active + 1}/{item.images.length}
            </span>
          )}
        </div>
        <Thumbs images={item.images} active={active} onPick={go} className="mt-2 [&>button]:max-w-12" />
        <Features features={item.features} className="mt-3" />
      </div>
      {/* Always in view, however short the screen: the price and the way to the product's page. */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-4 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
        <Price item={item} className="min-w-0 flex-wrap gap-x-2 gap-y-0" />
        <Link href={item.href} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-fg px-5 text-base font-semibold text-paper outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
          Full details <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}

/**
 * A closer look at one piece of the combo: a larger picture, every photo of the product, its three features and
 * its price. Larger screens get a pop-over that points at the card and follows the page; phones get a sheet from
 * the bottom with the photos to swipe through. Both are the same product data and close on Escape or a click
 * outside.
 */
export function ComboQuickLook({ item, anchor, mode, side, inset, pinned, onClose, onHoverChange, isOwnTrigger }: Props) {
  const reduced = useReducedMotion();
  const content = useRef<HTMLDivElement>(null);
  // A fresh object per card, so the pop-over re-measures as soon as the card changes.
  const anchorRef = useMemo(() => ({ current: anchor }), [anchor]);
  const lastId = useRef<string | null>(null);
  // Where focus goes back to on closing. By then the card and the pin are already cleared, so both are kept here.
  const opener = useRef<{ card: HTMLElement | null; pinned: boolean }>({ card: null, pinned: false });
  useEffect(() => {
    if (anchor) opener.current = { card: anchor, pinned };
  }, [anchor, pinned]);

  // Moving from one card to the next, the pop-over glides to its new place. The glide is switched on only for
  // that move: left on, it would trail behind the page while scrolling.
  useEffect(() => {
    const wrapper = content.current?.parentElement;
    const from = lastId.current;
    lastId.current = item?.id ?? null;
    if (!wrapper || !item || !from || from === item.id || reduced) return;
    wrapper.style.transition = 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)';
    const done = window.setTimeout(() => {
      wrapper.style.transition = '';
    }, 320);
    return () => {
      window.clearTimeout(done);
      wrapper.style.transition = '';
    };
  }, [item, reduced]);

  if (mode === 'sheet') {
    return (
      <Drawer open={item !== null} onOpenChange={(next) => !next && onClose()}>
        <DrawerContent className="max-h-[92svh]! rounded-t-3xl! border-border bg-paper text-fg">{item && <SheetBody key={item.id} item={item} />}</DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover.Root open={item !== null && anchor !== null} onOpenChange={(next) => !next && onClose()}>
      <Popover.Anchor virtualRef={anchorRef} />
      <Popover.Portal>
        <Popover.Content
          ref={content}
          side={side}
          align="center"
          sideOffset={14}
          collisionPadding={{ top: 78, right: 12, bottom: 12, left: Math.max(12, inset) }}
          aria-label={item ? `${item.kind}: ${item.title}` : undefined}
          onOpenAutoFocus={(e) => !pinned && e.preventDefault()}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (opener.current.pinned) opener.current.card?.focus({ preventScroll: true });
          }}
          onInteractOutside={(e) => isOwnTrigger(e.target) && e.preventDefault()}
          onPointerEnter={(e) => e.pointerType === 'mouse' && onHoverChange(true)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && onHoverChange(false)}
          className="z-50 w-[min(30.5rem,calc(100vw-1.5rem))] origin-(--radix-popover-content-transform-origin) rounded-[1.25rem] border border-border bg-paper p-3.5 text-fg shadow-[0_28px_70px_-24px_rgb(2_26_30/0.55),0_2px_8px_rgb(2_26_30/0.08)] outline-none duration-200 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {item && <PopoverBody key={item.id} item={item} onClose={onClose} />}
          <Popover.Arrow width={18} height={9} className="fill-paper drop-shadow-[0_1px_0_var(--color-border)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default ComboQuickLook;
