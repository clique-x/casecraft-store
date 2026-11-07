import type { Metadata } from 'next';
import { BRAND_NAME, OG_IMAGE, SITE_URL } from '@/lib/brand';
import { formatInr, gallerySrc, PHOTOS } from '@/lib/catalog/photos';
import type { HomeProduct, ProductDetail } from '@/lib/medusa/fixtures';
import { getNewArrivals, getPhoneModels, getTrending } from '@/lib/medusa/home';
import { getAccessories, getGadgets } from '@/lib/medusa/products';
import { BrandIntro } from '@/components/intro/BrandIntro.client';
import { DeviceHint } from '@/components/home/device-hint/DeviceHint.client';
import { ShowcaseHero } from '@/components/home/showcase/ShowcaseHero.client';
import { ServiceStrip } from '@/components/home/showcase/ServiceStrip';
import { CategoryTiles } from '@/components/home/showcase/CategoryTiles';
import { TrendingHub } from '@/components/home/hub/TrendingHub';
import { AudioSpotlight } from '@/components/home/hub/AudioSpotlight';
import { CoversSection } from '@/components/home/hub/CoversSection';
import { BrandsWall, type LogoBrand } from '@/components/home/hub/BrandsWall';
import { HubFinalCta } from '@/components/home/hub/HubFinalCta';
import { NewArrivalsRow } from '@/components/home/NewArrivalsRow';
import { WhyUs } from '@/components/home/WhyUs';
import { PromoStage } from '@/components/home/promo-stage/PromoStage.client';
import { CategoryRail, type RailCategory } from '@/components/home/CategoryRail';
import { GadgetRow } from '@/components/home/GadgetRow';
import { HomeDuo, type DuoFeature } from '@/components/home/HomeDuo';
import { ProtectionRow } from '@/components/home/ProtectionRow';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';
import { gadgetCutSrc, gadgetGallerySrc, gadgetHeroIndex, type GadgetType } from '@/lib/catalog/gadgets';

const COVER_FROM = Math.min(...PHOTOS.map((e) => e.priceInr));

const TITLE = `${BRAND_NAME} · Phone covers, audio, storage, cameras and screen protection`;
const DESCRIPTION = `Covers cut for your exact phone from ${formatInr(COVER_FROM)}, sealed boAt and realme earbuds, neckbands and speakers, SanDisk, Samsung, WD and Consistent memory cards and SSDs, RAM, CP Plus Wi-Fi cameras and screen protection. UPI, cards or Cash on Delivery across India.`;

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
    // Wide first: chat apps and social sites use the first image.
    images: [OG_IMAGE, { ...OG_IMAGE, url: '/promo/og-brand-hero-1200x1200.jpg', height: 1200 }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG_IMAGE] },
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

/** One rail card per range, in shop order: each with its cheapest price and a photo of one of its products. */
const RAIL: readonly { label: string; href: string; types: readonly GadgetType[]; pick?: string }[] = [
  { label: 'Earbuds', href: '/audio#earbuds', types: ['earbuds'], pick: 'boat-alpha-gen2' },
  { label: 'Neckbands', href: '/audio#neckband', types: ['neckband'], pick: 'boat-rockerz-110' },
  { label: 'Speakers', href: '/audio#speakers', types: ['speaker'], pick: 'boat-stone-arc-pro' },
  { label: 'Memory cards', href: '/storage#cards', types: ['memory-card'], pick: 'sandisk-extreme-microsd' },
  { label: 'Pen drives', href: '/storage#cards', types: ['pen-drive'], pick: 'sandisk-cruzer-blade' },
  { label: 'SSDs', href: '/storage#ssd', types: ['ssd'], pick: 'wd-black-sn7100' },
  { label: 'RAM', href: '/storage#ram', types: ['ram'], pick: 'sk-hynix-ram-laptop-ddr4' },
  { label: 'Wi-Fi cameras', href: '/cameras', types: ['camera'] },
];

