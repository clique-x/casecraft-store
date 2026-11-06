import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SHELL } from './hub/hub-styles';

/** A square campaign image in public/promo (built by scripts/promo-art), and where it leads. */
export interface Promo {
  name: string;
  href: string;
  /** The words on the image, so screen readers and the link's name carry the same offer. */
  alt: string;
  /** A wide version with the same offer, shown across the page from lg (desktops) instead of the square. */
  wide?: { name: string; width: number; height: number };
}

export const PROMOS = {
  audio: {
    name: 'audio-sealed',
    href: '/audio',
    alt: 'Sound that ships sealed. Earbuds from ₹799: 100% original in a sealed box, 1-year brand warranty, Cash on Delivery.',
  },
  covers: {
    name: 'covers-character',
    href: '/covers',
    alt: 'Cases with character, from ₹250. Cut for your exact phone.',
  },
  combo: {
    name: 'combo-protection',
    href: '/accessories',
    alt: 'Total protection combo, save ₹150: case, screen glass, camera lens protector and back film for ₹1,296 instead of ₹1,446. Cut for your exact phone, Cash on Delivery.',
    wide: { name: 'combo-protection-wide', width: 2000, height: 667 },
  },
} satisfies Record<string, Promo>;

const WIDE_WIDTHS = [1200, 2000] as const;

const WIDTHS = [600, 1200] as const;

/**
 * Campaign images between home sections. Two of them sit side by side from sm; on phones they swipe one
 * at a time with the next peeking in (like the combo cards), so a pair costs one image's height. A single
 * banner with a wide version shows that across the content width from lg, and the square below lg. Images
 * load lazily: they are never above the fold.
 */
export function PromoBanners({ promos, className }: { promos: readonly Promo[]; className?: string }) {
  const pair = promos.length > 1;
  const wide = !pair && promos.some((p) => p.wide);
  return (
    <div className={className}>
      <div className={SHELL}>
        <ul
          aria-label="Offers"
          className={cn(
            pair
              ? '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-px-4 px-4 pb-1 [scrollbar-width:none] sm:mx-auto sm:grid sm:max-w-5xl sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden'
              : cn('mx-auto max-w-[34rem]', wide && 'lg:max-w-none'),
          )}
        >
          {promos.map((p) => {
            const art = pair ? undefined : p.wide;
            const square = (
              // eslint-disable-next-line @next/next/no-img-element -- pre-sized static variants, no optimizer
              <img
                src={`/promo/${p.name}-${WIDTHS[0]}.webp`}
                srcSet={WIDTHS.map((w) => `/promo/${p.name}-${w}.webp ${w}w`).join(', ')}
                sizes={pair ? '(min-width: 64rem) 502px, (min-width: 40rem) calc(50vw - 2.5rem), 86vw' : '(min-width: 36rem) 544px, calc(100vw - 2rem)'}
                width={1200}
                height={1200}
                alt={p.alt}
                loading="lazy"
                decoding="async"
                draggable={false}
                className={cn(
                  'block aspect-square h-auto w-full object-cover transition-transform duration-700 ease-out-expo group-hover/promo:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover/promo:transform-none',
                  // The wide images are 3:1 (2000 x 667); the box follows them from lg.
                  art && 'lg:aspect-[3/1]',
                )}
              />
            );
            return (
              <li key={p.name} className={pair ? 'w-[86%] shrink-0 snap-start sm:w-auto' : undefined}>
                <Link
                  href={p.href}
                  className="group/promo block overflow-hidden rounded-[1.25rem] shadow-[0_18px_40px_-28px_rgba(0,22,25,.55)] transition-shadow duration-(--dur-ui) hover:shadow-[0_28px_56px_-28px_rgba(0,22,25,.6)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-brand"
                >
                  {art ? (
                    <picture>
                      <source
                        media="(min-width: 64rem)"
                        srcSet={WIDE_WIDTHS.map((w) => `/promo/${art.name}-${w}.webp ${w}w`).join(', ')}
                        sizes="(min-width: 80rem) 1216px, calc(100vw - 4rem)"
                        width={art.width}
                        height={art.height}
                      />
                      {square}
                    </picture>
                  ) : (
                    square
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default PromoBanners;
