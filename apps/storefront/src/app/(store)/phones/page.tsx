import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { logoIsWordmark, PhoneBrandLogo } from '@/components/brand/PhoneBrandLogo';
import { ListingHeader, PAGE_SHELL } from '@/components/listing/ListingHeader';
import { ModelLinks } from '@/components/listing/ModelLinks';
import { BRAND_NAME, SITE_URL, WHATSAPP_NUMBER, OG_IMAGE } from '@/lib/brand';
import { coverCounts, groupByBrand } from '@/lib/catalog/listing';
import { getPhoneModels } from '@/lib/medusa/home';
import { getAllProducts } from '@/lib/medusa/products';

const TITLE = 'Phone back covers by phone model';
const DESCRIPTION =
  'Find back covers cut for your exact phone: iPhone, Samsung Galaxy, OnePlus, Redmi, Realme, Vivo, OPPO, Motorola, Nothing and Pixel models.';
const URL_PATH = '/phones';

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

const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! Do you have back covers for my phone?')}`;

export default async function PhonesPage() {
  const [models, products] = await Promise.all([getPhoneModels(), getAllProducts()]);
  const brands = groupByBrand(models);
  const counts = coverCounts(products);

  return (
    <div className={PAGE_SHELL}>
      <ListingHeader
        trail={[{ name: 'Phones', href: URL_PATH }]}
        title="Phone back covers by brand and model"
        intro="Pick your phone to see only the covers cut for it. The camera cut-out, buttons and port line up with your exact model."
      />

      <nav aria-label="Brands" className="mt-8">
        <ul className="flex flex-wrap gap-2">
          {brands.map(({ brand, slug }) => (
            <li key={slug}>
              <a
                href={`#${slug}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-border px-4 text-sm font-semibold text-fg transition-colors duration-(--dur-micro) hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
              >
                <PhoneBrandLogo brand={brand} />
                <span className={logoIsWordmark(brand) ? 'sr-only' : undefined}>{brand}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 flex flex-col gap-12 lg:mt-14">
        {brands.map(({ brand, slug, models: list }) => (
          <section key={slug} id={slug} aria-labelledby={`${slug}-heading`} className="scroll-mt-28">
            <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
              <h2 id={`${slug}-heading`} className="flex items-center gap-3 font-sans text-h3 text-fg">
                <PhoneBrandLogo brand={brand} />
                <span className={logoIsWordmark(brand) ? 'sr-only' : undefined}>{brand}</span>
              </h2>
              <Link
                href={`/phones/${slug}`}
                className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-pill px-2 text-sm font-semibold text-fg underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-accent-2"
              >
                All {brand}
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <ModelLinks models={list} counts={counts} layout="compact" className="mt-4" />
          </section>
        ))}
      </div>

      <p className="mt-14 text-body text-fg-muted">
        Don’t see your phone?{' '}
        <a
          href={WHATSAPP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm font-semibold text-fg underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-accent-2"
        >
          WhatsApp us
        </a>{' '}
        and we will check what we have for it.
      </p>
    </div>
  );
}
