/**
 * Schema.org JSON-LD for Google: products (product pages and the homepage list) and the store itself (homepage).
 * Every value comes from the shop's own data and policies, so the markup says what the pages say:
 * - shipping: free from FREE_SHIPPING_THRESHOLD_INR, SHIPPING_FEE_INR below it; dispatch within DISPATCH_WINDOW
 *   (ORDER_IN_WINDOW for sizes the shop orders in), then 3–7 working days with the courier (/pages/shipping);
 * - returns: replacement only, for an item that arrives damaged, faulty or wrong, within REPLACEMENT_DAYS of
 *   delivery for covers and protection, 48 hours for sealed electronics (/pages/returns). No change-of-mind returns,
 *   so the policy is marked as an exchange (`ExchangeRefund`), free for defective items, not as generic free returns.
 */
import {
  BRAND_NAME,
  BUSINESS,
  FREE_SHIPPING_THRESHOLD_INR,
  OG_IMAGE,
  REPLACEMENT_DAYS,
  SHIPPING_FEE_INR,
  SITE_URL,
  SOCIAL_PROFILES,
} from '@/lib/brand';
import { ACCESSORY_TYPE_LABEL, accessoryPhotoSrc } from '@/lib/catalog/accessories';
import { GADGET_TYPE_LABEL, gadgetBrand, gadgetGallerySrc, gadgetHeroIndex } from '@/lib/catalog/gadgets';
import { LOOKS } from '@/lib/catalog/looks';
import { gallerySrc, photoSrc } from '@/lib/catalog/photos';
import { reviewsForStructuredData, summarizeReviews } from '@/lib/content/reviews';
import { THEMES, type ProductDetail } from '@/lib/medusa/fixtures';
import { lowestPrice } from '@/lib/medusa/variants';
import { productFullName } from '@/lib/product/names';

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/** DISPATCH_WINDOW (24–72 h) and ORDER_IN_WINDOW (3–5 days) in whole days, and the courier's 3–7 working days. */
const DISPATCH_DAYS = [1, 3] as const;
const ORDER_IN_DAYS = [3, 5] as const;
const TRANSIT_DAYS = [3, 7] as const;
/** Sealed electronics: damage or a wrong item must be reported within 48 hours of delivery (/pages/returns). */
const SEALED_ELECTRONICS_DAYS = 2;
const WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => `https://schema.org/${d}`);

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/** JSON for a <script type="application/ld+json">, with "<" escaped so no string can close the script tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function categoryOf(product: ProductDetail): string {
  if (product.gadget) return GADGET_TYPE_LABEL[product.gadget.type];
  if (product.accessory) return ACCESSORY_TYPE_LABEL[product.accessory.type];
  if (product.photo) {
    const look = LOOKS.find((l) => l.handle === product.photo?.look);
    return look ? `${look.name} phone back covers` : 'Phone back covers';
  }
  const theme = THEMES.find((t) => t.handle === product.theme);
  return theme ? `${theme.name} phone back covers` : 'Phone back covers';
}

function materialOf(product: ProductDetail): string {
  if (product.photo || product.accessory) return product.details.material;
  return product.caseTypes.includes('glass') ? 'TPU, tempered glass' : 'TPU';
}

function brandOf(product: ProductDetail): string {
  if (product.photo) return product.photo.brand;
  if (product.gadget) return gadgetBrand(product.gadget);
  return product.accessory?.brand ?? BRAND_NAME;
}

/** The product's main photo (960 px), the one its page leads with; null for the rare product without one. */
export function productImageUrl(product: ProductDetail): string | null {
  const { photo, gadget, accessory } = product;
  if (photo) return absoluteUrl(photo.gallery && photo.gallery.length > 0 ? gallerySrc(photo.id, 0, 960) : photoSrc(photo.id, 960));
  if (gadget?.photos) return absoluteUrl(gadgetGallerySrc(gadget.photos, gadgetHeroIndex(gadget.photos, gadget.options[0]?.slug), 960));
  if (accessory?.photos && accessory.photos.gallery.length > 0) return absoluteUrl(accessoryPhotoSrc(accessory.id, 0, 960));
  return null;
}

/** Days to dispatch: on the shelf within 24–72 h; ordered-in sizes in 3–5 days; a mix spans both. */
function handlingDays(product: ProductDetail): readonly [number, number] {
  const options = product.gadget?.options ?? [];
  const orderIn = options.filter((o) => o.orderIn).length;
  if (orderIn === 0) return DISPATCH_DAYS;
  if (orderIn === options.length) return ORDER_IN_DAYS;
  return [DISPATCH_DAYS[0], ORDER_IN_DAYS[1]];
}

function days(range: readonly [number, number]) {
  return { '@type': 'QuantitativeValue', minValue: range[0], maxValue: range[1], unitCode: 'DAY' };
}

