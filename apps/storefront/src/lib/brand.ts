export const BRAND_NAME = 'GadgetsHub';
/** Absolute origin for canonical, Open Graph and JSON-LD URLs; no trailing slash. */
export const SITE_URL = 'https://gadgetshub.io';
export const FREE_SHIPPING_THRESHOLD_INR = 499;
export const REPLACEMENT_DAYS = 7;
export const COD_FEE_INR = 0;
export const MIN_PRICE_INR = 299;
/** WhatsApp and phone support, in wa.me form (country code, no plus). The same number as BUSINESS.phone. */
export const WHATSAPP_NUMBER = '918755572898';
export const DISPATCH_WINDOW = '24–72 h';
/**
 * Link preview for pages without a photo of their own: the brand campaign square centred on the site's
 * ink colour (public/promo, built by scripts/promo-art). The alt text is the image's own wording.
 */
export const OG_IMAGE = {
  url: '/promo/og-brand-hero-1200x630.jpg',
  width: 1200,
  height: 630,
  alt: 'GadgetsHub. Everyday tech. Extraordinary style. Cash on Delivery, free shipping over ₹499, 7-day replacement.',
};
export const LAUNCH_BRANDS: readonly string[] = [
  'Apple',
  'Samsung',
  'OnePlus',
  'Xiaomi',
  'Realme',
  'Vivo',
  'Nothing',
  'Google',
  'Motorola',
  'OPPO',
];

/** Where the photos are shot; appears in the "Up close" and "Why buy here" copy. */
export const SHOP_CITY = 'Haridwar';
/** Case makers we stock, shown as plain text only (no third-party logos). */
export const CASE_BRANDS: readonly string[] = ['CG Mobile', 'Dulero', 'Spigen', 'Neza'];
/** Label on the cover pill; becomes "Buy now" once checkout exists. */
export const PRODUCT_CTA_LABEL = 'View';

export const PARENT_BRAND = 'EarthClique';

/**
 * The business behind the shop, shown in the footer and on the contact and policy pages. Razorpay checks
 * that a store shows its business name, address, phone and email, and the Consumer Protection
 * (E-Commerce) Rules, 2020 ask for those and a grievance officer. Details as on EarthClique's own contact
 * card; GSTIN appears wherever it is set and nowhere while it is null.
 */
export const BUSINESS = {
  name: 'EarthClique Technologies',
  address: {
    lines: ['Shop No. 209, 2nd Floor', 'Deep Ganga Shopping Complex, SIDCUL'],
    city: 'Haridwar',
    state: 'Uttarakhand',
    pin: '249403',
  },
  phone: { href: 'tel:+918755572898', label: '+91 87555 72898' },
  email: 'info@earthclique.in',
  gstin: null as string | null,
  grievanceOfficer: { name: 'Shashank Saklani', role: 'Founder' },
  /** The shop's Google reviews (to read them or write one), from Google Business Profile; null hides the Google buttons. */
  googleReviewsUrl: null as string | null,
} as const;
/** The address on one line, e.g. for the footer and the policy intros. */
export const BUSINESS_ADDRESS = [...BUSINESS.address.lines, `${BUSINESS.address.city}, ${BUSINESS.address.state} ${BUSINESS.address.pin}`, 'India'].join(', ');
/** "by EarthClique" under the header wordmark at md+; off until the owner asks for it. */
export const SHOW_PARENT_BRAND = false;
export const EARTHCLIQUE_MARK_DARK = '/brand/earthclique-icon-for-dark-bg.svg';
export const EARTHCLIQUE_URL = 'https://earthclique.in';

/** Outside the brand voice; a grep over src/components and src/app must find none of these. */
export const BANNED_WORDS: readonly string[] = ['best', 'No.1', 'cheapest', 'guaranteed', 'world-class', 'premium'];
