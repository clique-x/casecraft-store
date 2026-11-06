'use client';

import Link from 'next/link';
import type { CSSProperties, PointerEvent } from 'react';
import { ArrowRightIcon } from 'lucide-react';
import { PROMOS, type Promo } from '../PromoBanners';
import { SHELL } from '../hub/hub-styles';
import './promo-stage.css';

const CARDS: readonly { promo: Promo; cta: string }[] = [
  { promo: PROMOS.audio, cta: 'Shop audio' },
  { promo: PROMOS.covers, cta: 'Explore covers' },
];

const WIDTHS = [600, 1200] as const;
/** Most a card turns under the mouse, in degrees. */
const TILT_X = 8;
const TILT_Y = 10;

/** Mouse only: touch scrolls the row, and the CSS turns the cards there. */
function tilt(e: PointerEvent<HTMLAnchorElement>) {
  if (e.pointerType !== 'mouse') return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.setProperty('--p3-rx', `${((0.5 - y) * TILT_X * 2).toFixed(2)}deg`);
  el.style.setProperty('--p3-ry', `${((x - 0.5) * TILT_Y * 2).toFixed(2)}deg`);
  el.style.setProperty('--p3-mx', `${(x * 100).toFixed(1)}%`);
  el.style.setProperty('--p3-my', `${(y * 100).toFixed(1)}%`);
  el.dataset.tilting = '';
}

function settle(e: PointerEvent<HTMLAnchorElement>) {
  const el = e.currentTarget;
  for (const prop of ['--p3-rx', '--p3-ry', '--p3-mx', '--p3-my']) el.style.removeProperty(prop);
  delete el.dataset.tilting;
}

/**
 * The audio and covers campaign cards on a dark stage, each with its own button. Desktop: side by side,
 * angled toward each other, tilting under the mouse. Phones: a centred swipe row whose cards turn as they
 * move. Images load lazily; this sits well below the fold.
 */
export function PromoStage() {
  return (
    <section aria-label="Offers" className="relative isolate overflow-hidden py-12 sm:py-16 lg:py-20">
      <div aria-hidden="true" className="p3-glow" />
      <div className={SHELL}>
        <ul className="-mx-4 flex snap-x snap-mandatory gap-[4vw] overflow-x-auto overflow-y-hidden overscroll-x-contain px-[14vw] pt-4 pb-2 [scrollbar-width:none] sm:mx-auto sm:grid sm:max-w-5xl sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:px-0 sm:pt-0 sm:pb-8 lg:gap-12 [&::-webkit-scrollbar]:hidden">
          {CARDS.map(({ promo, cta }, i) => (
            <li key={promo.name} className="p3-item relative w-[72vw] shrink-0 snap-center pb-[4.25rem] sm:w-auto sm:pb-0">
              <span aria-hidden="true" className="p3-floor" />
              <Link
                href={promo.href}
                onPointerMove={tilt}
                onPointerLeave={settle}
                style={{ '--p3-side': i === 0 ? 1 : -1 } as CSSProperties}
                className="p3-card group/p3 relative block rounded-[1.5rem] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-gh-mint"
              >
                <span className="p3-frame relative block overflow-hidden rounded-[1.5rem]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static variants, no optimizer */}
                  <img
                    src={`/promo/${promo.name}-${WIDTHS[0]}.webp`}
                    srcSet={WIDTHS.map((w) => `/promo/${promo.name}-${w}.webp ${w}w`).join(', ')}
                    sizes="(min-width: 64rem) 486px, (min-width: 40rem) calc(50vw - 3rem), 72vw"
                    width={1200}
                    height={1200}
                    alt={promo.alt}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="block aspect-square h-auto w-full"
                  />
                  <span aria-hidden="true" className="p3-sheen" />
                </span>
                <span className="p3-cta absolute bottom-0 left-1/2 inline-flex h-12 items-center gap-2 rounded-pill bg-gh-mint px-6 text-sm font-bold whitespace-nowrap text-gh-night shadow-[0_14px_30px_-10px_rgb(0_0_0/0.6)] group-hover/p3:bg-white">
                  {cta}
                  <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover/p3:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default PromoStage;
