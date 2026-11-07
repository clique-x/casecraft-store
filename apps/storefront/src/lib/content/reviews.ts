import { BRAND_NAME, WHATSAPP_NUMBER } from '@/lib/brand';

/**
 * Customer reviews: shop reviews and product reviews, shown on the home page, on product pages and in
 * the product JSON-LD.
 *
 * ONLY REAL REVIEWS FROM REAL CUSTOMERS. Never write, invent, edit for tone, or seed a review, a name, a
 * rating or a count, not even as a placeholder or an example. Fake reviews break the Consumer Protection
 * Act 2019 and the CCPA's rules against fake reviews, BIS IS 19000:2022, and Google's structured-data
 * policy. While this list is empty the site shows an invitation to write a review and no stars or counts.
 *
 * How to add one:
 * 1. Take it from where the customer wrote it: the shop's Google reviews, a WhatsApp message in which the
 *    customer agreed to have it shown on the site, or a review a buyer sent to the shop after an order.
 * 2. Copy the words exactly as the customer wrote them, without rewording or shortening, with the star
 *    rating they gave. If they gave no rating, ask them; never guess one.
 * 3. Show the name only the way the customer agreed to, usually first name and last initial. City only if
 *    they are happy for it to appear.
 * 4. Add every review that reaches you through these channels, the critical ones too: IS 19000 asks that
 *    negative reviews are not held back. Do not add reviews that were paid for or rewarded with a gift or
 *    a discount.
 * 5. Append an object of type `Review` below with a new unique `id`. For a review of one product, set
 *    `productHandle` to the part of its URL after /products/; leave it out for a review of the shop.
 *
 * The list is checked when the site builds: a missing name or body, a rating outside 1–5, a malformed date
 * or a repeated id stops the build with a message naming the review.
 */

/** Where the review was written. `store`: sent to the shop by the buyer after an order. */
export type ReviewSource = 'google' | 'whatsapp' | 'store';

export type StarRating = 1 | 2 | 3 | 4 | 5;

export interface Review {
  /** Unique and never reused; any short slug works (letters, digits, hyphens). */
  id: string;
  /** Whole stars, as the customer gave them. */
  rating: StarRating;
  /** Optional headline, only if the customer wrote one. */
  title?: string;
  /** The customer's own words. */
  body: string;
  /** The name exactly as the customer agreed to have it shown, usually first name and last initial. */
  displayName: string;
  /** Only if the customer is happy for it to appear. */
  city?: string;
  /** Day the customer wrote it, ISO `YYYY-MM-DD`. */
  date: string;
  source: ReviewSource;
  /** True only when the shop has matched the review to a real order from this customer. */
  verifiedPurchase: boolean;
  /** The product handle as in /products/<handle>; omit for a review of the shop as a whole. */
  productHandle?: string;
}

/** Real customer reviews only; see the rules above. Empty until the owner adds them. */
export const REVIEWS: readonly Review[] = [];

export const REVIEW_SOURCE_LABEL: Record<ReviewSource, string> = {
  google: 'Google review',
  whatsapp: 'Shared on WhatsApp',
  store: 'Sent to us',
};

export interface ReviewSummary {
  count: number;
  /** Mean rating rounded to one decimal; null when there are no reviews. */
  average: number | null;
  /** Five rows, 5 stars first. */
  distribution: readonly { stars: StarRating; count: number }[];
}

const STARS_DESC: readonly StarRating[] = [5, 4, 3, 2, 1];
const SOURCES: readonly ReviewSource[] = ['google', 'whatsapp', 'store'];
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function daysInMonth(year: number, month: number): number {
  if (month === 2) return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isIsoDate(value: string): boolean {
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

/** Throws on the first malformed entry, so bad data fails the build instead of reaching the page. */
function assertValidReviews(reviews: readonly Review[]): void {
  const ids = new Set<string>();
  reviews.forEach((r, i) => {
    const where = `REVIEWS[${i}]${r.id ? ` (id "${r.id}")` : ''} in src/lib/content/reviews.ts`;
    const fail = (problem: string) => {
      throw new Error(`${where}: ${problem}`);
    };
    if (!r.id?.trim()) fail('needs an id');
    if (ids.has(r.id)) fail('repeats an id that is already used');
    ids.add(r.id);
    if (!Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5) fail('rating must be a whole number from 1 to 5');
    if (!r.body?.trim()) fail('needs the review text in `body`');
    if (!r.displayName?.trim()) fail('needs a `displayName`');
    if (!isIsoDate(r.date)) fail('date must be a real day written as YYYY-MM-DD');
    if (!SOURCES.includes(r.source)) fail(`source must be one of ${SOURCES.join(', ')}`);
    if (typeof r.verifiedPurchase !== 'boolean') fail('verifiedPurchase must be true or false');
    if (r.productHandle !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.productHandle)) {
      fail('productHandle must be the product URL slug, e.g. the part after /products/');
    }
  });
}

assertValidReviews(REVIEWS);

/** Newest first; the same day falls back to the id so the order never shifts between builds. */
function byNewest(a: Review, b: Review): number {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : a.id.localeCompare(b.id);
}

/** Every review, shop and product alike, newest first. */
export function allReviews(): Review[] {
  return [...REVIEWS].sort(byNewest);
}

/** Reviews of one product, newest first. */
export function reviewsForProduct(handle: string): Review[] {
  return REVIEWS.filter((r) => r.productHandle === handle).sort(byNewest);
}

/** Reviews of the shop as a whole (no product handle), newest first. */
export function shopReviews(): Review[] {
  return REVIEWS.filter((r) => r.productHandle === undefined).sort(byNewest);
}

/**
 * Reviews of one product that may go into its JSON-LD: those the shop collected itself. Google's review
 * snippet rules do not allow marking up ratings gathered from other sites, so Google reviews are shown on
 * the page but left out of the structured data.
 */
export function reviewsForStructuredData(handle: string): Review[] {
  return reviewsForProduct(handle).filter((r) => r.source !== 'google');
}

export function summarizeReviews(reviews: readonly Review[]): ReviewSummary {
  const count = reviews.length;
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return {
    count,
    average: count > 0 ? Math.round((total / count) * 10) / 10 : null,
    distribution: STARS_DESC.map((stars) => ({ stars, count: reviews.filter((r) => r.rating === stars).length })),
  };
}

/** "4 Mar 2026", from the ISO day; no Date object, so the output never depends on the server's time zone. */
export function formatReviewDate(iso: string): string {
  const m = ISO_DATE.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/** "1 review", "12 reviews". */
export function reviewCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'review' : 'reviews'}`;
}

/**
 * wa.me link with a short form to fill in. It asks for the permission to publish up front, because a
 * WhatsApp review may only appear on the site with the customer's agreement.
 */
export function reviewOnWhatsAppHref(productName?: string): string {
  const lines = [
    productName
      ? `Hi! I'd like to review the ${productName} I bought from ${BRAND_NAME}.`
      : `Hi! I'd like to leave a review of my order from ${BRAND_NAME}.`,
    '',
    ...(productName ? [] : ['What I bought: ']),
    'Stars (1 to 5): ',
    'My review: ',
    'Name to show (for example first name and last initial): ',
    'City (optional): ',
    'You may show this review on your website: Yes / No',
  ];
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}
