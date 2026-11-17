import { SITE_URL, WHATSAPP_NUMBER } from '@/lib/brand';
import { ACCESSORY_TYPE_LABEL } from '@/lib/catalog/accessories';
import { GADGET_TYPE_LABEL } from '@/lib/catalog/gadgets';
import type { ProductDetail } from '@/lib/medusa/fixtures';
import { productFullName } from '@/lib/product/names';

interface AskOnWhatsAppArgs {
  productName: string;
  /** What the product is, after its name: "back cover" (the default), "wireless earbuds", "screen guard". */
  kind?: string;
  /** The page's handle, so the message carries the product link. */
  handle?: string;
  /** The chosen phone (covers, guards) or option; null while none is chosen. */
  modelName: string | null;
  /** The line label for `modelName`: "Phone" (the default), or a gadget's option, such as "Colour" or "Capacity". */
  modelLabel?: string;
  /** Omitted for photographed stock, which has one case type. */
  caseTypeName: string | null;
  sku: string | null;
  /** `order` (default) places an order; `notify` asks to hear when a sold-out variant is back. */
  intent?: 'order' | 'notify';
}

/** Prefilled wa.me link for ordering (or asking about) one variant: "Hi! I'd like to order the boAt Airdopes 219 (wireless earbuds)." */
export function askOnWhatsAppHref({
  productName,
  kind = 'back cover',
  handle,
  modelName,
  modelLabel = 'Phone',
  caseTypeName,
  sku,
  intent = 'order',
}: AskOnWhatsAppArgs): string {
  // A name that already says what it is ("… Back Cover – CaseCraft, Orange") needs no "(back cover)" after it.
  const what = productName.toLowerCase().includes(kind.toLowerCase()) ? productName : `${productName} (${kind})`;
  const lines = [
    intent === 'notify' ? `Hi! Please tell me when the ${what} is back in stock.` : `Hi! I'd like to order the ${what}.`,
  ];
  if (handle) lines.push(new URL(`/products/${handle}`, SITE_URL).toString());
  if (modelName || modelLabel === 'Phone') lines.push(`${modelLabel}: ${modelName ?? 'not picked yet'}`);
  if (caseTypeName) lines.push(`Case type: ${caseTypeName}`);
  if (sku) lines.push(`SKU: ${sku}`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}

/** The name, kind and link of a product for its WhatsApp messages: covers by their full name, others by what they are. */
export function whatsAppProduct(product: ProductDetail): Pick<AskOnWhatsAppArgs, 'productName' | 'kind' | 'handle'> {
  const handle = product.handle;
  if (product.photo) return { productName: productFullName(product), kind: 'back cover', handle };
  if (product.gadget) return { productName: product.title, kind: GADGET_TYPE_LABEL[product.gadget.type].toLowerCase(), handle };
  if (product.accessory) return { productName: product.title, kind: ACCESSORY_TYPE_LABEL[product.accessory.type].toLowerCase(), handle };
  return { productName: product.title, kind: 'back cover', handle };
}
