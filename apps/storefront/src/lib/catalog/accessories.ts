/** Protection accessories sold per phone model, alongside the covers. Product content, not UI. */

export type AccessoryType = 'screen-guard' | 'lens-protector' | 'back-film' | 'body-film';
export type AccessoryFinish = 'clear' | 'privacy' | 'glass' | 'matte' | 'carbon' | 'gloss';

export interface AccessoryEntry {
  id: string;
  handle: string;
  title: string;
  type: AccessoryType;
  finish: AccessoryFinish;
  priceInr: number;
  regularInr: number;
  /** One line for cards and add-on rows. */
  short: string;
  description: string;
  features: [string, string, string];
  details: { material: string; inBox: string; fit: string; care: string };
  /** Only these phone models (slugs); every model when absent. */
  models?: readonly string[];
  /** The maker on the pack, for a branded guard sold as it comes; our own generic accessories have none. */
  brand?: string;
  /** Shop photos; the drawn art stands in when absent. */
  photos?: AccessoryPhotos;
}

/**
 * Square shop photos of an accessory at /products/photos/accessories/<id>/g-<n>-<w>.webp, made with the
 * sizes and settings of the cover galleries (scripts/photo-gallery.mjs). The first image leads the card.
 */
export interface AccessoryPhotos {
  /** One label per image, in display order. */
  gallery: readonly string[];
}

/** The cover gallery widths (photos.ts GALLERY_WIDTHS); 160 feeds thumbnails. */
export const ACCESSORY_PHOTO_WIDTHS = [160, 480, 960, 1440] as const;

export function accessoryPhotoSrc(id: string, n: number, w: (typeof ACCESSORY_PHOTO_WIDTHS)[number] = 960): string {
  return `/products/photos/accessories/${id}/g-${n}-${w}.webp`;
}

export function accessoryPhotoSrcSet(id: string, n: number): string {
  return ACCESSORY_PHOTO_WIDTHS.map((w) => `${accessoryPhotoSrc(id, n, w)} ${w}w`).join(', ');
}

export const ACCESSORY_TYPE_LABEL: Record<AccessoryType, string> = {
  'screen-guard': 'Screen guard',
  'lens-protector': 'Camera lens protector',
  'back-film': 'Back film',
  'body-film': 'Body protection film',
};

/**
 * Off each accessory bought together with a cover. Medusa applies it at checkout through the
 * automatic promotion BUNDLE50 (apps/backend/src/scripts/seed.ts); keep the two numbers equal.
 */
export const BUNDLE_SAVING_INR = 50;

export function bundlePrice(priceInr: number): number {
  return Math.max(0, priceInr - BUNDLE_SAVING_INR);
}

