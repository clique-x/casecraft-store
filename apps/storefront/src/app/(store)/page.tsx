import type { Metadata } from 'next';
import { BRAND_NAME, OG_IMAGE, SITE_URL } from '@/lib/brand';
import { formatInr, PHOTOS } from '@/lib/catalog/photos';
import type { HomeProduct, ProductDetail } from '@/lib/medusa/fixtures';
import { itemListJsonLd, storeJsonLd } from '@/lib/seo/structured-data';
import { getNewArrivals, getPhoneModels, getTrending } from '@/lib/medusa/home';
import { getAccessories, getAllProducts, getGadgets } from '@/lib/medusa/products';
import { HomeCombos, type ComboAccessory, type ComboCover } from '@/components/home/HomeCombos.client';
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
import { DepartmentExplorer, type ExploreDepartment } from '@/components/home/DepartmentExplorer.client';
import { GadgetRow } from '@/components/home/GadgetRow';
import { HomeDuo, type DuoFeature } from '@/components/home/HomeDuo';
import { ProtectionRow } from '@/components/home/ProtectionRow';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';
import {
  DEPARTMENTS,
  gadgetCutSrc,
  gadgetCutSrcSet,
  gadgetGallerySrc,
  gadgetGallerySrcSet,
  gadgetHeroIndex,
  type Department,
  type GadgetEntry,
  type GadgetType,
} from '@/lib/catalog/gadgets';

const COVER_FROM = Math.min(...PHOTOS.map((e) => e.priceInr));

// ≤60 and ≤150 characters, so search results show them whole.
const TITLE = `Phone Covers, Earbuds & Memory Cards Online – ${BRAND_NAME}`;
const DESCRIPTION = `Phone covers from ${formatInr(COVER_FROM)}, sealed boAt & realme audio, SanDisk & Samsung storage. COD, UPI & cards. Free shipping over ₹499 across India.`;

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

/** Photographed covers for the combo picker, trending first, with one variant per phone. */
function comboCovers(products: ProductDetail[]): ComboCover[] {
  const rank = (p: ProductDetail) => p.trendingRank ?? 999;
  return products
    .filter((p): p is ProductDetail & { photo: NonNullable<ProductDetail['photo']> } => p.photo !== undefined)
    .sort((a, b) => rank(a) - rank(b))
    .map((p) => ({
      id: p.id,
      handle: p.handle,
      title: p.title,
      photoId: p.photo.id,
      variants: p.variants.map(({ id, modelSlug, priceInr, stock }) => ({ id, modelSlug, priceInr, stock })),
    }));
}

