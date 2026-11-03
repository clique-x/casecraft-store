import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PhoneBrandLogo } from '@/components/brand/PhoneBrandLogo';
import { ListingHeader, PAGE_SHELL } from '@/components/listing/ListingHeader';
import { ModelLinks } from '@/components/listing/ModelLinks';
import { ProductGrid } from '@/components/listing/ProductGrid';
import { brandSlug, phoneHref } from '@/components/phone-picker/BrandOutline';
import {
  BRAND_NAME,
  COD_FEE_INR,
  DISPATCH_WINDOW,
  FREE_SHIPPING_THRESHOLD_INR,
  SITE_URL,
  WHATSAPP_NUMBER,
} from '@/lib/brand';
import { coverCounts, coversLabel, findBrand, findModel, sortForListing } from '@/lib/catalog/listing';
import { formatInr, photoSrc, gallerySrc } from '@/lib/catalog/photos';
import type { HomeProduct, PhoneModel } from '@/lib/medusa/fixtures';
import { getPhoneModels, getProductsForPhone } from '@/lib/medusa/home';
import { getAllProducts } from '@/lib/medusa/products';

interface ModelPageProps {
  params: Promise<{ brand: string; model: string }>;
}

const OG_WIDTH = 960;

// Every phone model in the list; `dynamicParams` is unavailable under cacheComponents.
export async function generateStaticParams(): Promise<{ brand: string; model: string }[]> {
  return (await getPhoneModels()).map((m) => ({ brand: brandSlug(m.brand), model: m.slug }));
}

function codLine(): string {
  return COD_FEE_INR === 0 ? 'Cash on Delivery at no extra charge' : `Cash on Delivery (₹${COD_FEE_INR} fee)`;
}

function describe(model: PhoneModel, products: readonly HomeProduct[]): string {
  if (products.length === 0) {
    return `Back covers for the ${model.brand} ${model.model}. Message us on WhatsApp and we will check stock for your phone.`;
  }
  const from = formatInr(Math.min(...products.map((p) => p.priceFromInr)));
  return `${coversLabel(products.length)} cut for the ${model.model}, from ${from}. ${codLine()}, UPI and cards, free shipping over ₹${FREE_SHIPPING_THRESHOLD_INR}.`;
}

export async function generateMetadata({ params }: ModelPageProps): Promise<Metadata> {
  const { brand, model: slug } = await params;
  const model = findModel(await getPhoneModels(), brand, slug);
  if (!model) return { title: 'Phone not found', robots: { index: false, follow: true } };

  const products = sortForListing(await getProductsForPhone(model.slug));
  const title = `${model.model} back covers`;
  const description = describe(model, products);
  const url = new URL(phoneHref(model), SITE_URL).toString();
  const lead = products.find((p) => p.photo !== undefined)?.photo;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      siteName: BRAND_NAME,
      title: `${title} · ${BRAND_NAME}`,
      description,
      url,
      ...(lead
        ? {
            images: [
              {
                url: new URL(lead.gallery?.length ? gallerySrc(lead.id, 0, 960) : photoSrc(lead.id, OG_WIDTH), SITE_URL).toString(),
                alt: `${lead.design} ${lead.brand} ${lead.series} cover for ${model.model}`,
              },
            ],
          }
        : {}),
    },
  };
}

function itemListJsonLd(model: PhoneModel, products: readonly HomeProduct[]): string {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${model.model} back covers`,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: new URL(`/products/${p.handle}`, SITE_URL).toString(),
      name: p.title,
    })),
  };
  return JSON.stringify(jsonLd).replace(/</g, '\\u003c');
}

export default async function ModelPage({ params }: ModelPageProps) {
  const { brand, model: slug } = await params;
  const models = await getPhoneModels();
  const model = findModel(models, brand, slug);
  if (!model) notFound();

  const [fits, all] = await Promise.all([getProductsForPhone(model.slug), getAllProducts()]);
  const products = sortForListing(fits);
  const group = findBrand(models, brandSlug(model.brand));
  const siblings = (group?.models ?? []).filter((m) => m.slug !== model.slug);
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi! Do you have back covers for the ${model.brand} ${model.model}?`,
  )}`;
  const from = products.length > 0 ? formatInr(Math.min(...products.map((p) => p.priceFromInr))) : null;

  return (
    <div className={PAGE_SHELL}>
      {products.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: itemListJsonLd(model, products) }} />
      )}

      <ListingHeader
        trail={[
          { name: 'Phones', href: '/phones' },
          { name: model.brand, href: `/phones/${brandSlug(model.brand)}` },
          { name: model.model, href: phoneHref(model) },
        ]}
        title={`Back covers for ${model.model}`}
        intro={
          products.length > 0
            ? `${coversLabel(products.length)} cut for the ${model.brand} ${model.model}, from ${from}. Each one lines up with its camera, buttons and port. Ships in ${DISPATCH_WINDOW}, free over ₹${FREE_SHIPPING_THRESHOLD_INR}, with ${codLine()}.`
            : `We have no covers listed for the ${model.model} right now. Message us and we will check what is in the shop for it.`
        }
        aside={
          <span className="inline-flex items-center gap-2 text-fg">
            <PhoneBrandLogo brand={model.brand} />
            <span className="sr-only">{model.brand}</span>
          </span>
        }
      />

      {products.length > 0 ? (
        <ProductGrid
          products={products}
          label={`Covers for ${model.model}`}
          modelCount={models.length}
          eager
          className="mt-8 lg:mt-10"
        />
      ) : (
        <div className="mt-8 flex flex-col items-start gap-4">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center rounded-[10px] bg-fg px-5 text-sm font-semibold text-paper transition-colors duration-(--dur-micro) hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Ask on WhatsApp
          </a>
          <Link href="/trending" className="text-sm font-semibold text-fg underline underline-offset-4">
            Browse trending covers
          </Link>
        </div>
      )}

      {siblings.length > 0 && (
        <section aria-labelledby="siblings-heading" className="mt-16 border-t border-border pt-8">
          <h2 id="siblings-heading" className="font-sans text-h3 text-fg">
            Other {model.brand} phones
          </h2>
          <ModelLinks models={siblings} counts={coverCounts(all)} layout="compact" className="mt-4" />
        </section>
      )}
    </div>
  );
}
