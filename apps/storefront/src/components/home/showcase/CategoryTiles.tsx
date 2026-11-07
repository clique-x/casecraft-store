import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TileImage {
  src: string;
  srcSet: string;
  sizes: string;
  w: number;
  h: number;
  /** Placement inside the art box (right half of the tile, or its lower part on tablets). Height-sized art needs w-auto. */
  className: string;
}

interface Tile {
  title: [string, string];
  href: string;
  tone: 'dark' | 'light';
  /** Backdrop of the tile. */
  surface: string;
  product: TileImage;
  plinth?: TileImage;
}

const set = (base: string, widths: readonly number[]) => widths.map((w) => `${base}-${w}.webp ${w}w`).join(', ');
const PLINTH_SIZES = '(min-width: 64rem) 300px, (min-width: 48rem) 260px, 60vw';

const TILES: readonly Tile[] = [
  {
    title: ['Cases with', 'character'],
    href: '/covers',
    tone: 'dark',
    surface: 'bg-[radial-gradient(120%_130%_at_82%_20%,#11565a_0%,#06363b_42%,#021d20_100%)]',
    // CaseCraft SF Carbon on an iPhone 16 (photo 50129, "On the phone").
    product: {
      src: '/home/phone-sf-carbon-580.webp',
      srcSet: set('/home/phone-sf-carbon', [300, 580]),
      sizes: '(min-width: 64rem) 200px, (min-width: 48rem) 170px, 34vw',
      w: 580,
      h: 1082,
      className: 'left-[26%] top-[9%] h-[112%] w-auto rotate-[22deg] md:max-lg:left-[30%] md:max-lg:top-[2%] md:max-lg:h-[112%]',
    },
  },
  {
    title: ['Sound that', 'moves you'],
    href: '/audio',
    tone: 'light',
    surface: 'bg-[radial-gradient(110%_120%_at_78%_30%,#f4f3ee_0%,#d9dcd4_48%,#b4bbb2_100%)]',
    product: {
      // boAt Airdopes Prime 800 HiDef, the shop's own cutout.
      src: '/products/photos/gadgets/boat-800-hidef/cut-480.webp',
      srcSet: '/products/photos/gadgets/boat-800-hidef/cut-480.webp 480w, /products/photos/gadgets/boat-800-hidef/cut-960.webp 960w',
      sizes: '(min-width: 64rem) 260px, (min-width: 48rem) 220px, 46vw',
      w: 960,
      h: 933,
      className: 'left-1/2 bottom-[15%] w-[70%] -translate-x-1/2',
    },
    plinth: {
      src: '/home/plinth-stone-560.webp',
      srcSet: set('/home/plinth-stone', [560, 1000]),
      sizes: PLINTH_SIZES,
      w: 1000,
      h: 390,
      className: 'left-1/2 -bottom-[16%] w-[112%] -translate-x-1/2',
    },
  },
  {
    title: ['Protection', 'that fits'],
    href: '/accessories',
    tone: 'dark',
    surface: 'bg-[radial-gradient(120%_130%_at_80%_25%,#0f5156_0%,#05343a_45%,#021b1e_100%)]',
    product: {
      src: '/home/guard-320.webp',
      srcSet: set('/home/guard', [320, 640]),
      sizes: '(min-width: 64rem) 140px, (min-width: 48rem) 130px, 26vw',
      w: 640,
      h: 1195,
      className: 'left-1/2 bottom-[14%] h-[84%] w-auto -translate-x-1/2 rotate-[10deg]',
    },
    plinth: {
      src: '/home/plinth-560.webp',
      srcSet: set('/home/plinth', [560, 1000]),
      sizes: PLINTH_SIZES,
      w: 1000,
      h: 390,
      className: 'left-1/2 -bottom-[16%] w-[112%] -translate-x-1/2',
    },
  },
];

function Art({ image, className }: { image: TileImage; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-sized static variants, no optimizer
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={image.sizes}
      width={image.w}
      height={image.h}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      className={cn('absolute max-w-none', image.className, className)}
    />
  );
}

/** "Find your next favourite.": three editorial tiles into the departments, then the `rail` of every other range. */
export function CategoryTiles({ rail }: { rail?: ReactNode }) {
  return (
    <section aria-labelledby="favourites-heading" className="bg-gh-ivory pt-10 pb-14 text-gh-ink lg:pt-12 lg:pb-20">
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-10 xl:px-14">
        <h2 id="favourites-heading" className="text-[1.875rem] leading-tight font-extrabold tracking-[-0.04em] text-gh-ink lg:text-[2.5rem]">
          Find your next favourite.
        </h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3 lg:mt-8 lg:gap-5">
          {TILES.map((tile) => {
            const dark = tile.tone === 'dark';
            return (
              <li key={tile.href}>
                <Link
                  href={tile.href}
                  className={cn(
                    'group/tile relative isolate block aspect-[2.15/1] overflow-hidden rounded-[1.25rem] md:aspect-[4/5] lg:aspect-[2.08/1]',
                    'shadow-[0_18px_40px_-28px_rgba(0,22,25,.55)] transition-shadow duration-(--dur-ui) hover:shadow-[0_28px_56px_-28px_rgba(0,22,25,.6)]',
                    'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-brand',
                    tile.surface,
                    dark ? 'text-white' : 'text-gh-ink',
                  )}
                >
                  {/* Art: the right part of the tile, or its lower part on tablets. */}
                  <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 w-[56%] md:max-lg:inset-x-0 md:max-lg:top-[34%] md:max-lg:w-auto">
                    {tile.plinth && <Art image={tile.plinth} />}
                    <div className="absolute inset-0 transition-transform duration-700 ease-out-expo group-hover/tile:-translate-y-1.5 group-hover/tile:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover/tile:transform-none">
                      <Art image={tile.product} className="drop-shadow-[0_22px_26px_rgba(0,12,14,.45)]" />
                    </div>
                  </div>

                  <h3 className="absolute top-5 left-5 max-w-[60%] text-[1.5rem] leading-[1.1] font-bold tracking-[-0.03em] sm:top-6 sm:left-6 sm:text-[1.625rem] md:max-lg:max-w-[90%] lg:top-8 lg:left-8 lg:text-[1.75rem] xl:text-[2rem]">
                    {tile.title[0]}
                    <br />
                    {tile.title[1]}
                  </h3>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute bottom-5 left-5 grid size-11 place-items-center rounded-full border transition-colors duration-(--dur-ui) sm:bottom-6 sm:left-6 lg:bottom-7 lg:left-8',
                      dark
                        ? 'border-white/60 group-hover/tile:border-white group-hover/tile:bg-white group-hover/tile:text-gh-teal'
                        : 'border-gh-ink/45 group-hover/tile:border-gh-ink group-hover/tile:bg-gh-ink group-hover/tile:text-white',
                    )}
                  >
                    <ArrowRight className="size-5" strokeWidth={1.75} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {rail}
      </div>
    </section>
  );
}

export default CategoryTiles;
