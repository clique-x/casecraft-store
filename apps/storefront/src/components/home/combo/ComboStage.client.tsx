'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { ComboQuickLook, type QuickLookItem, type QuickLookSide } from '@/components/home/combo/ComboQuickLook.client';
import { formatInr } from '@/lib/catalog/photos';
import { useMediaQuery } from '@/lib/device/use-media-query';
import { cn } from '@/lib/utils';

export interface StageCard {
  /** Stable per piece ("cover", "glass", …), so a card keeps its place while others come and go. */
  key: string;
  label: string;
  src: string;
  srcSet?: string;
  /** What the closer look shows for this piece. */
  quick: QuickLookItem;
}

interface Props {
  /** The cover first, then the add-ons that are switched on. */
  cards: StageCard[];
  /** Changes when the cover does, so its photo cross-fades. */
  coverKey: string;
  savingInr: number;
  /** "4 pieces for iPhone 16 Pro" */
  caption: string;
  /** Names the group of cards for assistive technology. */
  label: string;
  className?: string;
}

/** Centre of each card in cover widths: the cover at 0, add-ons stepping right and overlapping a little. */
const FIRST_STEP = 0.79;
const STEP = 0.56;
/** Add-on cards are this fraction of the cover's width. */
const ADDON = 0.74;
const TILT = [-4, 5, -2, 7] as const;
const LIFT = [0, 5, -4, 7] as const;
const SPRING = { type: 'spring', stiffness: 260, damping: 26, mass: 0.9 } as const;

/**
 * The closer look opens when the pointer rests on a card this long (ms), so crossing the stage on the way to the
 * switches does not set it off. Between cards it changes sooner, and it waits a moment before closing so the
 * pointer can travel from the card onto it.
 */
const OPEN_MS = 150;
const SWITCH_MS = 70;
const CLOSE_MS = 170;
/** Room the pop-over needs above or below a card: its height and the gap. With less, it opens to the side. */
const ROOM_PX = 312;
/** The same along the row, for opening to the side. */
const SIDE_ROOM_PX = 520;
/** Kept clear at the top of the screen: the sticky header. */
const HEADER_PX = 78;

/** Where card `i` of `count` sits, as a percentage of its own width, with the whole spread centred. */
function slotX(i: number, count: number): string {
  const centre = (k: number) => (k === 0 ? 0 : FIRST_STEP + (k - 1) * STEP);
  const right = count > 1 ? centre(count - 1) + ADDON / 2 : 0.5;
  const mid = (right - 0.5) / 2;
  const own = i === 0 ? 1 : ADDON;
  return `${(((centre(i) - mid) / own) * 100).toFixed(1)}%`;
}

/** Above or below the card when either has room (the pop-over picks between the two itself), else beside it. */
function sideFor(card: HTMLElement | null): QuickLookSide {
  if (!card) return 'top';
  const r = card.getBoundingClientRect();
  if (r.top - HEADER_PX >= ROOM_PX || window.innerHeight - r.bottom >= ROOM_PX) return 'top';
  return window.innerWidth - r.right >= SIDE_ROOM_PX ? 'right' : 'left';
}

const isCard = (target: EventTarget | null) => target instanceof Element && target.closest('[data-combo-card]') !== null;

/**
 * The combo as a hand of cards on the teal stage: the chosen cover in front, each add-on sliding in beside it
 * when switched on and dropping away when switched off. Sizes follow the stage's own width (container units),
 * so the spread fits a phone and a desktop column alike.
 *
 * Each card is also a button for a closer look at that piece: resting the pointer on it or clicking it opens a
 * pop-over beside the card, and a tap on a phone opens a sheet. A click pins the pop-over until it is closed;
 * opened by the pointer alone, it follows the pointer from card to card and closes when it leaves.
 */
