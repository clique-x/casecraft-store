import type { Metadata } from 'next';
import Link from 'next/link';
import { ListingHeader, PAGE_SHELL } from '@/components/listing/ListingHeader';
import { ProductGrid } from '@/components/listing/ProductGrid';
import { BRAND_NAME, SITE_URL } from '@/lib/brand';
import { newArrivals } from '@/lib/catalog/listing';
import { getPhoneModels } from '@/lib/medusa/home';
import { getAllProducts } from '@/lib/medusa/products';

const TITLE = 'New phone back covers';
const DESCRIPTION = 'Back covers that just came into our shop, photographed as they arrived. Pick your phone and see what fits.';
const URL_PATH = '/collections/new';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: new URL(URL_PATH, SITE_URL).toString() },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: BRAND_NAME,
    title: `${TITLE} · ${BRAND_NAME}`,
    description: DESCRIPTION,
    url: new URL(URL_PATH, SITE_URL).toString(),
  },
};

export default async function NewArrivalsPage() {
  const [products, models] = await Promise.all([getAllProducts(), getPhoneModels()]);
  const items = newArrivals(products);

  return (
    <div className={PAGE_SHELL}>
      <ListingHeader
        trail={[{ name: 'New this week', href: URL_PATH }]}
        title="New this week"
        intro="Covers that just came in. Each one is photographed in our shop before it goes on the site."
        aside={`${items.length} ${items.length === 1 ? 'cover' : 'covers'}`}
      />

      {items.length > 0 ? (
        <ProductGrid products={items} label="New covers" modelCount={models.length} newBadge eager className="mt-8 lg:mt-10" />
      ) : (
        <p className="mt-10 text-body text-fg-muted">
          Nothing new this week yet.{' '}
          <Link href="/trending" className="font-semibold text-fg underline underline-offset-4">
            See what is trending
          </Link>
          .
        </p>
      )}
    </div>
  );
}
