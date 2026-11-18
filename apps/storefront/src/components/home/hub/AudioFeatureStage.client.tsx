'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, m } from 'motion/react';
import { ArrowUpRightIcon } from 'lucide-react';
import { formatInr } from '@/lib/catalog/photos';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { cn } from '@/lib/utils';

export interface FeatureItem {
  id: string;
  handle: string;
  title: string;
  priceInr: number;
  src: string;
  srcSet: string;
  /** A transparent cutout (it gets a soft shadow); otherwise a photo on the light backdrop. */
  cut: boolean;
}

interface Props {
  items: FeatureItem[];
  className?: string;
}

/** How long each product stays, in seconds. The segment under it fills over the same time. */
const TURN_S = 4.5;
/** A horizontal drag longer than this (px) is a swipe to the next or previous product. */
const SWIPE_PX = 40;

/**
 * The audio spotlight's featured product, taking turns: each one fades up into place while the last drifts out,
 * and the segment at the bottom fills as its turn runs. The turn is the segment's own CSS animation, so it pauses
 * with it: under the pointer, while a control has focus, and while the panel is off screen. Reduced motion shows
 * one product at a time with no timer; the segments and a swipe still change it.
 */
export function AudioFeatureStage({ items, className }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [turn, setTurn] = useState({ index: 0, prev: -1 });
  const [held, setHeld] = useState(false);
  const [inView, setInView] = useState(false);
  const drag = useRef<{ x: number; swiped: boolean } | null>(null);

  const count = items.length;
  const index = turn.index % count;
  const current = items[index];
  const go = (to: number) => setTurn((t) => ({ index: ((to % count) + count) % count, prev: t.index % count }));

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = count > 1 && !reduced && inView && !held;

  return (
    <div
      ref={root}
      className={cn('group/feat relative isolate touch-pan-y overflow-hidden bg-[radial-gradient(85%_70%_at_50%_42%,#ffffff_0%,var(--color-surface-2)_72%)]', className)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      // Keyboard focus holds the turn; a tap on a segment does not, so it keeps going on phones.
      onFocus={(e) => e.target.matches(':focus-visible') && setHeld(true)}
      onBlur={() => setHeld(false)}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, swiped: false };
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        if (!d || count < 2) return;
        const dx = e.clientX - d.x;
        if (Math.abs(dx) > SWIPE_PX) {
          d.swiped = true;
          go(index + (dx < 0 ? 1 : -1));
        }
      }}
      // A swipe that ends on the link must not open it.
      onClickCapture={(e) => {
        if (drag.current?.swiped) {
          e.preventDefault();
          e.stopPropagation();
        }
        drag.current = null;
      }}
    >
      <Link href={`/products/${current.handle}`} draggable={false} aria-label={`${current.title}, ${formatInr(current.priceInr)}`} className="absolute inset-0 z-10 outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand" />

      {/* Every product is in place from the start, so a change never waits on a download. */}
      <div aria-hidden="true" className="feature-drift absolute inset-x-6 top-5 bottom-[4.25rem] sm:inset-x-12 sm:top-10 sm:bottom-24">
        {items.map((item, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants
          <img
            key={item.id}
            src={item.src}
            srcSet={item.srcSet}
            sizes="(min-width: 1024px) 480px, 80vw"
            alt=""
            loading="lazy"
            draggable={false}
            className={cn(
              'absolute inset-0 size-full object-contain transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] select-none',
              item.cut && 'drop-shadow-[0_26px_24px_rgb(27_26_23/0.16)]',
              i === index && 'scale-100 opacity-100',
              i !== index && i === turn.prev && 'scale-[1.05] opacity-0',
              i !== index && i !== turn.prev && 'scale-[0.93] opacity-0 transition-none',
            )}
          />
        ))}
      </div>

      <span className="pointer-events-none absolute top-3.5 left-3.5 z-20 rounded-pill bg-fg px-3 py-1 text-caption font-bold text-paper sm:top-4 sm:left-4">Featured</span>

      {/* On phones the bottom right corner stays clear: the chat button floats there when the panel fills the screen. */}
      <div className="pointer-events-none absolute right-[5.25rem] bottom-3 left-3.5 z-20 flex flex-col gap-2 sm:inset-x-5 sm:bottom-5 sm:gap-3">
        <div aria-hidden="true" className="flex items-center justify-between gap-3">
          <AnimatePresence mode="wait" initial={false}>
            <m.p
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-w-0 items-baseline gap-2 text-fg"
            >
              <span className="truncate text-[0.9375rem] font-bold sm:text-lg">{current.title}</span>
              <span className="shrink-0 text-sm font-semibold text-fg-muted tabular-nums sm:text-base">{formatInr(current.priceInr)}</span>
            </m.p>
          </AnimatePresence>
          <span className="hidden size-9 shrink-0 place-items-center rounded-full bg-fg text-paper transition-transform duration-300 ease-out-expo group-hover/feat:translate-x-0.5 group-hover/feat:-translate-y-0.5 sm:grid">
            <ArrowUpRightIcon className="size-4" />
          </span>
        </div>

        {count > 1 && (
          <div role="group" aria-label="Featured product" className="pointer-events-auto flex items-center gap-1.5">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                aria-label={item.title}
                aria-current={i === index}
                onClick={() => go(i)}
                className="group/seg -my-2 flex-1 py-2 outline-none"
              >
                <span className="relative block h-[3px] overflow-hidden rounded-full bg-fg/15 transition-colors group-hover/seg:bg-fg/30 group-focus-visible/seg:bg-brand/50">
                  {i === index &&
                    (reduced ? (
                      <span className="absolute inset-0 rounded-full bg-fg" />
                    ) : (
                      <span
                        key={turn.index}
                        className="feature-timer absolute inset-0 rounded-full bg-fg"
                        style={{ animationDuration: `${TURN_S}s`, animationPlayState: running ? 'running' : 'paused' }}
                        onAnimationEnd={() => go(index + 1)}
                      />
                    ))}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AudioFeatureStage;
