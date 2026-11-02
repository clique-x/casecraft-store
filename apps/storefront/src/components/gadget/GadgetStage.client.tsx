'use client';

import { BadgeCheck } from 'lucide-react';
import { GadgetArt } from '@/components/gadget/GadgetArt';
import type { GadgetEntry } from '@/lib/catalog/gadgets';
import { useVariantSelection } from '@/lib/product/variant-store';

/** Product image for the option picked in the buy box (its slug is kept in the selection's modelSlug). */
export function GadgetStage({ gadget, title }: { gadget: GadgetEntry; title: string }) {
  const { modelSlug } = useVariantSelection();
  const option = gadget.options.find((c) => c.slug === modelSlug) ?? gadget.options[0];
  return (
    <div className="relative aspect-[4/5] max-h-[60svh] w-full overflow-hidden rounded-card bg-surface-2 lg:max-h-none">
      <GadgetArt gadget={gadget} hex={option?.hex} title={option ? `${title}, ${option.name}` : title} />
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
