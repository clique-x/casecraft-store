import type { Metadata } from 'next';
import { ListingHeader, PAGE_SHELL } from '@/components/listing/ListingHeader';
import { ProductGrid } from '@/components/listing/ProductGrid';
import { BRAND_NAME, SITE_URL, OG_IMAGE } from '@/lib/brand';
import { trendingList } from '@/lib/catalog/listing';
import { getPhoneModels } from '@/lib/medusa/home';
import { getAllProducts } from '@/lib/medusa/products';

const TITLE = 'Trending phone back covers';
const DESCRIPTION =
  'The phone back covers people are ordering most this week, photographed in our shop. Cash on Delivery, UPI and cards accepted.';
const URL_PATH = '/trending';

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
    images: [OG_IMAGE],
  },
};

export default async function TrendingPage() {
  const [products, models] = await Promise.all([getAllProducts(), getPhoneModels()]);
  const { ranked, rest } = trendingList(products);

  return (
    <div className={PAGE_SHELL}>
      <ListingHeader
        trail={[{ name: 'Trending', href: URL_PATH }]}
        title="Trending phone back covers"
        intro="Ranked by what people ordered this week. Tap a cover to pick your phone model."
        aside={`${ranked.length + rest.length} covers`}
      />

      {ranked.length > 0 && (
        <ProductGrid products={ranked} label="Trending covers" modelCount={models.length} ranked eager className="mt-8 lg:mt-10" />
      )}

      {rest.length > 0 && (
        <section aria-labelledby="more-heading" className="mt-16 border-t border-border pt-10 lg:mt-20">
          <h2 id="more-heading" className="font-sans text-h3 text-fg">
            More covers
          </h2>
          <ProductGrid products={rest} label="More covers" modelCount={models.length} className="mt-6" />
        </section>
      )}
    </div>
  );
}
