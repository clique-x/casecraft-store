import { COD_FEE_INR, DISPATCH_WINDOW, FREE_SHIPPING_THRESHOLD_INR, REPLACEMENT_DAYS, SHIPPING_FEE_INR } from '@/lib/brand';
import { ORDER_IN_WINDOW, gadgetBrand, optionPrice } from '@/lib/catalog/gadgets';
import { listPhrase } from '@/lib/catalog/listing';
import type { PhoneModel, ProductDetail } from '@/lib/medusa/fixtures';
import { lowestPrice } from '@/lib/medusa/variants';
import { productFullName, searchModelName } from '@/lib/product/names';
import { rupees } from '@/lib/seo/meta';
import type { Faq } from '@/lib/seo/structured-data';

/**
 * Questions buyers ask before ordering, answered from this product's own data (price, options, brand, warranty
 * spec, box contents, the phones it fits) and the shop's policies (/pages/shipping, /pages/returns). Nothing here
 * may claim more than those say: a question is left out when the data to answer it is missing.
 */
export function productFaqs(product: ProductDetail, models: readonly PhoneModel[]): Faq[] {
  const { photo, gadget, accessory } = product;
  const name = photo ? productFullName(product) : product.title;
  const price = lowestPrice(product);
  const faqs: Faq[] = [];

  // Price, per option when they differ.
  const mrp = product.regularInr && product.regularInr > price ? ` (MRP ${rupees(product.regularInr)})` : '';
  if (gadget && new Set(gadget.options.map((o) => optionPrice(gadget, o).priceInr)).size > 1) {
    const each = gadget.options.map((o) => `${o.name} ${rupees(optionPrice(gadget, o).priceInr)}`);
    faqs.push({ q: `What is the ${product.title} price?`, a: `At GadgetsHub: ${listPhrase(each, 6)}. Pick the one you want on this page.` });
  } else if (photo) {
    faqs.push({ q: `What is the price of this ${searchModelName(photo.modelLabel)} back cover?`, a: `${rupees(price)} at GadgetsHub${mrp}, for the ${name}.` });
  } else {
    faqs.push({ q: `What is the ${name} price?`, a: `${rupees(price)} at GadgetsHub${mrp}.` });
  }

  // Fit.
  if (photo) {
    const model = searchModelName(photo.modelLabel);
    faqs.push({
      q: `Which phone does this cover fit?`,
      a: `The ${model}. It is made for that phone, so the camera cut-out, buttons and charging port line up. Check the exact model in your phone’s Settings, under About phone, before you order.`,
    });
  } else if (accessory?.models && accessory.models.length > 0) {
    const names = accessory.models.map((slug) => models.find((m) => m.slug === slug)?.model ?? slug);
    faqs.push({
      q: `Which phones does the ${product.title} fit?`,
      a: `${accessory.models.length === 1 ? names[0] : `${accessory.models.length} models, including ${listPhrase(names, 3).replace(/ and more$/, '')}`}. Each one is made for a single model: pick yours on this page and we send that one.`,
    });
  }

  // Originality and box contents (sealed brand audio says so in the returns policy; the rest by its box list).
  if (gadget?.original) {
    faqs.push({
      q: `Is it an original ${gadget.original.brand} product?`,
      a: `Yes. It is sold sealed, exactly as ${gadget.original.brand} packs it, with our GST invoice. In the box: ${gadget.inBox}`,
    });
  } else if (gadget?.inBox) {
    faqs.push({ q: 'What is in the box?', a: `${gadget.inBox} Every order comes with our GST invoice.` });
  }

  // Warranty, only when the product states one. Refurbished laptops carry the shop's own.
  const warranty = gadget?.specs.find((s) => s.label === 'Warranty')?.value;
  if (warranty && gadget?.condition === 'refurbished') {
    faqs.push({
      q: `What warranty does the ${product.title} have?`,
      a: `${warranty}. If it develops a fault in that time, message us on WhatsApp with your order number and we look after it.`,
    });
  } else if (warranty) {
    faqs.push({
      q: `What warranty does the ${product.title} have?`,
      a: `${warranty}. Claims go to ${gadgetBrand(gadget!)} through its service centres or website.`,
    });
  }

  // Payment and delivery.
  const orderedIn = gadget && gadget.options.length > 0 && gadget.options.every((o) => o.orderIn);
  const shipping = price >= FREE_SHIPPING_THRESHOLD_INR ? 'Shipping is free.' : `Shipping is ₹${SHIPPING_FEE_INR}, and free on orders over ₹${FREE_SHIPPING_THRESHOLD_INR}.`;
  faqs.push({
    q: 'Is Cash on Delivery available?',
    a: `Yes, ${COD_FEE_INR === 0 ? 'at no extra charge' : `for a ₹${COD_FEE_INR} fee`}, as well as UPI, cards and netbanking.`,
  });
  faqs.push({
    q: 'How soon will it arrive?',
    a: `We dispatch it within ${orderedIn ? ORDER_IN_WINDOW : DISPATCH_WINDOW}${orderedIn ? ', as we order it in for you' : ''}, and most orders arrive 3 to 7 working days after that. ${shipping}`,
  });

  // Replacement.
  const refurbishedReturn: Faq = {
    q: 'Can I return it?',
    a: 'It is a used laptop sold as shown in its photos, so we do not take change-of-mind returns. If it arrives damaged or not as described, message us on WhatsApp within 48 hours of delivery with your unboxing video; faults after that are covered by the warranty above.',
  };
  faqs.push(
    gadget?.condition === 'refurbished'
      ? refurbishedReturn
      : gadget
      ? {
          q: 'Can I return or replace it?',
          a: `It is sealed electronics, so we do not take change-of-mind returns once it is opened. If it arrives damaged or you get the wrong item, message us on WhatsApp within 48 hours of delivery with your unboxing video and we replace it.${warranty ? ' A fault after use is covered by the warranty above.' : ''}`,
        }
      : {
          q: 'Can I return or replace it?',
          a: `If it arrives damaged, faulty or not what you ordered, message us on WhatsApp within ${REPLACEMENT_DAYS} days of delivery and we replace it at no cost. We do not take change-of-mind returns.`,
        },
  );

  return faqs;
}
