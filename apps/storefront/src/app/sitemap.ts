import type { MetadataRoute } from 'next';
import { brandSlug } from '@/components/phone-picker/BrandOutline';
import { SITE_URL } from '@/lib/brand';
import { DEPARTMENT_OF, type Department } from '@/lib/catalog/gadgets';
import { newArrivals, productsInLook } from '@/lib/catalog/listing';
import { LOOKS } from '@/lib/catalog/looks';
import { POLICIES_UPDATED, POLICY_SLUGS } from '@/lib/content/policies';
import { getCatalog } from '@/lib/medusa/catalog';
import type { HomeProduct } from '@/lib/medusa/fixtures';
import { getPhoneModels } from '@/lib/medusa/home';

/**
 * /sitemap.xml from the live catalogue, so new products and phones are added on their own.
 * - Only indexable pages: a phone, brand, look or collection with no products is left out (those pages are
 *   noindex), and so are cart, checkout, account and search.
 * - `lastmod` is a real date: when the product last changed in the store, or for a listing the newest change among
 *   its products; policy pages use their "last updated" date. Where there is no date (sample data) none is given,
 *   since Google ignores dates that just say "now". No changefreq or priority: Google ignores them.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ products, accessories, gadgets }, models] = await Promise.all([getCatalog(), getPhoneModels()]);
  const url = (path: string) => new URL(path, SITE_URL).toString();
  const covers = products.filter((p) => p.photo !== undefined);
  const entry = (path: string, items: readonly HomeProduct[]): MetadataRoute.Sitemap[number] => {
    const lastModified = newest(items);
    return lastModified ? { url: url(path), lastModified } : { url: url(path) };
  };
  const department = (d: Department) => gadgets.filter((g) => g.gadget && DEPARTMENT_OF[g.gadget.type] === d);

  const listings: MetadataRoute.Sitemap = [
    entry('/', [...products, ...accessories, ...gadgets]),
    entry('/covers', covers),
    entry('/trending', covers),
    ...(newArrivals(covers).length > 0 ? [entry('/collections/new', newArrivals(covers))] : []),
    entry('/categories', covers),
    entry('/phones', covers),
    ...(['audio', 'charging', 'storage', 'cameras', 'computer'] as const).flatMap((d) => (department(d).length > 0 ? [entry(`/${d}`, department(d))] : [])),
    ...(accessories.length > 0 ? [entry('/accessories', accessories)] : []),
  ];

  const looks = LOOKS.flatMap((look) => {
    const items = productsInLook(covers, look);
    return items.length > 0 ? [entry(`/categories/${look.handle}`, items)] : [];
  });

  const fitting = (slugs: ReadonlySet<string>) => covers.filter((p) => p.fitsModels.some((s) => slugs.has(s)));
  const brands = [...new Set(models.map((m) => m.brand))].flatMap((brand) => {
    const items = fitting(new Set(models.filter((m) => m.brand === brand).map((m) => m.slug)));
    return items.length > 0 ? [entry(`/phones/${brandSlug(brand)}`, items)] : [];
  });
  const phones = models.flatMap((m) => {
    const items = fitting(new Set([m.slug]));
    return items.length > 0 ? [entry(`/phones/${brandSlug(m.brand)}/${m.slug}`, items)] : [];
  });

  const productPages = [...products, ...accessories, ...gadgets]
    .sort((a, b) => a.handle.localeCompare(b.handle))
    .map((p) => entry(`/products/${p.handle}`, [p]));

  const policies = POLICY_SLUGS.map((s) => ({ url: url(`/pages/${s}`), lastModified: POLICIES_UPDATED }));

  return [...listings, ...looks, ...brands, ...phones, ...productPages, ...policies];
}

/** The latest `updatedAt` among the products, or undefined when none has one. */
function newest(items: readonly HomeProduct[]): string | undefined {
  let latest: string | undefined;
  for (const p of items) if (p.updatedAt && (!latest || p.updatedAt > latest)) latest = p.updatedAt;
  return latest;
}
