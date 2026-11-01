'use client';

import { AccessoryArt } from '@/components/accessory/AccessoryArt';
import type { AccessoryEntry } from '@/lib/catalog/accessories';
import type { PhoneModel } from '@/lib/medusa/fixtures';
import { useVariantSelection } from '@/lib/product/variant-store';

/** Accessory product image; the camera island follows the phone picked in the buy box. */
export function AccessoryStage({ accessory, models, title }: { accessory: AccessoryEntry; models: PhoneModel[]; title: string }) {
  const { modelSlug } = useVariantSelection();
  const model = models.find((m) => m.slug === modelSlug);
  return (
    <div className="relative aspect-[4/5] max-h-[60svh] w-full overflow-hidden rounded-card bg-surface-2 lg:max-h-none">
      <AccessoryArt accessory={accessory} island={model?.islandStyle} title={model ? `${title} for ${model.model}` : title} />
      {model && (
        <span className="absolute bottom-3 left-3 rounded-full bg-paper/90 px-3 py-1 text-caption font-semibold text-fg backdrop-blur">
          Cut for {model.model}
        </span>
      )}
    </div>
  );
}
