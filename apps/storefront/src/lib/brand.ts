export const BRAND_NAME = 'GadgetsHub';
/** Absolute origin for canonical, Open Graph and JSON-LD URLs; no trailing slash. */
export const SITE_URL = 'https://gadgetshub.io';
export const FREE_SHIPPING_THRESHOLD_INR = 499;
export const REPLACEMENT_DAYS = 7;
export const COD_FEE_INR = 0;
export const MIN_PRICE_INR = 299;
export const WHATSAPP_NUMBER = '91XXXXXXXXXX';
export const DISPATCH_WINDOW = '24–72 h';
export const LAUNCH_BRANDS: readonly string[] = [
  'Apple',
  'Samsung',
  'OnePlus',
  'Xiaomi',
  'Realme',
  'Vivo',
  'Nothing',
  'Google',
];

/** Where the photos are shot; appears in the "Up close" and "Why buy here" copy. */
export const SHOP_CITY = 'Haridwar';
/** Case makers we stock, shown as plain text only (no third-party logos). */
export const CASE_BRANDS: readonly string[] = ['CG Mobile', 'Dulero', 'Spigen', 'Neza'];
/** Label on the cover pill; becomes "Buy now" once checkout exists. */
export const PRODUCT_CTA_LABEL = 'View';

export const PARENT_BRAND = 'EarthClique';
/** "by EarthClique" under the header wordmark at md+; off until the owner asks for it. */
export const SHOW_PARENT_BRAND = false;
export const EARTHCLIQUE_MARK_DARK = '/brand/earthclique-icon-for-dark-bg.svg';
export const EARTHCLIQUE_URL = 'https://earthclique.in';

/** Outside the brand voice; a grep over src/components and src/app must find none of these. */
export const BANNED_WORDS: readonly string[] = ['best', 'No.1', 'cheapest', 'guaranteed', 'world-class', 'premium'];