function railCategories(gadgets: ProductDetail[]): RailCategory[] {
  return RAIL.flatMap((c) => {
    const items = gadgets.filter((p) => p.gadget && c.types.includes(p.gadget.type));
    const lead = items.find((p) => p.gadget?.id === c.pick && p.gadget?.photos) ?? items.find((p) => p.gadget?.photos);
    const g = lead?.gadget;
    if (!g?.photos) return [];
    // The square gallery photo, not the 4:5 card crop, so nothing is cut off in the square tile.
    const image = g.photos.cut ? gadgetCutSrc(g.photos, 480) : gadgetGallerySrc(g.photos, gadgetHeroIndex(g.photos, g.options[0]?.slug), 480);
    return [{ label: c.label, href: c.href, image, cutout: Boolean(g.photos.cut), fromInr: Math.min(...items.map((p) => p.priceFromInr)) }];
  });
}

/** Cameras and speakers, side by side; each half only when the department has stock. */
function duoFeatures(cameras: ProductDetail[], audio: ProductDetail[]): DuoFeature[] {
  const speakers = audio.filter((p) => p.gadget?.type === 'speaker');
  const camera = cameras.find((p) => p.gadget?.photos);
  // The upright Arc Pro fills the tall photo slot; the wide 1200 Pro would be cropped.
  const speaker = speakers.find((p) => p.gadget?.id === 'boat-stone-arc-pro' && p.gadget?.photos) ?? speakers.find((p) => p.gadget?.photos);
  const out: DuoFeature[] = [];
  if (camera?.gadget) {
    out.push({
      eyebrow: 'Wi-Fi cameras',
      heading: 'Keep an eye on home and shop',
      sub: 'CP Plus ezyKam+ cameras turn 355°, see in the dark and let you talk back, all from your phone.',
      points: ['2, 3 or 4 MP, pick yours on the page', '15 m night vision and motion tracking', 'Two-way talk, Alexa and Google Home'],
      fromInr: Math.min(...cameras.map((p) => p.priceFromInr)),
      href: '/cameras',
      cta: 'Shop cameras',
      gadget: camera.gadget,
      productHref: `/products/${camera.handle}`,
      productLabel: 'See the camera',
    });
  }
  if (speaker?.gadget) {
    out.push({
      eyebrow: 'Bluetooth speakers',
      heading: 'boAt speakers, made to be loud',
      sub: 'The 60 W Stone 1200 Pro and the RGB-lit Stone Arc Pro, sealed in the boAt box.',
      points: ['Up to 60 W with TWS pairing', 'Up to 12 h of playback', 'Splash-proof, IPX5 and IPX6'],
      fromInr: Math.min(...speakers.map((p) => p.priceFromInr)),
      href: '/audio#speakers',
      cta: 'Shop speakers',
      gadget: speaker.gadget,
      productHref: `/products/${speaker.handle}`,
      productLabel: `See the ${speaker.gadget.title.replace(/^boAt /, '')}`,
    });
  }
  return out;
}

export default async function HomePage() {
  const [trending, newArrivals, models, accessories, audio, storage, cameras] = await Promise.all([
    getTrending(),
    getNewArrivals(),
    getPhoneModels(),
    getAccessories(),
    getGadgets('audio'),
    getGadgets('storage'),
    getGadgets('cameras'),
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


  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: itemListJsonLd(trendingMix) }} />
      {/* First visit in a tab session: the brand intro, over the hero it hands off to. */}
      <BrandIntro />
      {/* Once per session, no phone picked yet: a pointer to the header's device picker. */}
      <DeviceHint />
      {/* Header, hero, service strip and category tiles: the storefront's opening screens. */}
      <ShowcaseHero />
      <ServiceStrip />
      <CategoryTiles rail={<CategoryRail categories={railCategories([...audio, ...storage, ...cameras])} />} />
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
      {/* Campaign images: audio right after the audio picks, covers right before the covers opener. */}
      <PromoStage />
      <CoversSection models={models} covers={PHOTOS.length} />
      <NewArrivalsRow products={newArrivals} models={models} />
      {/* The other departments: storage, then cameras and speakers, then protection. */}
      <GadgetRow department="storage" products={storage} />
      <HomeDuo features={duoFeatures(cameras, audio)} />
      <ProtectionRow products={accessories} />
      {/* Real customer reviews only; until there are some, an invitation to write one. */}
      <ReviewsSection />
      <BrandsWall brands={brandLogos} />
      <WhyUs />
      <HubFinalCta />
    </>
  );
}
