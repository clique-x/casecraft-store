import type { MetadataRoute } from 'next';
import { brandSlug } from '@/components/phone-picker/BrandOutline';
import { SITE_URL } from '@/lib/brand';
import { LOOKS } from '@/lib/catalog/looks';
import { POLICIES_UPDATED, POLICY_SLUGS } from '@/lib/content/policies';
import { getCatalogPhoneModels } from '@/lib/medusa/catalog';
import { THEMES } from '@/lib/medusa/fixtures';
import { getProductHandles } from '@/lib/medusa/products';

/** Department and listing pages; each is a route in app/(store). */
const LISTINGS = ['/covers', '/audio', '/storage', '/cameras', '/accessories', '/trending', '/collections/new', '/phones', '/categories'];

/**
 * /sitemap.xml, built from the live catalogue so new products and phones are added on their own. It lists only
 * pages that exist (the same lists src/proxy.ts checks), never cart, checkout, account or search pages.
 * No `lastmod` where there is no real date to give: Google ignores dates that just say "now".
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [models, handles] = await Promise.all([getCatalogPhoneModels(), getProductHandles()]);
  const url = (path: string) => new URL(path, SITE_URL).toString();
  const brands = [...new Set(models.map((m) => brandSlug(m.brand)))].sort();

  return [
    { url: url('/') },
    ...LISTINGS.map((path) => ({ url: url(path) })),
    ...[...LOOKS.map((l) => l.handle), ...THEMES.map((t) => t.handle)].map((h) => ({ url: url(`/categories/${h}`) })),
    ...brands.map((b) => ({ url: url(`/phones/${b}`) })),
    ...models.map((m) => ({ url: url(`/phones/${brandSlug(m.brand)}/${m.slug}`) })),
    ...[...new Set(handles)].sort().map((h) => ({ url: url(`/products/${h}`) })),
    ...POLICY_SLUGS.map((s) => ({ url: url(`/pages/${s}`), lastModified: POLICIES_UPDATED })),
  ];
}
