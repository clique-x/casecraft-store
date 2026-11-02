'use client';

import { BadgeCheck } from 'lucide-react';
import { GadgetArt } from '@/components/gadget/GadgetArt';
import { gadgetGallerySrc, gadgetGallerySrcSet, gadgetHeroIndex, type GadgetEntry } from '@/lib/catalog/gadgets';
import { useVariantSelection } from '@/lib/product/variant-store';

const SIZES = '(min-width: 64rem) 720px, 100vw';

/**
 * Product image for the option picked in the buy box (its slug is kept in the selection's modelSlug):
 * the brand's image of that colour when the catalogue has one, the drawn art otherwise.
 */
export function GadgetStage({ gadget, title }: { gadget: GadgetEntry; title: string }) {
  const { modelSlug } = useVariantSelection();
  const option = gadget.options.find((c) => c.slug === modelSlug) ?? gadget.options[0];
  const label = option ? `${title}, ${option.name}` : title;
  const photos = gadget.photos;
  const hero = photos ? gadgetHeroIndex(photos, option?.slug) : 0;
  return (
    <div className="relative aspect-[4/5] max-h-[60svh] w-full overflow-hidden rounded-card bg-surface-2 lg:max-h-none">
      {photos ? (
        // eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer
        <img
          src={gadgetGallerySrc(photos, hero)}
          srcSet={gadgetGallerySrcSet(photos, hero)}
          sizes={SIZES}
          width={960}
          height={960}
          alt={label}
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 size-full object-contain p-4 sm:p-8"
        />
      ) : (
        <GadgetArt gadget={gadget} hex={option?.hex} title={label} />
      )}
      {gadget.original && (
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-paper/90 px-3 py-1 text-caption font-bold text-fg backdrop-blur">
          <BadgeCheck className="size-4 text-brand" aria-hidden="true" />
          Original {gadget.original.brand}
        </span>
      )}
      {option && (
        <span className="absolute bottom-3 left-3 rounded-full bg-paper/90 px-3 py-1 text-caption font-semibold text-fg backdrop-blur">
          {option.name}
        </span>
      )}
    </div>
  );
}
