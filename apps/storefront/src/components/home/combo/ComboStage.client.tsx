'use client';

import { AnimatePresence, m } from 'motion/react';
import { formatInr } from '@/lib/catalog/photos';
import { cn } from '@/lib/utils';

export interface StageCard {
  /** Stable per piece ("cover", "glass", …), so a card keeps its place while others come and go. */
  key: string;
  label: string;
  src: string;
  srcSet?: string;
}

interface Props {
  /** The cover first, then the add-ons that are switched on. */
  cards: StageCard[];
  /** Changes when the cover does, so its photo cross-fades. */
  coverKey: string;
  savingInr: number;
  /** "4 pieces for iPhone 16 Pro" */
  caption: string;
  /** Read out in place of the pictures. */
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

/** Where card `i` of `count` sits, as a percentage of its own width, with the whole spread centred. */
function slotX(i: number, count: number): string {
  const centre = (k: number) => (k === 0 ? 0 : FIRST_STEP + (k - 1) * STEP);
  const right = count > 1 ? centre(count - 1) + ADDON / 2 : 0.5;
  const mid = (right - 0.5) / 2;
  const own = i === 0 ? 1 : ADDON;
  return `${(((centre(i) - mid) / own) * 100).toFixed(1)}%`;
}

/**
 * The combo as a hand of cards on the teal stage: the chosen cover in front, each add-on sliding in beside it
 * when switched on and dropping away when switched off. Sizes follow the stage's own width (container units),
 * so the spread fits a phone and a desktop column alike.
 */
export function ComboStage({ cards, coverKey, savingInr, caption, label, className }: Props) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        '@container relative isolate flex flex-col overflow-hidden bg-[radial-gradient(120%_95%_at_50%_38%,#10606c_0%,#07363e_46%,#021a1e_100%)] text-white',
        className,
      )}
    >
      {/* A soft light behind the cards, and a floor line they sit on. */}
      <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[78cqw] max-h-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(166_240_220/0.16),transparent)]" />

      <div className="flex items-center justify-between gap-3 px-4 pt-3 lg:px-6 lg:pt-5">
        <span className="text-[0.625rem] font-bold tracking-[0.18em] text-gh-mint uppercase lg:text-label">Your combo</span>
        <AnimatePresence initial={false} mode="wait">
          {savingInr > 0 && (
            <m.span
              key={savingInr}
              initial={{ opacity: 0, scale: 0.8, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="rounded-full bg-brand-coral px-2.5 py-1 text-[0.6875rem] leading-none font-bold text-fg tabular-nums lg:text-xs"
            >
              Save {formatInr(savingInr)}
            </m.span>
          )}
        </AnimatePresence>
      </div>

      <div className="grid flex-1 place-items-center px-3 pt-2 pb-4.5 [--cw:min(24cqw,7rem)] sm:py-6 lg:py-8 lg:[--cw:min(31cqw,11rem)]">
        <AnimatePresence initial={false}>
          {cards.map((card, i) => (
            <m.div
              key={card.key}
              style={{ zIndex: 10 - i }}
              initial={{ opacity: 0, scale: 0.6, x: slotX(i, cards.length), y: '40%', rotate: 0 }}
              animate={{ opacity: 1, scale: 1, x: slotX(i, cards.length), y: `${LIFT[i] ?? 0}%`, rotate: TILT[i] ?? 0 }}
              exit={{ opacity: 0, scale: 0.6, y: '40%', transition: { duration: 0.22, ease: 'easeIn' } }}
              transition={SPRING}
              className={cn('relative [grid-area:1/1]', i === 0 ? 'w-(--cw)' : 'w-[calc(var(--cw)*0.74)]')}
            >
              <span className="relative block aspect-[4/5] overflow-hidden rounded-[0.7rem] bg-gh-teal shadow-[0_18px_36px_-14px_rgb(0_0_0/0.75)] ring-1 ring-white/20 lg:rounded-2xl">
                <AnimatePresence initial={false}>
                  <m.img
                    key={i === 0 ? coverKey : card.key}
                    src={card.src}
                    srcSet={card.srcSet}
                    sizes="(min-width: 1024px) 184px, 27vw"
                    alt=""
                    loading="lazy"
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
            </m.div>
          ))}
        </AnimatePresence>
      </div>

      <p className="hidden px-4 pb-4 text-center text-caption text-white/70 sm:block lg:px-6 lg:pb-5">{caption}</p>
    </div>
  );
}

export default ComboStage;