export function ComboStage({ cards, coverKey, savingInr, caption, label, className }: Props) {
  const wide = useMediaQuery('(min-width: 640px)');
  const root = useRef<HTMLDivElement>(null);
  const [look, setLook] = useState<{ key: string; pinned: boolean; side: QuickLookSide; card: HTMLElement | null; inset: number } | null>(null);
  const anchors = useRef(new Map<string, HTMLButtonElement>());
  const timer = useRef<number | undefined>(undefined);

  const cancel = () => window.clearTimeout(timer.current);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  /** The look for a card, measured as it opens: which card to point at and on which side there is room. */
  const lookAt = (key: string, pinned: boolean) => {
    const card = anchors.current.get(key) ?? null;
    return { key, pinned, side: sideFor(card), card, inset: root.current?.getBoundingClientRect().left ?? 0 };
  };
  const rest = (key: string) => {
    cancel();
    if (look?.pinned) return;
    timer.current = window.setTimeout(() => setLook(lookAt(key, false)), look ? SWITCH_MS : OPEN_MS);
  };
  const leave = () => {
    cancel();
    timer.current = window.setTimeout(() => setLook((l) => (l?.pinned ? l : null)), CLOSE_MS);
  };
  const press = (key: string) => {
    cancel();
    setLook((l) => (l?.key === key && l.pinned ? null : lookAt(key, true)));
  };
  const close = () => {
    cancel();
    setLook(null);
  };

  // A piece that was switched off while open has nothing left to show.
  const open = look ? (cards.find((c) => c.key === look.key) ?? null) : null;

  return (
    <div
      ref={root}
      role="group"
      aria-label={label}
      className={cn(
        '@container relative isolate flex flex-col overflow-hidden bg-[radial-gradient(120%_95%_at_50%_38%,#10606c_0%,#07363e_46%,#021a1e_100%)] text-white',
        className,
      )}
    >
      {/* A soft light behind the cards. */}
      <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[78cqw] max-h-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(166_240_220/0.16),transparent)]" />

      <div className="flex items-center justify-between gap-3 px-4 pt-3 lg:px-6 lg:pt-5">
        <p className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-[0.625rem] font-bold tracking-[0.18em] text-gh-mint uppercase lg:text-label">Your combo</span>
          <span className="hidden truncate text-[0.6875rem] text-white/55 min-[360px]:inline lg:text-caption">
            <span className="pointer-coarse:hidden">Hover a card to look closer</span>
            <span className="hidden pointer-coarse:inline">Tap a card to look closer</span>
          </span>
        </p>
        <AnimatePresence initial={false} mode="wait">
          {savingInr > 0 && (
            <m.span
              key={savingInr}
              initial={{ opacity: 0, scale: 0.8, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 rounded-full bg-brand-coral px-2.5 py-1 text-[0.6875rem] leading-none font-bold text-fg tabular-nums lg:text-xs"
            >
              Save {formatInr(savingInr)}
            </m.span>
          )}
        </AnimatePresence>
      </div>

      <div className="grid flex-1 place-items-center px-3 pt-2 pb-4.5 [--cw:min(24cqw,7rem)] sm:py-6 lg:py-8 lg:[--cw:min(31cqw,11rem)]">
        <AnimatePresence initial={false}>
          {cards.map((card, i) => (
            <m.button
              key={card.key}
              type="button"
              data-combo-card=""
              ref={(el) => {
                if (el) anchors.current.set(card.key, el);
                else anchors.current.delete(card.key);
              }}
              aria-haspopup="dialog"
              aria-expanded={open?.key === card.key}
              aria-label={`${card.quick.kind}: ${card.quick.title}. Look closer`}
              onPointerEnter={(e) => e.pointerType === 'mouse' && wide && rest(card.key)}
              onPointerLeave={(e) => e.pointerType === 'mouse' && leave()}
              onClick={() => press(card.key)}
              style={{ zIndex: 10 - i }}
              initial={{ opacity: 0, scale: 0.6, x: slotX(i, cards.length), y: '40%', rotate: 0 }}
              animate={{ opacity: 1, scale: 1, x: slotX(i, cards.length), y: `${LIFT[i] ?? 0}%`, rotate: TILT[i] ?? 0 }}
              exit={{ opacity: 0, scale: 0.6, y: '40%', transition: { duration: 0.22, ease: 'easeIn' } }}
              // Growing in place keeps the pointer inside the card; a lift would slide the edge out from under it.
              whileHover={{ scale: 1.045 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING}
              className={cn(
                'group/card relative cursor-zoom-in rounded-[0.7rem] outline-none [grid-area:1/1] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gh-mint lg:rounded-2xl',
                i === 0 ? 'w-(--cw)' : 'w-[calc(var(--cw)*0.74)]',
              )}
            >
              <span
                className={cn(
                  'relative block aspect-[4/5] overflow-hidden rounded-[0.7rem] bg-gh-teal shadow-[0_18px_36px_-14px_rgb(0_0_0/0.75)] ring-1 transition-shadow duration-300 lg:rounded-2xl',
                  open?.key === card.key ? 'ring-2 ring-gh-mint' : 'ring-white/20 group-hover/card:ring-white/55',
                )}
              >
                <AnimatePresence initial={false}>
                  <m.img
                    key={i === 0 ? coverKey : card.key}
                    src={card.src}
                    srcSet={card.srcSet}
                    sizes="(min-width: 1024px) 184px, 27vw"
                    alt=""
                    loading="lazy"
                    draggable={false}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0 size-full object-cover"
                  />
                </AnimatePresence>
              </span>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-paper px-2 py-[3px] text-[0.5625rem] leading-none font-bold whitespace-nowrap text-fg shadow-sm lg:-bottom-2.5 lg:px-2.5 lg:py-1 lg:text-[0.6875rem]">
                {card.label}
              </span>
            </m.button>
          ))}
        </AnimatePresence>
      </div>

      <p className="hidden px-4 pb-4 text-center text-caption text-white/70 sm:block lg:px-6 lg:pb-5">{caption}</p>

      <ComboQuickLook
        item={open?.quick ?? null}
        anchor={open ? (look?.card ?? null) : null}
        mode={wide ? 'popover' : 'sheet'}
        side={look?.side ?? 'top'}
        inset={look?.inset ?? 0}
        pinned={look?.pinned ?? false}
        onClose={close}
        onHoverChange={(inside) => (inside ? cancel() : leave())}
        isOwnTrigger={isCard}
      />
    </div>
  );
}

export default ComboStage;
