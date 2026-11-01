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
}

/** Current flagships in the catalogue; the body protection film is cut for these only. */
export const FLAGSHIP_MODELS: readonly string[] = [
  'iphone-16',
  'iphone-16-pro',
  'iphone-17',
  'iphone-18-pro',
  'iphone-duo',
  'galaxy-s25',
  'galaxy-z-fold-8',
  'galaxy-z-fold-8-ultra',
  'oneplus-13',
];

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
  {
    id: 'glass-clear',
    handle: 'tempered-glass-screen-guard',
    title: 'Edge-to-edge tempered glass',
    type: 'screen-guard',
    finish: 'clear',
    priceInr: 199,
    regularInr: 399,
    short: '9H glass, full screen, bubble-free fit',
    description:
      'A 0.33 mm tempered glass guard that covers the whole display up to the curve, with an oleophobic coat so fingerprints wipe off. It is cut for your exact model, so the earpiece and front camera stay open.',
    features: ['9H hardness, 0.33 mm thin', 'Covers the full screen', 'Easy-align install kit'],
    details: {
      material: 'Tempered glass, 9H surface hardness, oleophobic coating, 2.5D rounded edges.',
      inBox: 'Screen guard, alcohol wipe, dry cloth, dust stickers and an alignment frame.',
      fit: 'Cut for each listed model. Leaves room at the edges so it works with every cover we sell.',
      care: 'Clean with a dry microfibre cloth. Replace it if it cracks; it has done its job.',
    },
  },
  {
    id: 'glass-privacy',
    handle: 'privacy-screen-guard',
    title: 'Privacy tempered glass',
    type: 'screen-guard',
    finish: 'privacy',
    priceInr: 299,
    regularInr: 549,
    short: 'Screen goes dark from the side',
    description:
      'The same 9H glass with a privacy layer: straight on, the screen looks normal; from about 30° to either side, it turns dark. Useful on the metro, in queues and in office lifts.',
    features: ['Dark from 30° to the side', '9H hardness, full screen', 'Easy-align install kit'],
    details: {
      material: 'Tempered glass with a micro-louvre privacy layer, 9H hardness, oleophobic coating.',
      inBox: 'Privacy guard, alcohol wipe, dry cloth, dust stickers and an alignment frame.',
      fit: 'Cut for each listed model, with cut-outs for the earpiece and front camera.',
      care: 'Clean with a dry microfibre cloth. Screen brightness may need one step up.',
    },
  },
  {
    id: 'lens-glass',
    handle: 'camera-lens-protector',
    title: 'Camera lens protector',
    type: 'lens-protector',
    finish: 'glass',
    priceInr: 149,
    regularInr: 299,
    short: 'Glass rings over each lens, no flare',
    description:
      'Individual glass rings that sit over each camera lens and keep the camera bump off the table. The glass is optically clear and coated against flare, so photos and night shots are unchanged.',
    features: ['One ring per lens', 'Anti-flare clear glass', 'Fits under our covers'],
    details: {
      material: 'Optical glass lenses in aluminium rings, anti-reflective coating.',
      inBox: 'Lens protector set, alignment tray, alcohol wipe and dry cloth.',
      fit: 'Shaped to each listed model’s camera island.',
      care: 'Wipe with a dry cloth before taking photos for the clearest shots.',
    },
  },
  {
    id: 'film-matte',
    handle: 'matte-back-film',
    title: 'Full-frame matte back film',
    type: 'back-film',
    finish: 'matte',
    priceInr: 249,
    regularInr: 449,
    short: 'Covers the back and sides, matte grip',
    description:
      'A thin matte film that wraps the whole back and the side frame, with a cut-out for the camera. It keeps scratches off and adds grip for people who like their phone without a cover.',
    features: ['Back and side frame', 'Matte, fingerprint-resistant', 'Bubble-free, removable'],
    details: {
      material: '0.2 mm TPU film with a matte finish and a self-healing top layer.',
      inBox: 'Back film, squeegee card, alcohol wipe and dry cloth.',
      fit: 'Cut for each listed model, including the camera island and buttons.',
      care: 'Small scratches fade on their own. It peels off cleanly with no residue.',
    },
  },
  {
    id: 'film-carbon',
    handle: 'carbon-back-film',
    title: 'Full-frame carbon back film',
    type: 'back-film',
    finish: 'carbon',
    priceInr: 299,
    regularInr: 499,
    short: 'Carbon-texture wrap for back and sides',
    description:
      'A textured carbon-look film for the full back and sides. It changes the look of a bare phone and adds grip, and you can still wear a clear cover over it.',
    features: ['Carbon texture you can feel', 'Back and side frame', 'Bubble-free, removable'],
    details: {
      material: '0.25 mm textured vinyl film with an air-release adhesive.',
      inBox: 'Back film, squeegee card, alcohol wipe and dry cloth.',
      fit: 'Cut for each listed model, including the camera island and buttons.',
      care: 'Wipe with a damp cloth. It peels off cleanly with no residue.',
    },
  },
  {
    id: 'body-film',
    handle: 'body-protection-film',
    title: 'Body protection film',
    type: 'body-film',
    finish: 'gloss',
    priceInr: 499,
    regularInr: 899,
    short: 'Clear wrap for back, sides and camera surround · flagships only',
    description:
      'A clear, self-healing film that wraps the whole body of the phone: back, side frame and the area around the camera, cut by machine for each flagship. It is thicker than our back films, nearly invisible, and keeps the phone looking new under or without a cover.',
    features: ['Back, sides and camera surround', 'Self-healing, clear gloss finish', 'Cut only for flagship models'],
    details: {
      material: '0.2 mm thermoplastic polyurethane (TPU) with a self-healing top coat and UV-stable adhesive, so it does not yellow.',
      inBox: 'Back panel film, two side-frame strips, camera surround piece, squeegee card, alcohol wipe and dry cloth.',
      fit: 'Cut for each listed flagship, including the buttons, ports and camera island. Fits under our covers.',
      care: 'Fine scratches fade in warm weather. It peels off cleanly with no residue.',
    },
    models: FLAGSHIP_MODELS,
  },
];

/** Ready-made kits shown on cover pages: the cover plus these accessories. */
export interface BundleKit {
  id: string;
  name: string;
  blurb: string;
  accessoryIds: string[];
  /** Shown only for phones every listed accessory fits (the body film is flagship-only). */
  flagshipOnly?: boolean;
}

export const BUNDLE_KITS: readonly BundleKit[] = [
  { id: 'essentials', name: 'Essentials', blurb: 'Cover + screen glass', accessoryIds: ['glass-clear'] },
  { id: 'full', name: 'Full protection', blurb: 'Cover + screen glass + lens protector', accessoryIds: ['glass-clear', 'lens-glass'] },
  { id: 'privacy', name: 'Privacy pack', blurb: 'Cover + privacy glass + lens protector', accessoryIds: ['glass-privacy', 'lens-glass'] },
  {
    id: 'total',
    name: 'Total protection',
    blurb: 'Cover + body film + screen glass + lens protector',
    accessoryIds: ['body-film', 'glass-clear', 'lens-glass'],
    flagshipOnly: true,
  },
];

/** Kits that apply to this phone: flagship-only kits appear for flagships. */
export function kitsFor(modelSlug: string | null): BundleKit[] {
  return BUNDLE_KITS.filter((k) => !k.flagshipOnly || (modelSlug !== null && FLAGSHIP_MODELS.includes(modelSlug)));
}
