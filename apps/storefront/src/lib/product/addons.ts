import type { ProductDetail, Variant } from '@/lib/medusa/fixtures';

/** Accessories offered as add-ons on cover pages, in display order (back films are sold on their own). */
export const ADDON_IDS: readonly string[] = ['glass-clear', 'glass-privacy', 'lens-glass'];

/** The accessory's variant for a phone, if that phone is supported and in stock. */
export function accessoryVariant(accessory: ProductDetail, modelSlug: string | null): Variant | null {
  if (!modelSlug) return null;
  const v = accessory.variants.find((x) => x.modelSlug === modelSlug);
  return v && v.stock > 0 ? v : null;
}

/** Variant ids of the ticked add-ons for this phone, skipping any that are unavailable. */
export function addonVariantIds(accessories: readonly ProductDetail[], selected: readonly string[], modelSlug: string | null): string[] {
  return selected
    .map((id) => accessories.find((a) => a.accessory?.id === id))
    .map((a) => (a ? accessoryVariant(a, modelSlug)?.id : undefined))
    .filter((id): id is string => Boolean(id));
}
