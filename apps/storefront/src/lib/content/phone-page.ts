import { COD_FEE_INR, DISPATCH_WINDOW, FREE_SHIPPING_THRESHOLD_INR, REPLACEMENT_DAYS, SHOP_CITY } from '@/lib/brand';
import { coversLabel, isMagnetic, listPhrase, looksFor, lowestFrom } from '@/lib/catalog/listing';
import { LOOKS } from '@/lib/catalog/looks';
import type { HomeProduct, PhoneModel } from '@/lib/medusa/fixtures';
import { searchModelName } from '@/lib/product/names';
import type { Faq } from '@/lib/seo/structured-data';
import { rupees, seoDescription } from '@/lib/seo/meta';

const COD = COD_FEE_INR === 0 ? 'Cash on Delivery at no extra charge' : `Cash on Delivery (₹${COD_FEE_INR} fee)`;

/**
 * Copy for a phone-model page, built from the covers that fit it, so every sentence is true for that phone:
 * the count, the lowest price, the looks, and which covers have a magnet ring (by their series name).
 */
export function phonePageCopy(model: PhoneModel, products: readonly HomeProduct[]) {
  const name = searchModelName(model.model);
  if (products.length === 0) {
    return {
      name,
      titles: [`${name} Back Covers`],
      description: seoDescription(
        `Back covers for the ${name} are coming soon. See covers for other ${model.brand} phones, with COD and free shipping over ₹${FREE_SHIPPING_THRESHOLD_INR}.`,
      ),
      intro: `Covers for the ${name} are coming soon. Message us on WhatsApp and we will check what is in the shop for it, or see the ${model.brand} phones that have covers below.`,
      faqs: [] as Faq[],
    };
  }

  const from = rupees(lowestFrom(products));
  const looks = looksFor(products, LOOKS);
  const magnetic = products.filter(isMagnetic);
  const magneticSeries = [...new Set(magnetic.map((p) => `${p.photo!.brand} ${p.photo!.series}`))];
  const count = coversLabel(products.length);

  const intro = [
    `${count} made for the ${name}, from ${from}${looks.length > 0 ? `: ${listPhrase(looks, 4)}` : ''}.`,
    `Each one is made for this phone, so the camera cut-out, buttons and charging port line up${
      magnetic.length > 0
        ? `, and ${magnetic.length === products.length ? 'every one has' : `${magnetic.length} of them ${magnetic.length === 1 ? 'has' : 'have'}`} a built-in magnet ring for MagSafe and magnetic accessories`
        : ''
    }.`,
    `Every cover is photographed in our ${SHOP_CITY} shop, ships in ${DISPATCH_WINDOW} and is replaced if it arrives damaged or faulty within ${REPLACEMENT_DAYS} days.`,
    `Pay by UPI, card or ${COD}; shipping is free over ₹${FREE_SHIPPING_THRESHOLD_INR}.`,
  ].join(' ');

  const faqs: Faq[] = [
    {
      q: `Do these ${name} covers work with MagSafe or magnetic chargers?`,
      a:
        magnetic.length === 0
          ? `None of the covers listed for the ${name} right now has a magnet ring.`
          : magnetic.length === products.length
            ? `Yes, all of them: the ${listPhrase(magneticSeries, 4)} ${magneticSeries.length === 1 ? 'has' : 'have'} a built-in magnet ring that holds MagSafe and other magnetic chargers and accessories.`
            : `${magnetic.length} of the ${products.length} do: the ${listPhrase(magneticSeries, 4)} ${magneticSeries.length === 1 ? 'has' : 'have'} a built-in magnet ring that holds MagSafe and other magnetic chargers and accessories. The others have no magnet ring.`,
    },
    {
      q: `Will the case fit the ${name} camera bump?`,
      a: `Yes. Every cover on this page is made for the ${name}, so the camera cut-out, buttons and charging port line up. Check the exact model in your phone’s Settings, under About phone, before you order.`,
    },
    {
      q: 'Is Cash on Delivery available?',
      a: `Yes, ${COD}, as well as UPI and cards. Orders ship in ${DISPATCH_WINDOW}, and shipping is free over ₹${FREE_SHIPPING_THRESHOLD_INR}.`,
    },
  ];

  return {
    name,
    titles: [`${name} Back Covers & Cases – From ${from}`, `${name} Back Covers – From ${from}`, `${name} Back Covers`],
    description: seoDescription(
      `${count} for the ${name}${looks.length > 0 ? `: ${listPhrase(looks, 3)}` : ''}. Exact camera and port cut-outs. COD, free shipping over ₹${FREE_SHIPPING_THRESHOLD_INR}.`,
      `${count} for the ${name}, from ${from}. Exact camera and port cut-outs. COD, free shipping over ₹${FREE_SHIPPING_THRESHOLD_INR}.`,
      `${count} for the ${name}, from ${from}. COD across India.`,
    ),
    intro,
    faqs,
  };
}