function shippingDetails(priceInr: number, handling: readonly [number, number]) {
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: priceInr >= FREE_SHIPPING_THRESHOLD_INR ? 0 : SHIPPING_FEE_INR, currency: 'INR' },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: days(handling),
      transitTime: days(TRANSIT_DAYS),
      businessDays: { '@type': 'OpeningHoursSpecification', dayOfWeek: WORKING_DAYS },
    },
  };
}

function returnPolicy(product: ProductDetail) {
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'IN',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: product.gadget ? SEALED_ELECTRONICS_DAYS : REPLACEMENT_DAYS,
    returnMethod: 'https://schema.org/ReturnByMail',
    refundType: 'https://schema.org/ExchangeRefund',
    itemDefectReturnFees: 'https://schema.org/FreeReturn',
    merchantReturnLink: absoluteUrl('/pages/returns'),
  };
}

/**
 * `aggregateRating` and `review` from the product's real reviews shown on the page, and nothing at all
 * while it has none: marking up a rating that no visible review backs breaks Google's review-snippet rules.
 */
function reviewsJsonLd(handle: string) {
  const reviews = reviewsForStructuredData(handle);
  const { count, average } = summarizeReviews(reviews);
  if (count === 0 || average === null) return {};
  return {
    aggregateRating: { '@type': 'AggregateRating', ratingValue: average, reviewCount: count, bestRating: 5, worstRating: 1 },
    review: reviews.map((r) => ({
      '@type': 'Review',
      ...(r.title ? { name: r.title } : {}),
      reviewBody: r.body,
      datePublished: r.date,
      author: { '@type': 'Person', name: r.displayName },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
    })),
  };
}

/** A Product with its offer, shipping and return policy; `withReviews` adds the page's real reviews (product pages only). */
export function productSchema(product: ProductDetail, { withReviews = false } = {}) {
  const url = absoluteUrl(`/products/${product.handle}`);
  const price = lowestPrice(product);
  const image = productImageUrl(product);
  return {
    '@type': 'Product',
    name: productFullName(product),
    description: product.description,
    url,
    ...(image ? { image } : {}),
    sku: product.variants[0]?.sku,
    brand: { '@type': 'Brand', name: brandOf(product) },
    category: categoryOf(product),
    ...(product.gadget ? {} : { material: materialOf(product) }),
    offers: {
      '@type': 'Offer',
      url,
      price,
      priceCurrency: 'INR',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.variants.some((v) => v.stock > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@id': ORG_ID, '@type': 'Organization', name: BRAND_NAME },
      shippingDetails: shippingDetails(price, handlingDays(product)),
      hasMerchantReturnPolicy: returnPolicy(product),
    },
    ...(withReviews ? reviewsJsonLd(product.handle) : {}),
  };
}

export function productJsonLd(product: ProductDetail): string {
  return jsonLdString({ '@context': 'https://schema.org', ...productSchema(product, { withReviews: true }) });
}

/** A named list of products, each with the same details as its own page. */
export function itemListJsonLd(name: string, products: readonly ProductDetail[]): string {
  return jsonLdString({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, item: productSchema(p) })),
  });
}

/** Homepage: who runs the shop (name, logo, address, phone, support hours) and the website itself. */
export function storeJsonLd(): string {
  const telephone = BUSINESS.phone.href.replace(/^tel:/, '');
  return jsonLdString({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'OnlineStore',
        '@id': ORG_ID,
        name: BRAND_NAME,
        legalName: BUSINESS.name,
        url: absoluteUrl('/'),
        logo: { '@type': 'ImageObject', url: absoluteUrl('/icons/icon-512.png'), width: 512, height: 512 },
        image: absoluteUrl(OG_IMAGE.url),
        description:
          'Phone covers for your exact model, sealed boAt and realme audio, memory cards, SSDs, RAM, Wi-Fi cameras and screen protection, shipped across India from Haridwar.',
        telephone,
        email: BUSINESS.email,
        address: {
          '@type': 'PostalAddress',
          streetAddress: BUSINESS.address.lines.join(', '),
          addressLocality: BUSINESS.address.city,
          addressRegion: BUSINESS.address.state,
          postalCode: BUSINESS.address.pin,
          addressCountry: 'IN',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          telephone,
          email: BUSINESS.email,
          areaServed: 'IN',
          hoursAvailable: { '@type': 'OpeningHoursSpecification', dayOfWeek: WORKING_DAYS, opens: '10:00', closes: '19:00' },
        },
        ...(BUSINESS.gstin ? { taxID: BUSINESS.gstin } : {}),
        ...(SOCIAL_PROFILES.length > 0 ? { sameAs: SOCIAL_PROFILES } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        name: BRAND_NAME,
        alternateName: 'Gadgets Hub',
        url: absoluteUrl('/'),
        inLanguage: 'en-IN',
        publisher: { '@id': ORG_ID },
      },
    ],
  });
}
