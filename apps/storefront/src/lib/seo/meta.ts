import type { Metadata } from 'next';
import { BRAND_NAME, DISPATCH_WINDOW, FREE_SHIPPING_THRESHOLD_INR, REPLACEMENT_DAYS } from '@/lib/brand';
import { ACCESSORY_TYPE_LABEL } from '@/lib/catalog/accessories';
import { GADGET_TYPE_LABEL, ORDER_IN_WINDOW, gadgetBrand } from '@/lib/catalog/gadgets';
import type { ProductDetail } from '@/lib/medusa/fixtures';
import { lowestPrice } from '@/lib/medusa/variants';
import { coverHeadline, coverMaker, searchModelName } from '@/lib/product/names';

/** Google shows about this much of a title and of a description; longer ones are cut mid-sentence. */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 150;
/** The root layout's title template appends this. */
const TITLE_SUFFIX = ` · ${BRAND_NAME}`;

/** Collapses whitespace and, past `max` characters, cuts at the last whole word with an ellipsis. */
export function clampMeta(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > 0 ? cut.slice(0, space) : cut).replace(/[\s,;:–-]+$/, '')}…`;
}

/**
 * A page title of at most TITLE_MAX characters. Candidates go from richest to plainest (name, kind, price…): the
 * first one that fits is used, with the " · GadgetsHub" suffix when there is room and without it otherwise, so
 * the price stays in the title before the brand suffix does. When none fits, the last one is trimmed at a word.
 */
export function seoTitle(...candidates: string[]): Metadata['title'] {
  const list = candidates.map((c) => c.replace(/\s+/g, ' ').trim()).filter(Boolean);
  for (const c of list) {
    if (c.length + TITLE_SUFFIX.length <= TITLE_MAX) return c;
    if (c.length <= TITLE_MAX) return { absolute: c };
  }
  return { absolute: clampMeta(list[list.length - 1] ?? BRAND_NAME, TITLE_MAX) };
}

/** The title as it appears in the browser tab and search results (for og:title). */
export function fullTitle(title: Metadata['title']): string {
  if (typeof title === 'string') return `${title}${TITLE_SUFFIX}`;
  if (title && typeof title === 'object' && 'absolute' in title && title.absolute) return title.absolute;
  return BRAND_NAME;
}

/** The first candidate of at most DESCRIPTION_MAX characters, or the last one trimmed at a word. */
export function seoDescription(...candidates: string[]): string {
  const list = candidates.map((c) => c.replace(/\s+/g, ' ').trim()).filter(Boolean);
  return list.find((c) => c.length <= DESCRIPTION_MAX) ?? clampMeta(list[list.length - 1] ?? '', DESCRIPTION_MAX);
}

export function rupees(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

/** "(70% off)" when the regular price is higher, else empty. */
function percentOff(price: number, regular: number | undefined): string {
  if (!regular || regular <= price) return '';
  return ` (${Math.round((1 - price / regular) * 100)}% off)`;
}

/** "₹749" for one price, "from ₹749" when the options cost different amounts. */
function priceText(product: ProductDetail): string {
  const prices = new Set(product.variants.map((v) => v.priceInr));
  return `${prices.size > 1 ? 'from ' : ''}${rupees(lowestPrice(product))}`;
}

/** Dispatch time: ORDER_IN_WINDOW when every option is ordered in after the sale, else DISPATCH_WINDOW. */
function shipsIn(product: ProductDetail): string {
  const options = product.gadget?.options ?? [];
  return options.length > 0 && options.every((o) => o.orderIn) ? ORDER_IN_WINDOW : DISPATCH_WINDOW;
}

/** What the product is, in a few words: "Wireless earbuds", "Screen guard", "Back cover". */
export function productKind(product: ProductDetail): string {
  if (product.gadget) return GADGET_TYPE_LABEL[product.gadget.type];
  if (product.accessory) return ACCESSORY_TYPE_LABEL[product.accessory.type];
  return 'Back cover';
}

/** Product page <title>: name, what it is and the price, as long as it fits in 60 characters. */
export function productSeoTitle(product: ProductDetail): Metadata['title'] {
  const price = priceText(product);
  if (product.photo) {
    const headline = coverHeadline(product.photo);
    return seoTitle(`${headline} – ${price}`, headline);
  }
  const kind = productKind(product);
  return seoTitle(`${product.title} – ${kind} – ${price}`, `${product.title} – ${price}`, `${product.title} – ${kind}`, product.title);
}

/**
 * Product meta description (≤150): the entry's own `seoDescription` when set, else a template with the name,
 * price and discount, one feature and the shop's terms for that kind of product. Unique per product by name and price.
 */
export function productSeoDescription(product: ProductDetail): string {
  const { photo, gadget, accessory } = product;
  const own = gadget?.seoDescription ?? accessory?.seoDescription;
  if (own) return seoDescription(own);
  const price = priceText(product);
  const off = percentOff(lowestPrice(product), product.regularInr);
  if (photo) {
    const name = `${coverHeadline(photo)} (${coverMaker(photo, ', ')})`;
    const model = searchModelName(photo.modelLabel);
    return seoDescription(
      `Buy the ${name} at ${price}${off}. Made for the ${model}. COD, ships in ${DISPATCH_WINDOW}, ${REPLACEMENT_DAYS}-day replacement.`,
      `Buy the ${name} at ${price}${off}. COD, ships in ${DISPATCH_WINDOW}, ${REPLACEMENT_DAYS}-day replacement.`,
      `Buy the ${name} at ${price}. COD and ${REPLACEMENT_DAYS}-day replacement.`,
    );
  }
  if (gadget) {
    const feature = gadget.features[0];
    const brand = gadgetBrand(gadget);
    const ships = shipsIn(product);
    return seoDescription(
      `Buy ${product.title} at ${price}${off}. ${feature}. Sealed ${brand} pack with GST invoice, COD, ships in ${ships}.`,
      `Buy ${product.title} at ${price}${off}. ${feature}. Sealed ${brand} pack, COD, ships in ${ships}.`,
      `Buy ${product.title} at ${price}${off}. Sealed ${brand} pack, COD, ships in ${ships}.`,
    );
  }
  const kind = productKind(product).toLowerCase();
  const feature = accessory?.features[0];
  return seoDescription(
    `Buy ${product.title} (${kind}) at ${price}${off}. ${feature ? `${feature}. ` : ''}COD, ships in ${DISPATCH_WINDOW}, ${REPLACEMENT_DAYS}-day replacement.`,
    `Buy ${product.title} (${kind}) at ${price}${off}. COD, ships in ${DISPATCH_WINDOW}, ${REPLACEMENT_DAYS}-day replacement.`,
    `Buy ${product.title} at ${price}. COD, free shipping over ₹${FREE_SHIPPING_THRESHOLD_INR}.`,
  );
}
