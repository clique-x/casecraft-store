import { brandSlug } from '@/components/phone-picker/BrandOutline';
import { LAUNCH_BRANDS } from '@/lib/brand';
import type { Look } from '@/lib/catalog/looks';
import type { HomeProduct, PhoneModel } from '@/lib/medusa/fixtures';

/**
 * Pure helpers for the listing pages (/trending, /collections/new, /categories, /phones, /search).
 * They take loader results as arguments, so they never touch the catalogue themselves.
 */

function rankOf(p: HomeProduct): number {
  return p.trendingRank ?? Infinity;
}

/** Ranked first (by rank), photographed before procedural on ties and among the unranked. */
export function byTrendingThenPhoto(a: HomeProduct, b: HomeProduct): number {
  const ra = rankOf(a);
  const rb = rankOf(b);
  if (ra !== rb) return ra < rb ? -1 : 1;
  return Number(b.photo !== undefined) - Number(a.photo !== undefined);
}

/** Stable sort that leaves catalogue order alone inside each group. */
export function sortForListing<T extends HomeProduct>(products: readonly T[]): T[] {
  return products
    .map((p, i) => ({ p, i }))
    .sort((x, y) => byTrendingThenPhoto(x.p, y.p) || x.i - y.i)
    .map(({ p }) => p);
}

/** Every product with a trending rank (by rank), then the rest with photographed covers first. */
export function trendingList<T extends HomeProduct>(products: readonly T[]): { ranked: T[]; rest: T[] } {
  const sorted = sortForListing(products);
  return {
    ranked: sorted.filter((p) => p.trendingRank !== undefined),
    rest: sorted.filter((p) => p.trendingRank === undefined),
  };
}

export function newArrivals<T extends HomeProduct>(products: readonly T[]): T[] {
  return sortForListing(products.filter((p) => p.isNew === true));
}

export function productsInLook<T extends HomeProduct>(products: readonly T[], look: Look): T[] {
  return sortForListing(products.filter((p) => p.photo !== undefined && look.match(p.photo)));
}

// --- phones ------------------------------------------------------------------------------------

export interface BrandGroup {
  brand: string;
  slug: string;
  models: PhoneModel[];
}

/** Newest first, then by name, so the current phones lead each brand. */
function byRelease(a: PhoneModel, b: PhoneModel): number {
  return b.releaseYear - a.releaseYear || a.model.localeCompare(b.model, 'en');
}

/** Brands in launch order (unknown brands after, A–Z), each with its models. */
export function groupByBrand(models: readonly PhoneModel[]): BrandGroup[] {
  const groups = new Map<string, PhoneModel[]>();
  for (const m of models) {
    const list = groups.get(m.brand);
    if (list) list.push(m);
    else groups.set(m.brand, [m]);
  }
  const order = (brand: string) => {
    const i = LAUNCH_BRANDS.indexOf(brand);
    return i === -1 ? LAUNCH_BRANDS.length : i;
  };
  return [...groups.entries()]
    .sort(([a], [b]) => order(a) - order(b) || a.localeCompare(b, 'en'))
    .map(([brand, list]) => ({ brand, slug: brandSlug(brand), models: [...list].sort(byRelease) }));
}

export function findBrand(models: readonly PhoneModel[], slug: string): BrandGroup | null {
  return groupByBrand(models).find((g) => g.slug === slug) ?? null;
}

export function findModel(models: readonly PhoneModel[], brand: string, slug: string): PhoneModel | null {
  return models.find((m) => m.slug === slug && brandSlug(m.brand) === brand) ?? null;
}

/** Cover count per model slug. */
export function coverCounts(products: readonly HomeProduct[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of products) for (const slug of p.fitsModels) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  return counts;
}

export function coversLabel(count: number): string {
  return `${count} ${count === 1 ? 'cover' : 'covers'}`;
}

// --- search ------------------------------------------------------------------------------------

export const MAX_QUERY_LENGTH = 80;

export function normaliseQuery(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_LENGTH);
}

function tokens(query: string): string[] {
  return query.toLowerCase().split(' ').filter(Boolean);
}

function matchesAll(haystack: string, words: readonly string[]): boolean {
  return words.every((w) => haystack.includes(w));
}

export interface SearchResult<T extends HomeProduct> {
  products: T[];
  models: PhoneModel[];
}

/**
 * Case-insensitive; every word of the query must appear somewhere in the product's title, brand
 * line, photo brand/series/design/look or the names of the phones it fits. Phones whose name matches
 * are returned too, so the page can link straight to their model pages.
 */
export function searchCatalog<T extends HomeProduct>(
  products: readonly T[],
  models: readonly PhoneModel[],
  query: string,
): SearchResult<T> {
  const words = tokens(query);
  if (words.length === 0) return { products: [], models: [] };

  const modelName = new Map(models.map((m) => [m.slug, `${m.brand} ${m.model}`]));
  const matched = products.filter((p) => {
    const parts = [p.title, p.brandLine ?? ''];
    // The look ('carbon and aramid', 'animal print') too, so a search for 'carbon' finds the whole look.
    if (p.photo) parts.push(p.photo.brand, p.photo.series, p.photo.design, p.photo.modelLabel, p.photo.look.replace(/-/g, ' '));
    for (const slug of p.fitsModels) parts.push(modelName.get(slug) ?? '');
    return matchesAll(parts.join(' ').toLowerCase(), words);
  });

  const phones = models.filter((m) => matchesAll(`${m.brand} ${m.model} ${m.series ?? ''}`.toLowerCase(), words));
  return { products: sortForListing(matched), models: [...phones].sort(byRelease) };
}
