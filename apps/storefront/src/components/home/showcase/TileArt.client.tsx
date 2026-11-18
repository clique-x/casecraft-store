'use client';

import { useEffect, useRef, useState } from 'react';
import { ACCESSORIES, ACCESSORY_TYPE_LABEL, accessoryPhotoSrc, accessoryPhotoSrcSet } from '@/lib/catalog/accessories';
import { HERO_ORDER, PHOTOS, backdropThumbSrc, shotSrcSet, type PhotoEntry } from '@/lib/catalog/photos';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { useMyPhone } from '@/lib/phone/use-my-phone';
import { cn } from '@/lib/utils';

export interface TileArtItem {
  key: string;
  src: string;
  srcSet?: string;
  /** What the picture shows, for search engines and screen readers. */
  alt: string;
  /** The short name shown in the tile's corner while this product has its turn. */
  label: string;
}

interface RotatorProps {
  items: TileArtItem[];
  sizes: string;
  /** Added to the first turn (ms), so the three tiles change one after another instead of together. */
  offsetMs?: number;
  /** The frame the pictures share: where it sits in the art box, and any fade into the tile. */
  className?: string;
  /** Each picture's fit inside that frame. */
  imgClassName?: string;
  labelClassName?: string;
}

/** How long each product stays (ms). */
const TURN_MS = 3800;
/** A tile shows this many products at most before it starts over. */
const MAX_ITEMS = 8;
/** A phone's own products are shown once there are this many; with fewer, the tile keeps the general set. */
const MIN_FOR_PHONE = 2;

/**
 * One tile's product, taking turns: the next picture fades up over the last, and a small name in the corner
 * changes with it. Only the current picture and the next are in the page until the others have had a turn, so a
 * tile costs two downloads up front. The turn stops while the tile is off screen, and reduced motion keeps the
 * first product in place.
 */
export function TileRotator({ items, sizes, offsetMs = 0, className, imgClassName, labelClassName }: RotatorProps) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [turn, setTurn] = useState({ index: 0, prev: -1, reach: 0 });
  const [inView, setInView] = useState(false);
  const first = useRef(true);

  const count = items.length;
  const index = turn.index % count;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = count > 1 && !reduced && inView;
  useEffect(() => {
    if (!running) return;
    const wait = first.current ? TURN_MS + offsetMs : TURN_MS;
    first.current = false;
    const timer = window.setTimeout(() => {
      setTurn((t) => {
        const next = (t.index + 1) % count;
        return { index: next, prev: t.index, reach: Math.max(t.reach, next) };
      });
    }, wait);
    return () => window.clearTimeout(timer);
  }, [running, turn.index, count, offsetMs]);

  return (
    <div ref={root} className="absolute inset-0">
      <div className={cn('absolute', className)}>
        {items.map((item, i) =>
          // The current picture, every one already shown, and the next one so it is ready for its turn.
          i <= turn.reach + 1 ? (
            // eslint-disable-next-line @next/next/no-img-element -- pre-sized static variants, no optimizer
            <img
              key={item.key}
              src={item.src}
              srcSet={item.srcSet}
              sizes={sizes}
              alt={i === index ? item.alt : ''}
              loading="lazy"
              decoding="async"
              draggable={false}
              className={cn(
                'absolute inset-0 size-full max-w-none transition-[opacity,transform] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                imgClassName,
                i === index && 'scale-100 opacity-100',
                i !== index && i === turn.prev && 'scale-[1.035] opacity-0',
                i !== index && i !== turn.prev && 'scale-[0.985] opacity-0 transition-none',
              )}
            />
          ) : null,
        )}
      </div>
      <span
        key={items[index].key}
        className={cn(
          'absolute right-3.5 bottom-3 max-w-[85%] animate-in truncate rounded-full px-2.5 py-1 text-[0.6875rem] leading-none font-semibold duration-700 fade-in-0 slide-in-from-bottom-1 lg:right-4 lg:bottom-4',
          labelClassName,
        )}
      >
        {items[index].label}
      </span>
    </div>
  );
}

