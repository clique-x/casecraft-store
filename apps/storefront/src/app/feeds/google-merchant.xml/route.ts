import { FREE_SHIPPING_THRESHOLD_INR, SHIPPING_FEE_INR, SITE_URL } from '@/lib/brand';
import { ACCESSORY_TYPE_LABEL } from '@/lib/catalog/accessories';
import { GADGET_TYPE_LABEL, OPTION_LABEL, gadgetBrand, optionPrice, type GadgetType } from '@/lib/catalog/gadgets';
import { getCatalog } from '@/lib/medusa/catalog';
import type { PhoneModel, ProductDetail, Variant } from '@/lib/medusa/fixtures';
import { getPhoneModels } from '@/lib/medusa/home';
import { productFullName, searchModelName } from '@/lib/product/names';
import { clampMeta } from '@/lib/seo/meta';
import { productImageUrls } from '@/lib/seo/structured-data';

/**
 * Google Merchant Center product feed (RSS 2.0 with the g: namespace): one item per variant, grouped by product,
 * with the same prices, stock, photos, shipping and brand as the product pages and their structured data.
 * Merchant Center → Products → Feeds → Add feed → Scheduled fetch: https://gadgetshub.io/feeds/google-merchant.xml
 * No GTIN or part numbers are recorded, so every item says identifier_exists "no".
 */

const COVER_CATEGORY = 'Electronics > Communications > Telephony > Mobile Phone Accessories > Mobile Phone Cases';
const GUARD_CATEGORY = 'Electronics > Communications > Telephony > Mobile Phone Accessories';
const GADGET_CATEGORY: Record<GadgetType, string> = {
  earbuds: 'Electronics > Audio > Audio Components > Headphones & Headsets > Headphones',
  neckband: 'Electronics > Audio > Audio Components > Headphones & Headsets > Headphones',
  speaker: 'Electronics > Audio > Audio Components > Speakers',
  charger: 'Electronics > Communications > Telephony > Mobile Phone Accessories',
  'car-charger': 'Electronics > Communications > Telephony > Mobile Phone Accessories',
  cable: 'Electronics > Communications > Telephony > Mobile Phone Accessories',
  'pen-drive': 'Electronics > Electronics Accessories > Computer Components > Storage Devices > USB Flash Drives',
  'memory-card': 'Electronics > Electronics Accessories > Memory > Flash Memory > Flash Memory Cards',
  ssd: 'Electronics > Electronics Accessories > Computer Components > Storage Devices > Hard Drives',
  ram: 'Electronics > Electronics Accessories > Memory > RAM',
  enclosure: 'Electronics > Electronics Accessories > Computer Components > Storage Devices > Hard Drive Accessories',
  otg: 'Electronics > Electronics Accessories > Adapters',
  camera: 'Cameras & Optics > Cameras > Surveillance Cameras',
};
/** Days to dispatch (DISPATCH_WINDOW, or ORDER_IN_WINDOW for ordered-in options) and with the courier. */
const HANDLING = { shelf: [1, 3], orderIn: [3, 5] } as const;
const TRANSIT = [3, 7] as const;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function money(n: number): string {
  return `${n.toFixed(2)} INR`;
}

interface Item {
  id: string;
  group?: string;
  title: string;
  description: string;
  link: string;
  images: string[];
  inStock: boolean;
  price: number;
  regular: number;
  brand: string;
  category: string;
  productType: string;
  orderIn: boolean;
}

