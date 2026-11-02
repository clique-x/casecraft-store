import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ListingHeader, PAGE_SHELL } from '@/components/listing/ListingHeader';
import { ProductGrid } from '@/components/listing/ProductGrid';
import { BRAND_NAME, SITE_URL } from '@/lib/brand';
import { coversLabel, productsInLook, sortForListing } from '@/lib/catalog/listing';
import { LOOKS } from '@/lib/catalog/looks';
import type { HomeProduct } from '@/lib/medusa/fixtures';
import { getPhoneModels, getThemes } from '@/lib/medusa/home';
import { getAllProducts } from '@/lib/medusa/products';

interface CategoryPageProps {
  params: Promise<{ handle: string }>;
}

interface Category {
  handle: string;
  name: string;
  blurb: string;
  /** Looks are the photographed groups; themes group the printed designs (linked from their product pages). */
  kind: 'look' | 'theme';
}

async function categories(): Promise<Category[]> {
  const themes = await getThemes();
  return [
    ...LOOKS.map((l) => ({ handle: l.handle, name: l.name, blurb: l.blurb, kind: 'look' as const })),
    ...themes.map((t) => ({ handle: t.handle, name: t.name, blurb: t.blurb, kind: 'theme' as const })),
  ];
}

async function findCategory(handle: string): Promise<Category | null> {
  return (await categories()).find((c) => c.handle === handle) ?? null;
}

async function productsFor(category: Category): Promise<HomeProduct[]> {
  const products = await getAllProducts();
  if (category.kind === 'look') {
    const look = LOOKS.find((l) => l.handle === category.handle);
    return look ? productsInLook(products, look) : [];
  }
  return sortForListing(products.filter((p) => p.photo === undefined && p.theme === category.handle));
}

// `dynamicParams` is unavailable under cacheComponents; every handle is listed here and
// anything else falls through to notFound().
export async function generateStaticParams(): Promise<{ handle: string }[]> {
  return (await categories()).map(({ handle }) => ({ handle }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { handle } = await params;
  const category = await findCategory(handle);
  if (!category) return { title: 'Look not found', robots: { index: false, follow: true } };

  const title = `${category.name} phone back covers`;
  const description = `${category.blurb} ${category.name} back covers for iPhone, Samsung, OnePlus and more, with Cash on Delivery across India.`;
  const url = new URL(`/categories/${category.handle}`, SITE_URL).toString();
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', locale: 'en_IN', siteName: BRAND_NAME, title: `${title} · ${BRAND_NAME}`, description, url },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { handle } = await params;
  const category = await findCategory(handle);
  if (!category) notFound();

  const [items, models] = await Promise.all([productsFor(category), getPhoneModels()]);

  return (
    <div className={PAGE_SHELL}>
      <ListingHeader
        trail={[
          { name: 'Looks', href: '/categories' },
          { name: category.name, href: `/categories/${category.handle}` },
        ]}
        title={category.name}
        intro={category.blurb}
        aside={coversLabel(items.length)}
      />

      {items.length > 0 ? (
        <ProductGrid products={items} label={`${category.name} covers`} modelCount={models.length} eager className="mt-8 lg:mt-10" />
      ) : (
        <p className="mt-10 text-body text-fg-muted">
          No covers in this look right now.{' '}
          <Link href="/categories" className="font-semibold text-fg underline underline-offset-4">
            See the other looks
          </Link>
          .
        </p>
      )}

      <nav aria-label="Other looks" className="mt-16 border-t border-border pt-8">
        <h2 className="font-sans text-label font-bold tracking-[0.2em] text-fg-muted uppercase">Other looks</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {LOOKS.filter((l) => l.handle !== category.handle).map((l) => (
            <li key={l.handle}>
              <Link
                href={`/categories/${l.handle}`}
                className="inline-flex min-h-11 items-center rounded-pill border border-border px-4 text-sm font-semibold text-fg transition-colors duration-(--dur-micro) hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
              >
                {l.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
