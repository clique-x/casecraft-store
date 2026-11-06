import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PhoneBrandLogo } from '@/components/brand/PhoneBrandLogo';
import { ListingHeader, PAGE_SHELL } from '@/components/listing/ListingHeader';
import { ModelLinks } from '@/components/listing/ModelLinks';
import { BRAND_NAME, FREE_SHIPPING_THRESHOLD_INR, SITE_URL, OG_IMAGE } from '@/lib/brand';
import { coverCounts, findBrand, groupByBrand } from '@/lib/catalog/listing';
import { getPhoneModels } from '@/lib/medusa/home';
import { getAllProducts } from '@/lib/medusa/products';

interface BrandPageProps {
  params: Promise<{ brand: string }>;
}

// Every brand in the phone model list; `dynamicParams` is unavailable under cacheComponents.
export async function generateStaticParams(): Promise<{ brand: string }[]> {
  return groupByBrand(await getPhoneModels()).map(({ slug }) => ({ brand: slug }));
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { brand: slug } = await params;
  const group = findBrand(await getPhoneModels(), slug);
  if (!group) return { title: 'Phone brand not found', robots: { index: false, follow: true } };

  const title = `${group.brand} back covers`;
  const names = group.models.slice(0, 3).map((m) => m.model).join(', ');
  const description = `Back covers for ${group.brand} phones including ${names}. Cut for each model, photographed in our shop, with Cash on Delivery across India.`;
  const url = new URL(`/phones/${group.slug}`, SITE_URL).toString();
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', locale: 'en_IN', siteName: BRAND_NAME, title: `${title} · ${BRAND_NAME}`, description, url, images: [OG_IMAGE] },
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { brand: slug } = await params;
  const [models, products] = await Promise.all([getPhoneModels(), getAllProducts()]);
  const group = findBrand(models, slug);
  if (!group) notFound();

  const counts = coverCounts(products);
  const others = groupByBrand(models).filter((g) => g.slug !== group.slug);

  return (
    <div className={PAGE_SHELL}>
      <ListingHeader
        trail={[
          { name: 'Phones', href: '/phones' },
          { name: group.brand, href: `/phones/${group.slug}` },
        ]}
        title={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <PhoneBrandLogo brand={group.brand} className="text-fg" />
            <span>{group.brand} back covers</span>
          </span>
        }
        intro={`Choose your ${group.brand} model to see the covers cut for it. Free shipping on orders over ₹${FREE_SHIPPING_THRESHOLD_INR}.`}
        aside={`${group.models.length} ${group.models.length === 1 ? 'model' : 'models'}`}
      />

      <ModelLinks models={group.models} counts={counts} className="mt-8 lg:mt-10" />

      {others.length > 0 && (
        <nav aria-label="Other brands" className="mt-16 border-t border-border pt-8">
          <h2 className="font-sans text-label font-bold tracking-[0.2em] text-fg-muted uppercase">Other brands</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/phones/${g.slug}`}
                  className="inline-flex min-h-11 items-center rounded-pill border border-border px-4 text-sm font-semibold text-fg transition-colors duration-(--dur-micro) hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
                >
                  {g.brand}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