/** A phone's own products once it has enough of them, else the general set; never more than a tile shows. */
function forPhone<T extends { models: readonly string[] | null; featured: boolean }>(all: readonly T[], slug: string | null): { items: T[]; own: boolean } {
  const fits = slug ? all.filter((i) => i.models === null || i.models.includes(slug)) : [];
  const own = fits.length >= MIN_FOR_PHONE;
  return { items: (own ? fits : all.filter((i) => i.featured)).slice(0, MAX_ITEMS), own };
}

const coverItem = (e: PhotoEntry) => ({
  key: String(e.id),
  src: backdropThumbSrc(e, 480),
  srcSet: (e.shots ?? 0) > 0 ? shotSrcSet(e.id, 0) : undefined,
  alt: `${e.design} ${e.brand} back cover for ${e.modelLabel}`,
  label: `${e.design} · ${e.brand}`,
  models: e.modelSlugs,
  featured: false,
});
/**
 * Covers left out of the tile: their studio shot shows the retail box or a paper insert, not the cover itself.
 * Every other shot was checked at full size and is sharp.
 */
const NOT_SHOWN = new Set([50105, 50176, 50177]);
/** Every other cover's studio shot. The general set is the home hero's cast, best first. */
const FEATURED_COVERS = new Set(HERO_ORDER.slice(0, MAX_ITEMS).map((e) => e.id));
const COVERS = [...HERO_ORDER, ...PHOTOS.filter((e) => !HERO_ORDER.includes(e))]
  .filter((e) => !NOT_SHOWN.has(e.id))
  .map((e) => ({ ...coverItem(e), featured: FEATURED_COVERS.has(e.id) }));

/**
 * The one photo of each guard that is sharp and clear at this size, by its place in the gallery. The back film
 * and the Galaxy glass open their galleries on a soft shot of the sheet and the box, so they use a later one;
 * the Galaxy Ultra lens film's only photo is a pack printed for one model, so it has none and is left out.
 */
const GUARD_PHOTO: Readonly<Record<string, number>> = {
  'flayr-borderless-iphone': 0,
  'gtel-fingerprint-s': 1,
  'hydrogel-back-film': 2,
  'hydrogel-back-film-galaxy-s': 0,
  'lens-rings-iphone': 0,
  'lens-rings-iphone-pro': 0,
  'lens-rings-galaxy-s': 0,
};
/** The screen glass, back film and lens protectors with such a photo. The general set is the iPhone range. */
const GUARDS = ACCESSORIES.flatMap((a) => {
  const n = GUARD_PHOTO[a.id];
  if (n === undefined || !a.photos || n >= a.photos.gallery.length) return [];
  return [
    {
      key: a.id,
      src: accessoryPhotoSrc(a.id, n, 480),
      srcSet: accessoryPhotoSrcSet(a.id, n),
      alt: `${a.title}: ${a.photos.gallery[n].toLowerCase()}`,
      label: ACCESSORY_TYPE_LABEL[a.type],
      models: a.models ?? null,
      featured: !a.models || a.models.some((m) => m.startsWith('iphone-')),
    },
  ];
});

type ArtProps = Omit<RotatorProps, 'items'>;

/** "Cases with character": the designs for the visitor's phone, or the best of the range before one is picked. */
export function CoverTileArt(props: ArtProps) {
  const { phone } = useMyPhone();
  const { items, own } = forPhone(COVERS, phone?.slug ?? null);
  // A new phone starts the tile over on its own covers.
  return <TileRotator key={own ? phone?.slug : 'all'} items={items} {...props} />;
}

/** "Protection that fits": the glass, film and lens protector made for the visitor's phone, or the iPhone range. */
export function ProtectionTileArt(props: ArtProps) {
  const { phone } = useMyPhone();
  const { items, own } = forPhone(GUARDS, phone?.slug ?? null);
  return <TileRotator key={own ? phone?.slug : 'all'} items={items} {...props} />;
}
