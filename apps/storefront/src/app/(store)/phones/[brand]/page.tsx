import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PhoneBrandLogo } from '@/components/brand/PhoneBrandLogo';
import { ListingHeader, PAGE_SHELL } from '@/components/listing/ListingHeader';
import { ModelLinks } from '@/components/listing/ModelLinks';
import { BRAND_NAME, FREE_SHIPPING_THRESHOLD_INR, SITE_URL, OG_IMAGE } from '@/lib/brand';
import { coverCounts, coversLabel, findBrand, groupByBrand, listPhrase, lowestFrom } from '@/lib/catalog/listing';
import { searchModelName } from '@/lib/product/names';
import { fullTitle, rupees, seoDescription, seoTitle } from '@/lib/seo/meta';
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

  const products = await getAllProducts();
  const counts = coverCounts(products);
  const covered = group.models.filter((m) => (counts.get(m.slug) ?? 0) > 0);
  const covers = products.filter((p) => p.fitsModels.some((s) => group.models.some((m) => m.slug === s)));
  const url = new URL(`/phones/${group.slug}`, SITE_URL).toString();
  if (covers.length === 0) {
    const title = `${group.brand} back covers`;
    const description = seoDescription(`Back covers for ${group.brand} phones are coming soon. See the phones we have covers for, with COD across India.`);
    return {
      title,
      description,
      robots: { index: false, follow: true },
      alternates: { canonical: url },
      openGraph: { type: 'website', locale: 'en_IN', siteName: BRAND_NAME, title: fullTitle(title), description, url, images: [OG_IMAGE] },
    };
  }
  const from = rupees(lowestFrom(covers));
  const title = seoTitle(`${group.brand} Back Covers & Cases – From ${from}`, `${group.brand} Back Covers – From ${from}`, `${group.brand} Back Covers`);
  const names = covered.map((m) => searchModelName(m.model));
  const description = seoDescription(
    `${coversLabel(covers.length)} for ${group.brand} phones, from ${from}: ${listPhrase(names, 3)}. COD, free shipping over ₹${FREE_SHIPPING_THRESHOLD_INR}.`,
    `${coversLabel(covers.length)} for ${group.brand} phones, from ${from}. COD, free shipping over ₹${FREE_SHIPPING_THRESHOLD_INR}.`,
  );
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', locale: 'en_IN', siteName: BRAND_NAME, title: fullTitle(title), description, url, images: [OG_IMAGE] },
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { brand: slug } = await params;
  const [models, products] = await Promise.all([getPhoneModels(), getAllProducts()]);
  const group = findBrand(models, slug);
  if (!group) notFound();

  const counts = coverCounts(products);
  const hasCovers = (g: { models: readonly { slug: string }[] }) => g.models.some((m) => (counts.get(m.slug) ?? 0) > 0);
  const others = groupByBrand(models).filter((g) => g.slug !== group.slug && hasCovers(g));
  const coveredModels = group.models.filter((m) => (counts.get(m.slug) ?? 0) > 0);

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
        intro={
          coveredModels.length > 0
            ? `Choose your ${group.brand} model to see the covers made for it. Free shipping on orders over ₹${FREE_SHIPPING_THRESHOLD_INR}.`
            : `Covers for ${group.brand} phones are coming soon. See the other brands below, or message us on WhatsApp and we will check the shop for your phone.`
        }
        aside={`${coveredModels.length} ${coveredModels.length === 1 ? 'model' : 'models'}`}
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
