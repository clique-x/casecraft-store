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
  /** A hand-written meta description (≤150 characters); a template is used when absent. */
  seoDescription?: string;
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
      fit: 'Made for each Galaxy S model from the S22 to the S26 Ultra; pick yours so we send the right one.',
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
  // Camera lens protectors (17 Nov 2026): one listing per pack design, sold per phone model. Every model has its own pack,
  // labelled with that model; the first photo is the pack design without a model name, the second a real pack.
  {
    id: 'lens-rings-iphone',
    handle: 'iphone-camera-lens-protector',
    title: 'Jing Yuan camera lens protector for iPhone',
    type: 'lens-protector',
    finish: 'glass',
    priceInr: 149,
    regularInr: 149,
    short: 'Two lens rings, iPhone 13 to 17 and Plus models',
    description:
      'Separate glass rings that sit over each of the two rear cameras of your iPhone, so the lenses stay free of scratches and smudges while the camera island stays visible. The Jing Yuan pack prints 99% light transmission, an AR + AF coating and a full lens fit. Ring sizes change from one iPhone to the next, so each pack is made for one model: pick yours and we send the pack labelled with it.',
    features: ['One ring per rear camera', '99% transmission, AR + AF (as printed on the pack)', 'Pack labelled with your model'],
    details: {
      material: 'Glass lens rings on a card, as packed by Jing Yuan. The pack prints 99% transmittance, AR + AF coating and full lens fit.',
      inBox: 'One set of lens rings for the iPhone you pick, on its card.',
      fit: 'iPhone 13, 14, 14 Plus, 15, 15 Plus, 16, 16 Plus and 17 (two rear cameras). For the Pro and Pro Max, see the three-ring set.',
      care: 'Wipe the camera glass clean and dry, line each ring up over its lens, then press for a few seconds.',
    },
    models: ['iphone-13', 'iphone-14', 'iphone-14-plus', 'iphone-15', 'iphone-15-plus', 'iphone-16', 'iphone-16-plus', 'iphone-17'],
    brand: 'Jing Yuan',
    photos: { gallery: ['Pack design', 'The pack for iPhone 15 and 15 Plus'] },
  },
  {
    id: 'lens-rings-iphone-pro',
    handle: 'iphone-pro-camera-lens-protector',
    title: 'Jing Yuan camera lens protector for iPhone Pro and Pro Max',
    type: 'lens-protector',
    finish: 'glass',
    priceInr: 149,
    regularInr: 149,
    short: 'Three lens rings, iPhone 13 Pro to 18 Pro Max',
    description:
      'Three separate glass rings, one for each rear camera of your iPhone Pro or Pro Max, to keep the lenses free of scratches and smudges without covering the whole camera island. The Jing Yuan pack prints 99% light transmission, an AR + AF coating and a full lens fit. The lenses grow a little with every generation, so each pack is made for one model: pick yours and we send the pack labelled with it.',
    features: ['One ring per rear camera', '99% transmission, AR + AF (as printed on the pack)', 'Pack labelled with your model'],
    details: {
      material: 'Glass lens rings on a card, as packed by Jing Yuan. The pack prints 99% transmittance, AR + AF coating and full lens fit.',
      inBox: 'One set of three lens rings for the iPhone you pick, on its card.',
      fit: 'iPhone 13 Pro and Pro Max through iPhone 18 Pro and Pro Max (three rear cameras).',
      care: 'Wipe the camera glass clean and dry, line each ring up over its lens, then press for a few seconds.',
    },
    models: [
      'iphone-13-pro', 'iphone-13-pro-max', 'iphone-14-pro', 'iphone-14-pro-max', 'iphone-15-pro', 'iphone-15-pro-max',
      'iphone-16-pro', 'iphone-16-pro-max', 'iphone-17-pro', 'iphone-17-pro-max', 'iphone-18-pro', 'iphone-18-pro-max',
    ],
    brand: 'Jing Yuan',
    photos: { gallery: ['Pack design', 'The pack for iPhone 18 Pro and Pro Max'] },
  },
  {
    id: 'lens-rings-galaxy-s',
    handle: 'galaxy-s-camera-lens-protector',
    title: 'Camera lens protector for Galaxy S23 to S26+',
    type: 'lens-protector',
    finish: 'glass',
    priceInr: 149,
    regularInr: 149,
    short: 'Three lens rings in a frame, Galaxy S23 to S26+',
    description:
      'Glass rings for the three rear cameras of your Galaxy S, set in a frame that lines them up in one go. The pack prints 9H hardness, Ultra HD clarity and dust prevention. Each pack is made for one model, since the lenses differ in size from one Galaxy to the next: pick yours and we send the pack labelled with it.',
    features: ['Three rings in a lining-up frame', '9H, Ultra HD (as printed on the pack)', 'Pack labelled with your model'],
    details: {
      material: 'Glass lens rings in a fitting frame. The pack prints 9H, Ultra HD and dust prevention.',
      inBox: 'One set of three lens rings for the Galaxy you pick, in its frame.',
      fit: 'Galaxy S23, S23+, S24, S24+, S25, S25+, S26 and S26+ (three rear cameras in a column). For the Ultra models, see the Ultra protector.',
      care: 'Wipe the camera glass clean and dry, place the frame over the cameras, press each ring down, then lift the frame away.',
    },
    models: ['galaxy-s23', 'galaxy-s23-plus', 'galaxy-s24', 'galaxy-s24-plus', 'galaxy-s25', 'galaxy-s25-plus', 'galaxy-s26', 'galaxy-s26-plus'],
    photos: { gallery: ['Pack design', 'The pack for Galaxy S25'] },
  },
  {
    id: 'lens-film-galaxy-ultra',
    handle: 'galaxy-s-ultra-camera-lens-protector',
    title: 'Camera lens protector for Galaxy S23 to S26 Ultra',
    type: 'lens-protector',
    finish: 'clear',
    priceInr: 149,
    regularInr: 149,
    short: 'Covers every rear lens, Galaxy S23 to S26 Ultra',
    description:
      'Protective pieces for every rear camera of your Galaxy Ultra, so the large lenses stay free of scratches and smudges. The Ultra camera layout changes from one generation to the next, so each pack is made for one model: pick yours and we send the pack labelled with it. The photo shows the Galaxy S23 Ultra pack, which is marked "lens film".',
    features: ['A piece for every rear camera', 'Made for your exact Ultra', 'Pack labelled with your model'],
    details: {
      material: 'Lens protector pieces on a card. The Galaxy S23 Ultra pack is marked "lens film".',
      inBox: 'One set of lens protectors for the Galaxy Ultra you pick, on its card.',
      fit: 'Galaxy S23 Ultra, S24 Ultra, S25 Ultra and S26 Ultra.',
      care: 'Wipe the camera glass clean and dry, line each piece up over its lens, then press for a few seconds.',
    },
    models: ['galaxy-s23-ultra', 'galaxy-s24-ultra', 'galaxy-s25-ultra', 'galaxy-s26-ultra'],
    photos: { gallery: ['The pack for Galaxy S23 Ultra'] },
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
