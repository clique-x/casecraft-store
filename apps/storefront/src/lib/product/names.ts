import type { PhotoEntry } from '@/lib/catalog/photos';

/** Phone lines buyers search with the maker's name in front: "Samsung Galaxy S25", "Google Pixel 9". */
const MAKER_PREFIX: readonly (readonly [string, string])[] = [
  ['Galaxy ', 'Samsung'],
  ['Pixel ', 'Google'],
];

/** The phone as buyers type it into Google: "iPhone 16", "Samsung Galaxy S23 FE", "Redmi 13C 5G". */
export function searchModelName(modelLabel: string): string {
  const prefix = MAKER_PREFIX.find(([line]) => modelLabel.startsWith(line));
  return prefix ? `${prefix[1]} ${modelLabel}` : modelLabel;
}

/** Phone model and product type first, the way buyers search: "iPhone 16 Ring Stand Camera Slider Back Cover". */
export function coverHeadline(photo: Pick<PhotoEntry, 'modelLabel' | 'series'>): string {
  return `${searchModelName(photo.modelLabel)} ${photo.series} Back Cover`;
}

/** Brand and colour: "CaseCraft · Orange"; the colour is left out where the series already says it (Spigen Clear). */
export function coverMaker(photo: Pick<PhotoEntry, 'brand' | 'series' | 'design'>, separator = ' · '): string {
  return photo.series.toLowerCase().includes(photo.design.toLowerCase()) ? photo.brand : `${photo.brand}${separator}${photo.design}`;
}

/**
 * The product's full name for the page <title>, Google's product data and link previews:
 * "iPhone 16 Ring Stand Camera Slider Back Cover – CaseCraft, Orange" for a cover; the catalogue title otherwise.
 */
export function productFullName(product: { title: string; photo?: PhotoEntry }): string {
  const { photo } = product;
  return photo ? `${coverHeadline(photo)} – ${coverMaker(photo, ', ')}` : product.title;
}