/** The screen glass and back films, with their variants per phone, for the combo picker. */
function comboAccessories(products: ProductDetail[]): ComboAccessory[] {
  return products.flatMap((p) =>
    p.accessory
      ? [{ entry: p.accessory, title: p.title, variants: p.variants.map(({ id, modelSlug, priceInr, stock }) => ({ id, modelSlug, priceInr, stock })) }]
      : [],
  );
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

/** How many products take turns in the audio spotlight. */
const FEATURE_TURNS = 6;

/**
 * The audio spotlight's featured products: the feature first, then the other audio products that have a
 * transparent cutout, which is what lets them change places on the same light panel.
 */
function audioFeatures(audio: ProductDetail[], feature: ProductDetail): { gadget: GadgetEntry; handle: string }[] {
  const rest = audio.filter((p) => p.id !== feature.id && p.gadget?.photos?.cut);
  return [feature, ...rest].slice(0, FEATURE_TURNS).flatMap((p) => (p.gadget ? [{ gadget: p.gadget, handle: p.handle }] : []));
}

/** Four audio products for the spotlight grid that are not already in the trending mix or the feature. */
function audioPicks(audio: ProductDetail[], shown: HomeProduct[], featureId: string): ProductDetail[] {
  const seen = new Set([...shown.map((p) => p.id), featureId]);
  const fresh = audio.filter((p) => !seen.has(p.id));
  return (fresh.length >= 4 ? fresh : [...fresh, ...audio.filter((p) => p.id !== featureId && !fresh.includes(p))]).slice(0, 4);
}

/**
 * "More to explore": the departments in shop order, each with its ranges. `pick` is the product whose photo
 * stands for a range, chosen because that photo is sharp at panel size (some first photos are a soft shot of a
 * pack or a label); without one, the first product with a photo is used.
 */
const EXPLORE: readonly {
  department: Department;
  blurb: string;
  ranges: readonly { label: string; href: string; types: readonly GadgetType[]; pick?: string }[];
}[] = [
  {
    department: 'audio',
    blurb: 'boAt and realme, sealed in the box with the brand warranty.',
    ranges: [
      { label: 'Earbuds', href: '/audio#earbuds', types: ['earbuds'], pick: 'boat-alpha-gen2' },
      { label: 'Neckbands', href: '/audio#neckband', types: ['neckband'], pick: 'boat-rockerz-110' },
      { label: 'Speakers', href: '/audio#speakers', types: ['speaker'], pick: 'boat-stone-arc-pro' },
      { label: 'Soundbars', href: '/audio#soundbars', types: ['soundbar'], pick: 'boat-aavante-2-150' },
    ],
  },
  {
    department: 'storage',
    blurb: 'SanDisk, Samsung and WD, in the capacity you need.',
    ranges: [
      { label: 'Memory cards', href: '/storage#cards', types: ['memory-card'], pick: 'sandisk-extreme-microsd' },
      { label: 'Pen drives', href: '/storage#cards', types: ['pen-drive'], pick: 'sandisk-ultra-flair' },
      { label: 'SSDs', href: '/storage#ssd', types: ['ssd'], pick: 'wd-black-sn7100' },
      { label: 'RAM', href: '/storage#ram', types: ['ram'], pick: 'samsung-ram-desktop-ddr4' },
    ],
  },
  {
    department: 'charging',
    blurb: 'Fast chargers and data cables for iPhone and Galaxy.',
    ranges: [
      { label: 'Chargers', href: '/charging#chargers', types: ['charger', 'car-charger'], pick: 'samsung-25w-adapter' },
      { label: 'Data cables', href: '/charging#cables', types: ['cable'], pick: 'apple-60w-usb-c-cable' },
    ],
  },
  {
    department: 'cameras',
    blurb: 'CP Plus cameras that turn, see in the dark and let you talk back.',
    ranges: [{ label: 'Wi-Fi cameras', href: '/cameras', types: ['camera'] }],
  },
  {
    department: 'laptops',
    blurb: 'Refurbished Dell Latitudes with a 6-month shop warranty.',
    ranges: [{ label: 'Dell Latitude', href: '/laptops', types: ['laptop'], pick: 'dell-latitude-7490' }],
  },
  {
    department: 'computer',
    blurb: 'Ant Esports and Honeywell, for the desk.',
    ranges: [
      { label: 'Mice & keyboards', href: '/computer-accessories', types: ['mouse', 'keyboard'], pick: 'ant-esports-km1410' },
      { label: 'USB hubs', href: '/computer-accessories#hubs', types: ['hub'] },
    ],
  },
];

/** Each department with the ranges that have stock: the range's cheapest price and one product's photo. */
function exploreDepartments(gadgets: ProductDetail[]): ExploreDepartment[] {
  return EXPLORE.flatMap(({ department, blurb, ranges }) => {
    const found = ranges.flatMap((c) => {
      const items = gadgets.filter((p) => p.gadget && c.types.includes(p.gadget.type));
      const lead = items.find((p) => p.gadget?.id === c.pick && p.gadget?.photos) ?? items.find((p) => p.gadget?.photos);
      const g = lead?.gadget;
      if (!g?.photos) return [];
      // The square gallery photo, not the 4:5 card crop, so nothing is cut off in the square frame.
      const n = gadgetHeroIndex(g.photos, g.options[0]?.slug);
      const cutout = Boolean(g.photos.cut);
      return [
        {
          label: c.label,
          href: c.href,
          image: cutout ? gadgetCutSrc(g.photos, 480) : gadgetGallerySrc(g.photos, n, 480),
          imageSet: cutout ? gadgetCutSrcSet(g.photos) : gadgetGallerySrcSet(g.photos, n),
          alt: g.title,
          cutout,
          fromInr: Math.min(...items.map((p) => p.priceFromInr)),
        },
      ];
    });
    const info = DEPARTMENTS[department];
    return found.length > 0 ? [{ key: department, name: info.name, href: info.path, blurb, ranges: found }] : [];
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
  const [trending, newArrivals, models, accessories, audio, storage, cameras, charging, computer, laptops, allCovers] = await Promise.all([
    getTrending(),
    getNewArrivals(),
    getPhoneModels(),
    getAccessories(),
    getGadgets('audio'),
    getGadgets('storage'),
    getGadgets('cameras'),
    getGadgets('charging'),
    getGadgets('computer'),
    getGadgets('laptops'),
    getAllProducts(),
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: storeJsonLd() }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: itemListJsonLd('Trending at the hub', trendingMix) }} />
      {/* First visit in a tab session: the brand intro, over the hero it hands off to. */}
      <BrandIntro />
      {/* Once per session, no phone picked yet: a pointer to the header's device picker. */}
      <DeviceHint />
      {/* Header, hero, service strip and category tiles: the storefront's opening screens. */}
      <ShowcaseHero />
      <ServiceStrip />
      <CategoryTiles rail={<DepartmentExplorer departments={exploreDepartments([...audio, ...charging, ...storage, ...cameras, ...laptops, ...computer])} />} />
      <TrendingHub products={trendingMix} />
      {featureProduct?.gadget && (
        <AudioSpotlight
          features={audioFeatures(audioWithPhotos, featureProduct)}
          products={audioPicks(audioWithPhotos, trendingMix, featureProduct.id)}
          total={audio.length}
          brands={audioBrands}
        />
      )}
      {/* Campaign images: audio right after the audio picks, covers right before the covers opener. */}
      <PromoStage />
      <CoversSection models={models} covers={PHOTOS.length} />
      <NewArrivalsRow products={newArrivals} models={models} />
      {/* Cover + screen glass + back film for the visitor's phone, at bundle price. */}
      <HomeCombos covers={comboCovers(allCovers)} accessories={comboAccessories(accessories)} />
      {/* The other departments: storage, then cameras and speakers, then protection. */}
      <GadgetRow department="storage" products={storage} />
      <GadgetRow department="charging" products={charging} />
      <GadgetRow department="laptops" products={laptops} />
      <GadgetRow department="computer" products={computer} />
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
