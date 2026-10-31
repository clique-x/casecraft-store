import {
  PHOTO_PRODUCTS,
  PROCEDURAL_PRODUCTS,
  PRODUCT_DETAILS,
  PRODUCTS,
  type CaseType,
  type HomeProduct,
  type ProductDetail,
  type Variant,
} from './fixtures';

/**
 * Listed in generateStaticParams so `/products/not-found` prerenders as a real 404 (status + store chrome);
 * proxy.ts rewrites every unknown handle to it, because `dynamicParams` is unavailable under cacheComponents.
 */
export const MISSING_PRODUCT_HANDLE = 'not-found';

/** Photo and procedural products alike; photo handles are the catalogue slugs. */
export async function getProduct(handle: string): Promise<ProductDetail | null> {
  return PRODUCT_DETAILS.find((p) => p.handle === handle) ?? null;
}

export async function getProductHandles(): Promise<string[]> {
  return PRODUCT_DETAILS.map((p) => p.handle);
}

function byTrending(a: HomeProduct, b: HomeProduct): number {
  return (a.trendingRank ?? Infinity) - (b.trendingRank ?? Infinity);
}

/**
 * Photo products relate to the other photographed covers; procedural designs to their theme.
 * Trending items first, the product itself excluded.
 */
export async function getRelatedByTheme(product: HomeProduct, limit = 6): Promise<HomeProduct[]> {
  const pool = product.photo
    ? PHOTO_PRODUCTS.filter((p) => p.id !== product.id)
    : PROCEDURAL_PRODUCTS.filter((p) => p.theme === product.theme && p.id !== product.id);
  return pool.sort(byTrending).slice(0, limit);
}

/** Every other product; the client narrows this to the selected model so the page stays static. */
export async function getMoreForPhoneCandidates(product: HomeProduct): Promise<HomeProduct[]> {
  return PRODUCTS.filter((p) => p.id !== product.id);
}

export function findVariant(product: ProductDetail, modelSlug: string | null, caseType: CaseType): Variant | null {
  if (modelSlug === null) return null;
  return product.variants.find((v) => v.modelSlug === modelSlug && v.caseType === caseType) ?? null;
}

export function lowestPrice(product: ProductDetail): number {
  let lowest = Infinity;
  for (const v of product.variants) if (v.priceInr < lowest) lowest = v.priceInr;
  return Number.isFinite(lowest) ? lowest : product.priceFromInr;
}
