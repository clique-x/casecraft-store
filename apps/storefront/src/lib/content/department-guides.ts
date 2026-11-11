import { COD_FEE_INR, DISPATCH_WINDOW, FREE_SHIPPING_THRESHOLD_INR } from '@/lib/brand';
import type { Department } from '@/lib/catalog/gadgets';

/**
 * A short buying guide and answers to common questions, under a department's products. Every answer restates
 * the shop's own policies (/pages/shipping, /pages/returns) or the brands' published terms; keep them in step.
 */
export interface DepartmentGuide {
  heading: string;
  tips: readonly { title: string; body: string }[];
  faqs: readonly { q: string; a: string }[];
}

const COD = COD_FEE_INR === 0 ? 'Yes, Cash on Delivery is available at no extra charge' : `Yes, Cash on Delivery is available for a ₹${COD_FEE_INR} fee`;

export const DEPARTMENT_GUIDES: Partial<Record<Department, DepartmentGuide>> = {
  audio: {
    heading: 'Choosing earbuds, a neckband or a speaker',
    tips: [
      {
        title: 'Earbuds or a neckband',
        body: 'Earbuds come with a charging case that tops them up on the go. A neckband rests around your neck, so it is hard to lose, and charges straight from a cable.',
      },
      {
        title: 'Playtime',
        body: 'The playtime on each product page is the brand’s own figure. For earbuds, the bigger number includes the recharges from the case.',
      },
      {
        title: 'Calls',
        body: 'If you take a lot of calls on the move, look for ENx or ENC in the features: it filters background noise out of your voice.',
      },
      {
        title: 'Speakers',
        body: 'The wattage (W) tells you how loud a speaker plays. IPX5 means it shrugs off splashes and rain, so it can go to the terrace or the beach.',
      },
      {
        title: 'Your phone',
        body: 'All of them pair over Bluetooth with any Android phone or iPhone.',
      },
    ],
    faqs: [
      {
        q: 'Are these original boAt and realme products?',
        a: 'Yes. Every unit is sold sealed, exactly as the brand packs it, with our GST invoice.',
      },
      {
        q: 'What warranty do I get?',
        a: 'The brand’s one-year warranty. Take the unit and our invoice to any boAt or realme service centre, or raise the claim on the brand’s website.',
      },
      {
        q: 'Can I return earbuds, a neckband or a speaker?',
        a: 'Not once the seal is open, and we do not take change-of-mind returns on sealed audio. If the box arrives damaged or you get the wrong item, message us on WhatsApp within 48 hours of delivery with your unboxing video and we replace it. A fault after use is covered by the brand’s warranty.',
      },
      {
        q: 'Is Cash on Delivery available?',
        a: `${COD}, as well as UPI, cards and netbanking.`,
      },
      {
        q: 'How soon will it arrive?',
        a: `We dispatch every order within ${DISPATCH_WINDOW}, and most arrive within 3 to 7 working days after that. Shipping is free on orders over ₹${FREE_SHIPPING_THRESHOLD_INR}.`,
      },
    ],
  },
};
