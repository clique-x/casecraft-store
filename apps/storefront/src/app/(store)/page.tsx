import type { Metadata } from 'next';
import { preload } from 'react-dom';
import { BRAND_NAME, LAUNCH_BRANDS, SITE_URL } from '@/lib/brand';
import { castFor, formatInr, heroChipModels, PHOTOS, photoSrc, srcSetFor } from '@/lib/catalog/photos';
import type { HomeProduct } from '@/lib/medusa/fixtures';
import { getLooks, getNewArrivals, getPhoneModels, getTrending } from '@/lib/medusa/home';
import { Hero } from '@/components/home/hero/Hero';
import { GsapMount } from '@/components/motion/GsapMount.client';
import { HERO_SIZES } from '@/components/home/hero/heroConfig';
import { PhonePickerSection } from '@/components/home/PhonePickerSection';
import { TrustSeam } from '@/components/home/TrustSeam';
import { UpClose } from '@/components/home/UpClose';
import { TrendingRow } from '@/components/home/TrendingRow';
import { HomeCombos, type ComboAccessory, type ComboCover } from '@/components/home/HomeCombos.client';
import type { ProductDetail } from '@/lib/medusa/fixtures';
import { getAccessories, getAllProducts, getGadgets } from '@/lib/medusa/products';
import { GadgetRow } from '@/components/home/GadgetRow';
import { NewArrivalsRow } from '@/components/home/NewArrivalsRow';
import { LookGrid } from '@/components/home/LookGrid';
import { BrandRow } from '@/components/home/BrandRow';
import { WhyUs } from '@/components/home/WhyUs';
import { FinalCta } from '@/components/home/FinalCta';
import { StickyPhoneCta } from '@/components/home/StickyPhoneCta.client';

const FAN_COUNT = 3;
const OG_WIDTH = 960;
const FROM_INR = formatInr(Math.min(...PHOTOS.map((e) => e.priceInr)));

const TITLE = `${BRAND_NAME} · Phone back covers that fit your phone`;
const DESCRIPTION = `Real phone back covers photographed in our shop, from ${FROM_INR}. Pick your phone once, browse only the covers that fit, and pay with UPI, cards or Cash on Delivery.`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: BRAND_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
  },
};

function absolute(path: string): string {
  return new URL(path, SITE_URL).toString();
}

function itemListJsonLd(products: HomeProduct[]): string {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Trending phone back covers',
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.title,
        url: absolute(`/products/${p.handle}`),
        ...(p.photo ? { image: absolute(photoSrc(p.photo.id, OG_WIDTH)) } : {}),
        ...(p.photo ? { brand: { '@type': 'Brand', name: p.photo.brand } } : {}),
        offers: {
          '@type': 'Offer',
          price: p.priceFromInr,
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  };
  return JSON.stringify(jsonLd).replace(/</g, '\\u003c');
}

/** Covers for the combo picker: trending first, then the rest; one soft-case variant per phone. */
function toComboCovers(products: ProductDetail[]): ComboCover[] {
  const rank = (p: ProductDetail) => p.trendingRank ?? 999;
  return [...products]
    .sort((a, b) => rank(a) - rank(b) || Number(Boolean(b.photo)) - Number(Boolean(a.photo)))
    .map((p) => ({
      id: p.id,
      handle: p.handle,
      title: p.title,
      photoId: p.photo?.id ?? null,
      designId: p.designId,
      variants: p.variants
        .filter((v) => v.caseType === 'soft')
        .map(({ id, modelSlug, priceInr, stock }) => ({ id, modelSlug, priceInr, stock })),
    }));
}

export default async function HomePage() {
  const [trending, newArrivals, models, looks, allCovers, accessories, audio] = await Promise.all([
    getTrending(),
    getNewArrivals(),
    getPhoneModels(),
    getLooks(),
    getAllProducts(),
    getAccessories(),
    getGadgets('audio'),
  ]);
  const comboCovers = toComboCovers(allCovers);
  const comboAccessories: ComboAccessory[] = accessories.flatMap((a) =>
    a.accessory
      ? [{ entry: a.accessory, title: a.title, priceInr: a.priceFromInr, variants: a.variants.map(({ id, modelSlug, priceInr, stock }) => ({ id, modelSlug, priceInr, stock })) }]
      : [],
  );

  // The server never reads `my_phone`; HeroStage re-casts from the cookie on the client.
  const cast = castFor(null);
  const chipModels = heroChipModels();
  const front = cast[0];

  if (front) {
    preload(photoSrc(front.id, 480), {
      as: 'image',
      fetchPriority: 'high',
      imageSrcSet: srcSetFor(front),
      imageSizes: HERO_SIZES,
    });
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: itemListJsonLd(trending) }} />
      {/* Only the home page animates with GSAP; other routes never download it. */}
      <GsapMount />
      <Hero cast={cast} models={models} chipModels={chipModels} />
      <PhonePickerSection models={models} />
      <TrustSeam />
      {front && <UpClose initial={front} />}
      <TrendingRow products={trending} />
      <HomeCombos covers={comboCovers} accessories={comboAccessories} />
      <GadgetRow department="audio" products={audio} />
      <NewArrivalsRow products={newArrivals} models={models} />
      <LookGrid looks={looks} />
      <BrandRow brands={[...LAUNCH_BRANDS]} models={models} />
      <WhyUs />
      <FinalCta fan={cast.slice(0, FAN_COUNT)} />
      {/* Mounted with the page so it follows this page's hero, not a stale one. */}
      <StickyPhoneCta models={models} />
    </>
  );
}
