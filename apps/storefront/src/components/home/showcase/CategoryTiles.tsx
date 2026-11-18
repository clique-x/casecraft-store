import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { DEPARTMENT_OF, GADGETS, gadgetCutSrc, gadgetCutSrcSet } from '@/lib/catalog/gadgets';
import { cn } from '@/lib/utils';
import { CoverTileArt, ProtectionTileArt, TileRotator, type TileArtItem } from './TileArt.client';

interface TileImage {
  src: string;
  srcSet: string;
  sizes: string;
  w: number;
  h: number;
  /** Placement inside the art box (right half of the tile, or its lower part on tablets). */
  className: string;
}

interface Tile {
  title: [string, string];
  href: string;
  tone: 'dark' | 'light';
  /** Backdrop of the tile. */
  surface: string;
  /** The products, taking turns in the art box. */
  art: ReactNode;
  /** A stand under cutout products; studio photos bring their own. */
  plinth?: TileImage;
}

const set = (base: string, widths: readonly number[]) => widths.map((w) => `${base}-${w}.webp ${w}w`).join(', ');
const PLINTH_SIZES = '(min-width: 64rem) 300px, (min-width: 48rem) 260px, 60vw';

/**
 * Covers and guards are shown as their studio photos. Every one was shot on the same teal set, so the photo is
 * laid over the right of the tile and faded into it on the left (below lg on tablets: from the top), and when
 * the photo changes only the product appears to.
 */
const STUDIO_FRAME =
  'inset-0 [mask-image:linear-gradient(to_right,transparent_2%,black_46%)] transition-transform duration-700 ease-out-expo group-hover/tile:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/tile:transform-none md:max-lg:[mask-image:linear-gradient(to_bottom,transparent_0%,black_34%)]';
// The art is about 55vw wide on a phone; 40vw asks for the 480 px file, which is still over 2x there.
const STUDIO_SIZES = '(min-width: 64rem) 380px, (min-width: 48rem) 34vw, 40vw';
const STUDIO_LABEL = 'bg-black/40 text-white/90 backdrop-blur-sm';
/** The studio set's own teal, so the photo's edge has nothing to show against. */
const STUDIO_SURFACE = 'bg-[radial-gradient(120%_130%_at_82%_30%,#0a4f60_0%,#06323c_44%,#021a20_100%)]';

/** The audio products with a transparent cutout: they stand on the tile's stone plinth in turn. */
const AUDIO_ART: TileArtItem[] = GADGETS.flatMap((g) =>
  DEPARTMENT_OF[g.type] === 'audio' && g.photos?.cut
    ? [{ key: g.id, src: gadgetCutSrc(g.photos, 480), srcSet: gadgetCutSrcSet(g.photos), alt: g.title, label: g.title }]
    : [],
).slice(0, 6);

const TILES: readonly Tile[] = [
  {
    title: ['Cases with', 'character'],
    href: '/covers',
    tone: 'dark',
    surface: STUDIO_SURFACE,
    art: <CoverTileArt sizes={STUDIO_SIZES} className={STUDIO_FRAME} imgClassName="object-cover object-[50%_20%]" labelClassName={STUDIO_LABEL} />,
  },
  {
    title: ['Sound that', 'moves you'],
    href: '/audio',
    tone: 'light',
    surface: 'bg-[radial-gradient(110%_120%_at_78%_30%,#f4f3ee_0%,#d9dcd4_48%,#b4bbb2_100%)]',
    art: (
      <TileRotator
        items={AUDIO_ART}
        sizes="(min-width: 64rem) 240px, (min-width: 48rem) 200px, 42vw"
        offsetMs={1250}
        className="inset-x-[12%] top-[9%] bottom-[17%] transition-transform duration-700 ease-out-expo group-hover/tile:-translate-y-1.5 group-hover/tile:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover/tile:transform-none"
        imgClassName="object-contain object-bottom drop-shadow-[0_18px_20px_rgba(0,12,14,.32)]"
        labelClassName="bg-white/70 text-gh-ink backdrop-blur-sm"
      />
    ),
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
    surface: STUDIO_SURFACE,
    art: <ProtectionTileArt sizes={STUDIO_SIZES} offsetMs={2500} className={STUDIO_FRAME} imgClassName="object-cover object-[50%_32%]" labelClassName={STUDIO_LABEL} />,
  },
];

function Art({ image, className, alt = '' }: { image: TileImage; className?: string; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-sized static variants, no optimizer
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={image.sizes}
      width={image.w}
      height={image.h}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={cn('absolute max-w-none', image.className, className)}
    />
  );
}

/**
 * "Find your next favourite.": three editorial tiles into the departments, each showing its products in turn,
 * then the `rail` of every other range.
 */
export function CategoryTiles({ rail }: { rail?: ReactNode }) {
  return (
    <section aria-labelledby="favourites-heading" className="bg-gh-ivory pt-10 pb-10 text-gh-ink lg:pt-12 lg:pb-20">
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
                    {tile.art}
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
