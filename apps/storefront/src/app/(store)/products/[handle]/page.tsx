import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { AccessoryStage } from '@/components/accessory/AccessoryStage.client';
import { GadgetBuyBox } from '@/components/gadget/GadgetBuyBox.client';
import { GadgetStage } from '@/components/gadget/GadgetStage.client';
import { RamBrandGuide } from '@/components/gadget/RamBrandGuide';
import { Breadcrumb } from '@/components/product/Breadcrumb';
import { BundleKits } from '@/components/product/BundleKits.client';
import { BuyBox } from '@/components/product/BuyBox.client';
import { DeliveryFacts } from '@/components/product/DeliveryFacts';
import { MediaColumn, type MediaImage, type MediaLead } from '@/components/product/MediaColumn.client';
import { ProductDetails } from '@/components/product/ProductDetails';
import { ProductJsonLd } from '@/components/product/ProductJsonLd';
import { RelatedRows } from '@/components/product/RelatedRows';
import { StickyBuyBar } from '@/components/product/StickyBuyBar.client';
import { PhotoStage } from '@/components/product/viewer/PhotoStage.client';
import { ProductViewer } from '@/components/product/viewer/ProductViewer.client';
import { ProductReviews } from '@/components/reviews/ProductReviews';
import { BRAND_NAME, SITE_URL, OG_IMAGE } from '@/lib/brand';
import { ACCESSORY_TYPE_LABEL, accessoryPhotoSrc } from '@/lib/catalog/accessories';
import {
  DEPARTMENT_OF,
  GADGET_TYPE_LABEL,
  gadgetGallerySrc,
  gadgetHeroIndex,
} from '@/lib/catalog/gadgets';
import { LOOKS } from '@/lib/catalog/looks';
import { ramBrandOf } from '@/lib/catalog/ram-brands';
import { gallerySrc, photoSrc, srcSetFor, type PhotoEntry, backdropThumbSrc } from '@/lib/catalog/photos';
import type { HomeProduct, ProductDetail } from '@/lib/medusa/fixtures';
import { accessoryMedia, coverMedia, gadgetMedia } from '@/lib/product/media';
import { getPhoneModels } from '@/lib/medusa/home';
import {
  getAccessories,
  getGadgets,
  getAllProducts,
  getMoreForPhoneCandidates,
  getProduct,
  getProductHandles,
  getRelatedByTheme,
  MISSING_PRODUCT_HANDLE,
} from '@/lib/medusa/products';

interface ProductPageProps {
  params: Promise<{ handle: string }>;
}

const OG_WIDTH = 960;
const RELATED_LIMIT = 6;

// `dynamicParams` is rejected by the build under cacheComponents (see the Next 16 migration guide).
// The sentinel handle prerenders the 404 once; src/proxy.ts rewrites unknown handles to it.
export async function generateStaticParams(): Promise<{ handle: string }[]> {
  const handles = await getProductHandles();
  return [...handles, MISSING_PRODUCT_HANDLE].map((handle) => ({ handle }));
}

function ogImageFor(photo: PhotoEntry): { url: string; width: number; height: number; alt: string } {
  const alt = `${photo.design} ${photo.brand} ${photo.series} cover for ${photo.modelLabel}`;
  // The first gallery image has a backdrop; a transparent cutout previews on black in most apps.
  if (photo.gallery && photo.gallery.length > 0) {
    return { url: new URL(gallerySrc(photo.id, 0, 960), SITE_URL).toString(), width: 960, height: 960, alt };
  }
  const width = Math.min(OG_WIDTH, photo.imageW);
  const height = Math.round((photo.imageH * width) / photo.imageW);
  return {
    url: new URL(photoSrc(photo.id, OG_WIDTH), SITE_URL).toString(),
    width,
    height,
    alt: `${photo.design} ${photo.brand} ${photo.series} cover for ${photo.modelLabel}`,
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return { title: 'Cover not found', robots: { index: false, follow: true } };

  const photo = product.photo;
  const gadget = product.gadget;
  const accessory = product.accessory;
  const title = photo
    ? `${photo.title} · ${photo.modelLabel} back cover`
    : gadget
      ? `${product.title} · ${GADGET_TYPE_LABEL[gadget.type]}`
      : accessory
        ? `${product.title} · ${ACCESSORY_TYPE_LABEL[accessory.type]}`
        : `${product.title} phone back cover`;
  const url = new URL(`/products/${product.handle}`, SITE_URL).toString();
  const gadgetImage = gadget?.photos
    ? {
        url: new URL(gadgetGallerySrc(gadget.photos, gadgetHeroIndex(gadget.photos, gadget.options[0]?.slug), 960), SITE_URL).toString(),
        width: 960,
        height: 960,
        alt: `${product.title}, ${gadget.options[0]?.name ?? ''}`.replace(/, $/, ''),
      }
    : accessory?.photos && accessory.photos.gallery.length > 0
      ? {
          url: new URL(accessoryPhotoSrc(accessory.id, 0, 960), SITE_URL).toString(),
          width: 960,
          height: 960,
          alt: `${product.title}: ${accessory.photos.gallery[0]}`,
        }
      : null;
  return {
    title,
    description: product.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      siteName: BRAND_NAME,
      title: `${title} · ${BRAND_NAME}`,
      description: product.description,
      url,
      ...(photo ? { images: [ogImageFor(photo)] } : gadgetImage ? { images: [gadgetImage] } : { images: [OG_IMAGE] }),
    },
  };
}