function itemsFor(product: ProductDetail, models: readonly PhoneModel[]): Item[] {
  const url = new URL(`/products/${product.handle}`, SITE_URL);
  const images = productImageUrls(product);
  const description = clampMeta(product.description, 5000);
  const group = product.variants.length > 1 ? product.handle : undefined;
  const linkWith = (param: string, value: string) => {
    const u = new URL(url);
    if (group) u.searchParams.set(param, value);
    return u.toString();
  };
  const model = (v: Variant) => models.find((m) => m.slug === v.modelSlug);

  if (product.gadget) {
    const g = product.gadget;
    const type = GADGET_TYPE_LABEL[g.type];
    return product.variants.flatMap((v) => {
      const option = g.options.find((o) => o.slug === v.modelSlug);
      if (!option) return [];
      const { priceInr, regularInr } = optionPrice(g, option);
      return [
        {
          id: v.sku || v.id,
          group,
          title: clampMeta(`${product.title}${g.options.length > 1 ? ` – ${option.name}` : ''} – ${type}`, 150),
          description,
          link: linkWith(g.optionKind, option.slug),
          images,
          inStock: v.stock > 0,
          price: v.priceInr || priceInr,
          regular: regularInr,
          brand: gadgetBrand(g),
          category: GADGET_CATEGORY[g.type],
          productType: `${type} > ${OPTION_LABEL[g.optionKind]} > ${option.name}`,
          orderIn: Boolean(option.orderIn),
        },
      ];
    });
  }

  if (product.accessory) {
    const a = product.accessory;
    const type = ACCESSORY_TYPE_LABEL[a.type];
    return product.variants.map((v) => {
      const phone = model(v);
      return {
        id: v.sku || v.id,
        group,
        title: clampMeta(`${product.title}${phone ? ` for ${searchModelName(phone.model)}` : ''} – ${type}`, 150),
        description,
        link: linkWith('model', v.modelSlug),
        images,
        inStock: v.stock > 0,
        price: v.priceInr,
        regular: Math.max(product.regularInr ?? v.priceInr, v.priceInr),
        brand: a.brand ?? 'GadgetsHub',
        category: GUARD_CATEGORY,
        productType: `Protection > ${type}${phone ? ` > ${phone.brand} ${phone.model}` : ''}`,
        orderIn: false,
      };
    });
  }

  // Covers: one variant per phone model the photographed cover fits.
  return product.variants.map((v) => {
    const phone = model(v);
    return {
      id: v.sku || v.id,
      group,
      title: clampMeta(productFullName(product), 150),
      description,
      link: linkWith('model', v.modelSlug),
      images,
      inStock: v.stock > 0,
      price: v.priceInr,
      regular: Math.max(product.regularInr ?? v.priceInr, v.priceInr),
      brand: product.photo?.brand ?? 'GadgetsHub',
      category: COVER_CATEGORY,
      productType: `Covers > ${phone ? `${phone.brand} > ${phone.model}` : 'Phone back covers'}`,
      orderIn: false,
    };
  });
}

function itemXml(i: Item): string {
  const [hMin, hMax] = i.orderIn ? HANDLING.orderIn : HANDLING.shelf;
  const discounted = i.regular > i.price;
  const tags = [
    `<g:id>${esc(i.id)}</g:id>`,
    i.group ? `<g:item_group_id>${esc(i.group)}</g:item_group_id>` : '',
    `<g:title>${esc(i.title)}</g:title>`,
    `<g:description>${esc(i.description)}</g:description>`,
    `<g:link>${esc(i.link)}</g:link>`,
    i.images[0] ? `<g:image_link>${esc(i.images[0])}</g:image_link>` : '',
    ...i.images.slice(1, 11).map((src) => `<g:additional_image_link>${esc(src)}</g:additional_image_link>`),
    `<g:availability>${i.inStock ? 'in_stock' : 'out_of_stock'}</g:availability>`,
    `<g:price>${money(discounted ? i.regular : i.price)}</g:price>`,
    discounted ? `<g:sale_price>${money(i.price)}</g:sale_price>` : '',
    `<g:brand>${esc(i.brand)}</g:brand>`,
    '<g:identifier_exists>no</g:identifier_exists>',
    '<g:condition>new</g:condition>',
    `<g:google_product_category>${esc(i.category)}</g:google_product_category>`,
    `<g:product_type>${esc(i.productType)}</g:product_type>`,
    '<g:shipping>',
    '<g:country>IN</g:country>',
    `<g:price>${money(i.price >= FREE_SHIPPING_THRESHOLD_INR ? 0 : SHIPPING_FEE_INR)}</g:price>`,
    `<g:min_handling_time>${hMin}</g:min_handling_time><g:max_handling_time>${hMax}</g:max_handling_time>`,
    `<g:min_transit_time>${TRANSIT[0]}</g:min_transit_time><g:max_transit_time>${TRANSIT[1]}</g:max_transit_time>`,
    '</g:shipping>',
  ];
  return `<item>${tags.filter(Boolean).join('')}</item>`;
}

export async function GET(): Promise<Response> {
  const [{ products, accessories, gadgets }, models] = await Promise.all([getCatalog(), getPhoneModels()]);
  const items = [...products.filter((p) => p.photo), ...accessories, ...gadgets].flatMap((p) => itemsFor(p, models));
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '<channel>',
    '<title>GadgetsHub</title>',
    `<link>${SITE_URL}</link>`,
    '<description>Phone covers, audio, storage, cameras and screen protection from GadgetsHub</description>',
    ...items.map(itemXml),
    '</channel>',
    '</rss>',
  ].join('\n');
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
