import type { CaseType, ProductDetail, Variant } from './fixtures';

/**
 * Listed in generateStaticParams so `/products/not-found` prerenders as a real 404 (status + store chrome);
 * proxy.ts rewrites every unknown handle to it, because `dynamicParams` is unavailable under cacheComponents.
 */
export const MISSING_PRODUCT_HANDLE = 'not-found';

export function findVariant(product: ProductDetail, modelSlug: string | null, caseType: CaseType): Variant | null {
  if (modelSlug === null) return null;
  return product.variants.find((v) => v.modelSlug === modelSlug && v.caseType === caseType) ?? null;
}

export function lowestPrice(product: ProductDetail): number {
  let lowest = Infinity;
  for (const v of product.variants) if (v.priceInr < lowest) lowest = v.priceInr;
  return Number.isFinite(lowest) ? lowest : product.priceFromInr;
}