/** Same look, other photographed covers; trending first. Procedural designs keep the theme query. */
async function relatedByLook(product: ProductDetail): Promise<HomeProduct[]> {
  const photo = product.photo;
  if (!photo) return [];
  const look = LOOKS.find((l) => l.handle === photo.look);
  return (await getAllProducts()).filter(
    (p) => p.id !== product.id && p.photo !== undefined && (look ? look.match(p.photo) : p.photo.look === photo.look),
  )
    .sort((a, b) => (a.trendingRank ?? 99) - (b.trendingRank ?? 99))
    .slice(0, RELATED_LIMIT);
}

// The params read happens inside Suspense so the route keeps a static shell; see the Next 16
// caching guide ("Maximizing the static shell"). Listed handles still prerender in full.
export default function ProductPage({ params }: ProductPageProps) {
  return (
    <Suspense fallback={<ProductPageFallback />}>
      <ProductPageContent params={params} />
    </Suspense>
  );
}

function ProductPageFallback() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading cover"
      className="mx-auto w-full max-w-7xl px-4 pt-20 pb-10 sm:px-6 lg:px-8 lg:pt-24 lg:pb-16"
    >
      <div className="h-4 w-48 rounded-pill bg-surface-2" />
      <div className="mt-4 grid grid-cols-1 gap-8 lg:mt-6 lg:grid-cols-12 lg:items-start lg:gap-10">
        <div className="stage-glow aspect-[4/5] max-h-[60svh] w-full rounded-card bg-ink lg:col-span-7 lg:aspect-[7/8] lg:max-h-none" />
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-5">
          <div className="h-4 w-24 rounded-pill bg-surface-2" />
          <div className="h-10 w-3/4 rounded-pill bg-surface-2" />
          <div className="h-6 w-28 rounded-pill bg-surface-2" />
          <div className="mt-4 h-24 rounded-card bg-surface-2" />
          <div className="h-24 rounded-card bg-surface-2" />
          <div className="mt-4 h-12 rounded-pill bg-surface-2" />
        </div>
      </div>
    </div>
  );
}

/** Must match PhotoStage's own `sizes`, so the preload is the image it shows. */
const PHOTO_STAGE_SIZES = '(min-width: 64rem) 560px, 90vw';

/** The image column for a photographed cover or a gadget with brand images; null keeps the single stage. */
function mediaFor(product: ProductDetail): {
  images: MediaImage[];
  lead?: MediaLead;
  badge?: string;
  optionIndex?: Readonly<Record<string, number>>;
} | null {
  const photo = product.photo;
  if (photo && (photo.gallery?.length ?? 0) > 0) {
    if (photo.stage === false) return { images: coverMedia(photo) };
    return {
      images: coverMedia(photo),
      lead: {
        // Not `priority`: phones never show it, and desktop fetches it from the column's preload.
        node: <PhotoStage entry={photo} title={product.title} priority={false} className="lg:aspect-square" />,
        label: 'Turn the cover',
        thumbSrc: backdropThumbSrc(photo, 160),
        preload: { src: photoSrc(photo.id, 480), srcSet: srcSetFor(photo), sizes: PHOTO_STAGE_SIZES },
      },
    };
  }
  const gadget = product.gadget;
  const photos = gadget?.photos;
  if (gadget && photos && photos.gallery.length > 0) {
    // The gallery opens on the colours in stock, so picking a colour scrolls to its image instead of a
    // separate stage repeating the first one.
    return {
      images: gadgetMedia(photos, product.title),
      badge: gadget.original ? `Original ${gadget.original.brand}` : undefined,
      optionIndex: photos.heroByOption,
    };
  }
  const accessory = product.accessory;
  if (accessory?.photos && accessory.photos.gallery.length > 0) {
    return { images: accessoryMedia(accessory, product.title) };
  }
  return null;
}

