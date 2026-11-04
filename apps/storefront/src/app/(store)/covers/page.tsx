import type { Metadata } from 'next';
import { DepartmentHeader, DepartmentSection } from '@/components/listing/DepartmentHeader';
import { PAGE_SHELL } from '@/components/listing/ListingHeader';
import { ProductGrid } from '@/components/listing/ProductGrid';
import { BRAND_NAME, SITE_URL } from '@/lib/brand';
import { productsInLook } from '@/lib/catalog/listing';
import { LOOKS } from '@/lib/catalog/looks';
import { getPhoneModels } from '@/lib/medusa/home';
import { getAllProducts } from '@/lib/medusa/products';

const TITLE = 'Phone back covers';
const DESCRIPTION =
  'Every cover in the shop: carbon, animal print, solid, clear and frosted, ring and stand. Photographed in our shop, cut for your exact phone, with Cash on Delivery across India.';
const URL_PATH = '/covers';

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

/** Every photographed cover, grouped by look, biggest group first. */
export default async function CoversPage() {
  const [products, models] = await Promise.all([getAllProducts(), getPhoneModels()]);
  const groups = LOOKS.map((look) => ({ id: look.handle, heading: look.name, items: productsInLook(products, look) }))
    .filter((g) => g.items.length > 0)
    .sort((a, b) => b.items.length - a.items.length);

  return (
    <div className={PAGE_SHELL}>
      <DepartmentHeader
        trail={[{ name: 'Covers', href: URL_PATH }]}
        title="Covers"
        groups={groups.map((g) => ({ id: g.id, heading: g.heading, count: g.items.length }))}
        warranty="Photographed in our shop"
      />
      {groups.map(({ id, heading, items }, i) => (
        <DepartmentSection key={id} id={id} heading={heading} count={items.length} first={i === 0}>
          <ProductGrid products={items} label={`${heading} covers`} modelCount={models.length} eager={i === 0} className="mt-5" />
        </DepartmentSection>
      ))}
    </div>
  );
}