export const ACCESSORIES: readonly AccessoryEntry[] = [
  // From the shop (November 2026). Models and prices are the owner's (7 Nov). A guard takes a new id whenever its models
  // or price change, so the catalogue seed (which only adds missing products) creates it afresh.
  // The regular FLAYR glass (₹299), on its FLAYR backing card. The FLAYR 8K glass (₹499, iPhone 17 and 17 Pro) is a
  // separate product, listed once it has its own photo.
  {
    id: 'flayr-borderless-iphone',
    handle: 'flayr-borderless-tempered-glass-iphone',
    title: 'FLAYR Borderless tempered glass',
    type: 'screen-guard',
    finish: 'clear',
    priceInr: 299,
    regularInr: 299,
    short: 'For iPhone 12 to 18, Pro and non-Pro, and 17 Air',
    description:
      'FLAYR’s Borderless tempered glass for every iPhone from the 12 to the 18, the standard and Pro models, and the iPhone 17 Air. It covers the screen edge to edge. Each glass comes on a FLAYR backing card marked with the iPhones it fits: pick yours and we send the right one.',
    features: ['Borderless, edge to edge', 'On a FLAYR backing card', 'iPhone 12 to 18 and 17 Air'],
    details: {
      material: 'Tempered glass, FLAYR Borderless.',
      inBox: 'One FLAYR glass on its backing card, marked for your iPhone.',
      fit: 'Fits the iPhone 12, 13, 14, 15, 16, 17 and 18, their Pro models and the iPhone 17 Air. Not for the Plus or Pro Max models.',
      care: 'Fit it on a clean, dry screen. Clean with a dry microfibre cloth.',
    },
    models: [
      'iphone-12', 'iphone-12-pro', 'iphone-13', 'iphone-13-pro', 'iphone-14', 'iphone-14-pro', 'iphone-15', 'iphone-15-pro',
      'iphone-16', 'iphone-16-pro', 'iphone-17', 'iphone-17-pro', 'iphone-17-air', 'iphone-18', 'iphone-18-pro',
    ],
    brand: 'FLAYR',
    photos: { gallery: ['On the phone', 'Close up', 'In use'] },
  },
  {
    id: 'gtel-fingerprint-s',
    handle: 'gtel-3d-fingerprint-tempered-glass-galaxy-s-series',
    title: 'G-TEL 3D fingerprint tempered glass',
    type: 'screen-guard',
    finish: 'clear',
    priceInr: 300,
    regularInr: 300,
    short: 'For every Galaxy S from the S22 to the S26 Ultra',
    description:
      'G-TEL’s 3D fingerprint tempered glass for the Samsung Galaxy S series, from the S22 to the S26 Ultra: the standard, Plus, Ultra, FE and Edge models. Pick your Galaxy and we send the glass made for it.',
    features: ['3D fingerprint tempered glass', 'Galaxy S22 to S26 Ultra', 'Standard, Plus, Ultra, FE and Edge'],
    details: {
      material: 'Tempered glass, G-TEL 3D fingerprint range.',
      inBox: 'One G-TEL glass for the Galaxy you pick.',
      fit: 'Cut for each Galaxy S model from the S22 to the S26 Ultra; pick yours so we send the right one.',
      care: 'Fit it on a clean, dry screen. Clean with a dry microfibre cloth.',
    },
    models: [
      'galaxy-s22', 'galaxy-s22-plus', 'galaxy-s22-ultra',
      'galaxy-s23', 'galaxy-s23-plus', 'galaxy-s23-ultra', 'galaxy-s23-fe',
      'galaxy-s24', 'galaxy-s24-plus', 'galaxy-s24-ultra', 'galaxy-s24-fe',
      'galaxy-s25', 'galaxy-s25-plus', 'galaxy-s25-ultra', 'galaxy-s25-edge', 'galaxy-s25-fe',
      'galaxy-s26', 'galaxy-s26-plus', 'galaxy-s26-ultra',
    ],
    brand: 'G-TEL',
    photos: { gallery: ['Box', 'On the phone', 'In hand'] },
  },
  {
    id: 'hydrogel-back-film',
    handle: 'hydrogel-full-back-film-iphone',
    title: 'Hydrogel full back film for iPhone',
    type: 'back-film',
    finish: 'clear',
    priceInr: 250,
    regularInr: 250,
    short: 'Full back and side wrap, iPhone 12 to 18 Pro',
    description:
      'A 0.15 mm hydrogel film that wraps the whole back of your iPhone, with flaps that fold over the sides, so the back and frame stay free of scratches without adding bulk. It is a back film, not a screen protector. Each sheet is cut for one iPhone, with the camera cut out: pick yours and we send that sheet.',
    features: ['Full back with side flaps', 'Thin 0.15 mm hydrogel', 'iPhone 12 to 18 Pro'],
    details: {
      material: 'Hydrogel film, 0.15 mm.',
      inBox: 'One back film sheet cut for the iPhone you pick.',
      fit: 'Back and sides of the iPhone 12, 13, 14, 15, 16, 17 and 18 and their Pro models. Not for the front screen.',
      care: 'Fit it on a clean, dry phone and press out bubbles from the centre. Clean with a dry microfibre cloth.',
    },
    models: [
      'iphone-12', 'iphone-12-pro', 'iphone-13', 'iphone-13-pro', 'iphone-14', 'iphone-14-pro', 'iphone-15', 'iphone-15-pro',
      'iphone-16', 'iphone-16-pro', 'iphone-17', 'iphone-17-pro', 'iphone-18', 'iphone-18-pro',
    ],
    photos: { gallery: ['Back film sheet', 'In the pack', 'Thin and flexible'] },
  },
];

/** Ready-made kits shown on cover pages: the cover plus these accessories, for phones every listed accessory fits. */
export interface BundleKit {
  id: string;
  name: string;
  blurb: string;
  accessoryIds: string[];
}

export const BUNDLE_KITS: readonly BundleKit[] = [
  { id: 'flayr', name: 'Cover + glass', blurb: 'Cover + FLAYR Borderless glass', accessoryIds: ['flayr-borderless-iphone'] },
  { id: 'gtel', name: 'Cover + glass', blurb: 'Cover + G-TEL 3D fingerprint glass', accessoryIds: ['gtel-fingerprint-s'] },
];

/** True when the accessory is cut for this phone (no model list means every phone). */
export function accessoryFits(id: string, modelSlug: string): boolean {
  const entry = ACCESSORIES.find((a) => a.id === id);
  return Boolean(entry && (!entry.models || entry.models.includes(modelSlug)));
}

/** Kits for this phone: only those whose every accessory is cut for it; none until a phone is picked. */
export function kitsFor(modelSlug: string | null): BundleKit[] {
  if (!modelSlug) return [];
  return BUNDLE_KITS.filter((k) => k.accessoryIds.every((id) => accessoryFits(id, modelSlug)));
}
