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
 * One campaign image between home sections: the square, or from lg its wide version across the content
 * width when it has one. Lazy-loaded; it is never above the fold. The audio and covers pair has its own
 * stage (promo-stage/PromoStage.client.tsx).
 */
export function PromoBanner({ promo: p, className }: { promo: Promo; className?: string }) {
  const art = p.wide;
  const square = (
    // eslint-disable-next-line @next/next/no-img-element -- pre-sized static variants, no optimizer
    <img
      src={`/promo/${p.name}-${WIDTHS[0]}.webp`}
      srcSet={WIDTHS.map((w) => `/promo/${p.name}-${w}.webp ${w}w`).join(', ')}
      sizes="(min-width: 36rem) 544px, calc(100vw - 2rem)"
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
    <div className={className}>
      <div className={SHELL}>
        <Link
          href={p.href}
          className={cn(
            'group/promo mx-auto block max-w-[34rem] overflow-hidden rounded-[1.25rem] shadow-[0_18px_40px_-28px_rgba(0,22,25,.55)] transition-shadow duration-(--dur-ui) hover:shadow-[0_28px_56px_-28px_rgba(0,22,25,.6)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-brand',
            art && 'lg:max-w-none',
          )}
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
      </div>
    </div>
  );
}

export default PromoBanner;
