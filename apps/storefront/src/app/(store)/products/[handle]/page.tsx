import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { AccessoryStage } from '@/components/accessory/AccessoryStage.client';
import { GadgetBuyBox } from '@/components/gadget/GadgetBuyBox.client';
import { GadgetGallery } from '@/components/gadget/GadgetGallery';
import { GadgetStage } from '@/components/gadget/GadgetStage.client';
import { Breadcrumb } from '@/components/product/Breadcrumb';
import { BundleKits } from '@/components/product/BundleKits.client';
import { BuyBox } from '@/components/product/BuyBox.client';
import { DeliveryFacts } from '@/components/product/DeliveryFacts';
import { PhotoGallery } from '@/components/product/PhotoGallery';
import { ProductDetails } from '@/components/product/ProductDetails';
import { ProductJsonLd } from '@/components/product/ProductJsonLd';
import { RelatedRows } from '@/components/product/RelatedRows';
import { StickyBuyBar } from '@/components/product/StickyBuyBar.client';
import { PhotoStage } from '@/components/product/viewer/PhotoStage.client';
import { ProductViewer } from '@/components/product/viewer/ProductViewer.client';
import { BRAND_NAME, SITE_URL } from '@/lib/brand';
import { DEPARTMENT_OF, GADGET_TYPE_LABEL, gadgetGallerySrc, gadgetHeroIndex } from '@/lib/catalog/gadgets';
import { LOOKS } from '@/lib/catalog/looks';
import { gallerySrc, photoSrc, type PhotoEntry } from '@/lib/catalog/photos';
import type { HomeProduct, ProductDetail } from '@/lib/medusa/fixtures';
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
  const title = photo
    ? `${photo.title} · ${photo.modelLabel} back cover`
    : gadget
      ? `${product.title} · ${GADGET_TYPE_LABEL[gadget.type]}`
      : `${product.title} phone back cover`;
  const url = new URL(`/products/${product.handle}`, SITE_URL).toString();
  const gadgetImage = gadget?.photos
    ? {
        url: new URL(gadgetGallerySrc(gadget.photos, gadgetHeroIndex(gadget.photos, gadget.options[0]?.slug), 960), SITE_URL).toString(),
        width: 960,
        height: 960,
        alt: `${product.title}, ${gadget.options[0]?.name ?? ''}`.replace(/, $/, ''),
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
      ...(photo ? { images: [ogImageFor(photo)] } : gadgetImage ? { images: [gadgetImage] } : {}),
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
      <div className="mt-4 grid gap-8 lg:mt-6 lg:grid-cols-12 lg:items-start lg:gap-10">
        <div className="stage-glow aspect-[4/5] max-h-[60svh] w-full rounded-card bg-ink lg:col-span-7 lg:aspect-[7/8] lg:max-h-none" />
        <div className="flex flex-col gap-4 lg:col-span-5">
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

  return (
    <>
      <ProductJsonLd product={product} />

      <div className="mx-auto w-full max-w-7xl px-4 pt-20 pb-10 sm:px-6 lg:px-8 lg:pt-24 lg:pb-16">
        <Breadcrumb product={product} />

        <div className="mt-4 grid gap-8 lg:mt-6 lg:grid-cols-12 lg:items-start lg:gap-10">
          <div className="lg:col-span-7">
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
          </div>

          <div className="flex flex-col gap-8 lg:col-span-5">
            {product.gadget ? (
              <GadgetBuyBox product={product} />
            ) : (
              <BuyBox product={product} models={models} accessories={product.accessory ? [] : accessories} />
            )}
            <DeliveryFacts gadget={product.gadget} />
            <ProductDetails product={product} />
          </div>
        </div>
      </div>

      {product.photo && <PhotoGallery entry={product.photo} />}
      {product.gadget && <GadgetGallery gadget={product.gadget} title={product.title} />}

      {!product.accessory && !product.gadget && <BundleKits product={product} accessories={accessories} models={models} />}

      <RelatedRows product={product} related={related} candidates={product.gadget ? [] : candidates} models={models} />

      <StickyBuyBar product={product} models={models} accessories={product.accessory || product.gadget ? [] : accessories} />
    </>
  );
}
