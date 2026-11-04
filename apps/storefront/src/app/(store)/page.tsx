import type { Metadata } from 'next';
import { BRAND_NAME, SITE_URL } from '@/lib/brand';
import { formatInr, gallerySrc, PHOTOS } from '@/lib/catalog/photos';
import type { HomeProduct, ProductDetail } from '@/lib/medusa/fixtures';
import { getLooks, getNewArrivals, getPhoneModels, getTrending } from '@/lib/medusa/home';
import { getAccessories, getAllProducts, getGadgets } from '@/lib/medusa/products';
import { ShowcaseHero } from '@/components/home/showcase/ShowcaseHero.client';
import { ServiceStrip } from '@/components/home/showcase/ServiceStrip';
import { CategoryTiles } from '@/components/home/showcase/CategoryTiles';
import { TrendingHub } from '@/components/home/hub/TrendingHub';
import { AudioSpotlight } from '@/components/home/hub/AudioSpotlight';
import { CoversSection } from '@/components/home/hub/CoversSection';
import { BrandsWall, type LogoBrand } from '@/components/home/hub/BrandsWall';
import { HubFinalCta } from '@/components/home/hub/HubFinalCta';
import { LookGrid } from '@/components/home/LookGrid';
import { NewArrivalsRow } from '@/components/home/NewArrivalsRow';
import { HomeCombos, type ComboAccessory, type ComboCover } from '@/components/home/HomeCombos.client';
import { WhyUs } from '@/components/home/WhyUs';

const COVER_FROM = Math.min(...PHOTOS.map((e) => e.priceInr));

const TITLE = `${BRAND_NAME} · Phone covers, earbuds, neckbands and screen protection`;
const DESCRIPTION = `Covers cut for your exact phone from ${formatInr(COVER_FROM)}, sealed boAt and realme earbuds and neckbands with the brand warranty, and screen protection. UPI, cards or Cash on Delivery across India.`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: { type: 'website', locale: 'en_IN', siteName: BRAND_NAME, title: TITLE, description: DESCRIPTION, url: SITE_URL },
};

/** Audio picked for the spotlight and the trending mix, in this order when they exist. */
const AUDIO_PICKS = ['boat-800-hidef', 'realme-air-7', 'boat-alpha-gen2', 'realme-t310', 'boat-rockerz-110', 'boat-219'];
const FEATURE_AUDIO = 'realme-air-7';

function absolute(path: string): string {
  return new URL(path, SITE_URL).toString();
}

function itemListJsonLd(products: HomeProduct[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Trending at the hub',
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.title,
        url: absolute(`/products/${p.handle}`),
        ...(p.photo ? { image: absolute(gallerySrc(p.photo.id, 0, 960)), brand: { '@type': 'Brand', name: p.photo.brand } } : {}),
        ...(p.gadget?.original ? { brand: { '@type': 'Brand', name: p.gadget.original.brand } } : {}),
        offers: { '@type': 'Offer', price: p.priceFromInr, priceCurrency: 'INR', availability: 'https://schema.org/InStock' },
      },
    })),
  }).replace(/</g, '\\u003c');
}

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
      variants: p.variants.filter((v) => v.caseType === 'soft').map(({ id, modelSlug, priceInr, stock }) => ({ id, modelSlug, priceInr, stock })),
    }));
}

/** Two lists woven together: a, b, a, b … */
function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
}

function byPicks(products: ProductDetail[]): ProductDetail[] {
  const pos = (p: ProductDetail) => {
    const i = AUDIO_PICKS.indexOf(p.gadget?.id ?? '');
    return i === -1 ? 99 : i;
  };
  return [...products].sort((a, b) => pos(a) - pos(b));
}

/** Four audio products for the spotlight grid that are not already in the trending mix or the feature. */
function audioPicks(audio: ProductDetail[], shown: HomeProduct[], featureId: string): ProductDetail[] {
  const seen = new Set([...shown.map((p) => p.id), featureId]);
  const fresh = audio.filter((p) => !seen.has(p.id));
  return (fresh.length >= 4 ? fresh : [...fresh, ...audio.filter((p) => p.id !== featureId && !fresh.includes(p))]).slice(0, 4);
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

  const audioWithPhotos = byPicks(audio.filter((p) => p.gadget?.photos));
  const featureProduct = audioWithPhotos.find((p) => p.gadget?.id === FEATURE_AUDIO) ?? audioWithPhotos[0];

  const coverPhones = new Set(PHOTOS.flatMap((e) => e.modelSlugs));
  const phoneBrands = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi'].filter((b) =>
    models.some((m) => m.brand === b && coverPhones.has(m.slug)),
  );

  const trendingMix = interleave(trending.slice(0, 5), audioWithPhotos.slice(0, 5));
  const audioBrands = [...new Set(audio.flatMap((p) => (p.gadget?.original ? [p.gadget.original.brand] : [])))];
  const brandLogos: LogoBrand[] = [
    ...(audioBrands.includes('boAt') ? [{ name: 'boAt', href: '/audio', tag: 'Audio', logo: { src: '/brand/partners/boat.svg', width: 152, height: 62 } }] : []),
    ...(audioBrands.includes('realme') ? [{ name: 'realme', href: '/audio#earbuds', tag: 'Audio', logo: { phoneBrand: 'Realme' } }] : []),
    ...phoneBrands.map((b) => ({ name: b, href: `/phones/${b.toLowerCase()}`, tag: 'Covers', logo: { phoneBrand: b } })),
  ];

  const comboCovers = toComboCovers(allCovers);
  const comboAccessories: ComboAccessory[] = accessories.flatMap((a) =>
    a.accessory
      ? [{ entry: a.accessory, title: a.title, priceInr: a.priceFromInr, variants: a.variants.map(({ id, modelSlug, priceInr, stock }) => ({ id, modelSlug, priceInr, stock })) }]
      : [],
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: itemListJsonLd(trendingMix) }} />
      {/* Header, hero, service strip and category tiles: the storefront's opening screens. */}
      <ShowcaseHero />
      <ServiceStrip />
      <CategoryTiles />
      <TrendingHub products={trendingMix} />
      {featureProduct?.gadget && (
        <AudioSpotlight
          feature={featureProduct.gadget}
          featureHandle={featureProduct.handle}
          products={audioPicks(audioWithPhotos, trendingMix, featureProduct.id)}
          total={audio.length}
          brands={audioBrands}
        />
      )}
      <CoversSection models={models} covers={PHOTOS.length} />
      <LookGrid looks={looks} />
      <NewArrivalsRow products={newArrivals} models={models} />
      <HomeCombos covers={comboCovers} accessories={comboAccessories} />
      <BrandsWall brands={brandLogos} />
      <WhyUs />
      <HubFinalCta />
    </>
  );
}
