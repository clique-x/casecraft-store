import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Crumbs } from '@/components/listing/Crumbs';
import { PAGE_SHELL } from '@/components/listing/ListingHeader';
import { ProductGrid } from '@/components/listing/ProductGrid';
import { phoneHref } from '@/components/phone-picker/BrandOutline';
import { SearchForm } from '@/components/search/SearchForm';
import { WHATSAPP_NUMBER } from '@/lib/brand';
import { coversLabel, normaliseQuery, searchCatalog } from '@/lib/catalog/listing';
import { getPhoneModels, getTrending } from '@/lib/medusa/home';
import { getAllProducts } from '@/lib/medusa/products';

export const metadata: Metadata = {
  title: 'Search covers',
  description: 'Search phone back covers by phone model, design, colour or brand.',
  // Result pages are thin and endless; keep them out of the index but let crawlers follow the links.
  robots: { index: false, follow: true },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

interface SearchPageProps {
  searchParams: SearchParams;
}

const PHONE_LINK_LIMIT = 6;

// searchParams is request data: under cacheComponents it is read inside Suspense so the
// heading and an empty form stay in the static shell.
export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <div className={PAGE_SHELL}>
      <header className="flex flex-col gap-4">
        <Crumbs trail={[{ name: 'Search', href: '/search' }]} />
        <h1 className="font-display text-h2 font-extrabold text-balance text-fg">Search covers</h1>
      </header>
      <Suspense fallback={<SearchFallback />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function SearchFallback() {
  return (
    <div aria-busy="true" className="mt-6">
      <SearchForm />
      <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="aspect-[4/5] rounded-card bg-surface-2" />
        ))}
      </div>
    </div>
  );
}

async function SearchResults({ searchParams }: { searchParams: SearchParams }) {
  const query = normaliseQuery((await searchParams).q);

  if (query === '') {
    const [trending, models] = await Promise.all([getTrending(), getPhoneModels()]);
    return (
      <div className="mt-6">
        <SearchForm />
        <p className="mt-3 text-caption text-fg-muted">Try a phone like “iPhone 16 Pro”, a look like “carbon” or a colour.</p>
        <section aria-labelledby="search-trending-heading" className="mt-12">
          <h2 id="search-trending-heading" className="font-sans text-h3 text-fg">
            Trending this week
          </h2>
          <ProductGrid products={trending} label="Trending covers" modelCount={models.length} ranked className="mt-6" />
        </section>
      </div>
    );
  }

  const [products, models] = await Promise.all([getAllProducts(), getPhoneModels()]);
  const result = searchCatalog(products, models, query);
  const phones = result.models.slice(0, PHONE_LINK_LIMIT);
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I'm looking for a cover: ${query}`)}`;

  return (
    <div className="mt-6">
      <SearchForm defaultValue={query} />

      <p role="status" className="mt-4 text-body text-fg-muted">
        {result.products.length > 0 ? (
          <>
            {coversLabel(result.products.length)} for <span className="font-semibold text-fg">“{query}”</span>
          </>
        ) : (
          <>
            No covers match <span className="font-semibold text-fg">“{query}”</span>.
          </>
        )}
      </p>

      {phones.length > 0 && (
        <nav aria-label="Matching phones" className="mt-6">
          <h2 className="font-sans text-label font-bold tracking-[0.2em] text-fg-muted uppercase">Phones</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {phones.map((m) => (
              <li key={m.slug}>
                <Link
                  href={phoneHref(m)}
                  className="inline-flex min-h-11 items-center rounded-pill border border-border px-4 text-sm font-semibold text-fg transition-colors duration-(--dur-micro) hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
                >
                  All {m.model} covers
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {result.products.length > 0 ? (
        <ProductGrid products={result.products} label={`Results for ${query}`} modelCount={models.length} className="mt-10" />
      ) : (
        <div className="mt-6 flex flex-col gap-3 text-body text-fg-muted">
          <p>Check the spelling, or try fewer words: just the phone model often works.</p>
          <p className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/trending" className="font-semibold text-fg underline underline-offset-4">
              Browse trending
            </Link>
            <Link href="/phones" className="font-semibold text-fg underline underline-offset-4">
              Shop by phone
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-fg underline underline-offset-4"
            >
              Ask us on WhatsApp
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
