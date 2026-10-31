import { getCatalog, getCatalogHandles } from './catalog';
import type { HomeProduct, ProductDetail } from './fixtures';

// Pure helpers live in ./variants so client components can import them without the server-only Medusa client.
export { findVariant, lowestPrice, MISSING_PRODUCT_HANDLE } from './variants';

/** Photo and procedural products alike; photo handles are the catalogue slugs. */
export async function getProduct(handle: string): Promise<ProductDetail | null> {
  return (await getCatalog()).products.find((p) => p.handle === handle) ?? null;
}

/** For generateStaticParams; cached with the rest of the catalogue. */
export async function getProductHandles(): Promise<string[]> {
  return (await getCatalog()).products.map((p) => p.handle);
}

/** For src/proxy.ts, which runs outside the `use cache` scope. */
export async function getProxyProductHandles(): Promise<string[]> {
  return getCatalogHandles();
}

/** Every product, for queries the page composes itself (e.g. related covers by look). */
export async function getAllProducts(): Promise<ProductDetail[]> {
  return (await getCatalog()).products;
}

function byTrending(a: HomeProduct, b: HomeProduct): number {
  return (a.trendingRank ?? Infinity) - (b.trendingRank ?? Infinity);
}

/**
 * Photo products relate to the other photographed covers; procedural designs to their theme.
 * Trending items first, the product itself excluded.
 */
export async function getRelatedByTheme(product: HomeProduct, limit = 6): Promise<HomeProduct[]> {
  const { products } = await getCatalog();
  const pool = product.photo
    ? products.filter((p) => p.photo !== undefined && p.id !== product.id)
    : products.filter((p) => p.photo === undefined && p.theme === product.theme && p.id !== product.id);
  return pool.sort(byTrending).slice(0, limit);
}

/** Every other product; the client narrows this to the selected model so the page stays static. */
export async function getMoreForPhoneCandidates(product: HomeProduct): Promise<HomeProduct[]> {
  return (await getCatalog()).products.filter((p) => p.id !== product.id);
}
