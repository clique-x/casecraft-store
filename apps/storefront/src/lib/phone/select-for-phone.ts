import type { HomeProduct } from '@/lib/medusa/fixtures';

/** Below this many fits the row keeps the full list rather than look empty. */
const MIN_MATCHES = 3;

export function selectForPhone(
  products: readonly HomeProduct[],
  slug: string | null,
): { items: readonly HomeProduct[]; filtered: boolean } {
  if (!slug) return { items: products, filtered: false };
  const fits = products.filter((p) => p.fitsModels.includes(slug));
  return fits.length >= MIN_MATCHES ? { items: fits, filtered: true } : { items: products, filtered: false };
}