async function ProductPageContent({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) notFound();

  const [models, accessories, related, candidates] = await Promise.all([
    getPhoneModels(),
    getAccessories(),
    product.gadget
      ? getGadgets(DEPARTMENT_OF[product.gadget.type]).then((all) => all.filter((p) => p.id !== product.id))
      : product.accessory
      ? getAccessories().then((all) => all.filter((p) => p.id !== product.id))
      : product.photo
        ? relatedByLook(product)
        : getRelatedByTheme(product, RELATED_LIMIT),
    getMoreForPhoneCandidates(product),
  ]);

  // Products with a gallery scroll every image down the left column; the buy column stays put.
  const media = mediaFor(product);

  const buyColumn = (
    <>
      {product.gadget ? (
        <GadgetBuyBox product={product} />
      ) : (
        <BuyBox product={product} models={models} accessories={product.accessory ? [] : accessories} />
      )}
      <DeliveryFacts gadget={product.gadget} />
      <ProductDetails product={product} />
    </>
  );

  return (
    <>
      <ProductJsonLd product={product} />

      <div className="mx-auto w-full max-w-7xl px-4 pt-20 pb-10 sm:px-6 lg:px-8 lg:pt-24 lg:pb-16">
        <Breadcrumb product={product} />

        <div className="mt-4 grid grid-cols-1 gap-8 lg:mt-6 lg:grid-cols-12 lg:items-start lg:gap-10">
          <div className="min-w-0 lg:col-span-7">
            {media ? (
              <MediaColumn
                title={product.title}
                images={media.images}
                lead={media.lead}
                badge={media.badge}
                optionIndex={media.optionIndex}
              />
            ) : (
              <div className="lg:sticky lg:top-20">
                {product.gadget ? (
                  <GadgetStage gadget={product.gadget} title={product.title} />
                ) : product.accessory ? (
                  <AccessoryStage accessory={product.accessory} models={models} title={product.title} />
                ) : product.photo ? (
                  // Rendered here rather than through ProductViewer so photo pages never ship the procedural viewer.
                  <PhotoStage entry={product.photo} title={product.title} />
                ) : (
                  <ProductViewer product={product} models={models} />
                )}
              </div>
            )}
          </div>

          {media ? (
            // Pinned under the header until the image column runs out; when its buttons sit below the
            // fold, StickyBuyBar offers Add to cart and Buy now instead.
            <div className="flex min-w-0 flex-col gap-8 lg:sticky lg:top-20 lg:col-span-5 lg:self-start">{buyColumn}</div>
          ) : (
            <div className="flex min-w-0 flex-col gap-8 lg:col-span-5">{buyColumn}</div>
          )}
        </div>

        {product.gadget?.type === 'ram' && <RamBrandGuide brand={ramBrandOf(product.gadget.specs)} className="mt-10 lg:mt-14" />}

        {/* Full width under both columns, so it never lengthens the pinned buy column. */}
        <ProductReviews product={product} className="mt-10 lg:mt-14" />
      </div>

      {/* Below the fold: skipped by layout and paint, and their lazy images wait, until scrolled near. */}
      {!product.accessory && !product.gadget && (
        <div className="cv-auto">
          <BundleKits product={product} accessories={accessories} models={models} />
        </div>
      )}

      <div className="cv-auto [contain-intrinsic-size:auto_1100px]">
        <RelatedRows product={product} related={related} candidates={product.gadget ? [] : candidates} models={models} />
      </div>

      <StickyBuyBar
        product={product}
        models={models}
        accessories={product.accessory || product.gadget ? [] : accessories}
      />
    </>
  );
}
