import { SHOP_CITY } from '@/lib/brand';
import { ACCESSORIES, ACCESSORY_TYPE_LABEL, type AccessoryEntry } from '@/lib/catalog/accessories';
import { DEPARTMENT_OF, GADGETS, GADGET_TYPE_LABEL, optionPrice, type GadgetEntry } from '@/lib/catalog/gadgets';
import { DEFAULT_STOCK, PHOTO_PHONE_MODELS, PHOTOS, type PhotoEntry } from '@/lib/catalog/photos';
import { DESIGNS, type Family, type Finish, type ThemeHandle } from '@/lib/designs/catalog';

export interface PhoneModel {
  slug: string;
  brand: string;
  model: string;
  series?: string;
  releaseYear: number;
  islandStyle: 'square' | 'pills' | 'circle';
}

export interface Theme {
  handle: ThemeHandle;
  name: string;
  blurb: string;
  designIds: string[];
}

export interface HomeProduct {
  id: string;
  handle: string;
  title: string;
  designId: string;
  family: Family;
  theme: ThemeHandle;
  priceFromInr: number;
  badge?: 'bestseller' | 'limited';
  isNew?: boolean;
  trendingRank?: number;
  fitsModels: string[];
  holo: boolean;
  finish: Finish;
  /** Present on photographed stock; cards and the product page render the photo instead of a procedural design. */
  photo?: PhotoEntry;
  /** "Luxo Nano Fiber Magsafe": the maker and series line under a photo card. */
  brandLine?: string;
  /** Struck through on cards only when higher than the price. */
  regularInr?: number;
  stock?: number;
  /** Present on screen guards, lens protectors and back films (lib/catalog/accessories.ts). */
  accessory?: AccessoryEntry;
  /** Present on wireless audio, chargers and cables (lib/catalog/gadgets.ts). */
  gadget?: GadgetEntry;
}

export type PhotoProduct = HomeProduct & { photo: PhotoEntry };

export function hasPhoto(product: HomeProduct): product is PhotoProduct {
  return product.photo !== undefined;
}

const BASE_PHONE_MODELS: readonly PhoneModel[] = [
  { slug: 'iphone-16', brand: 'Apple', model: 'iPhone 16', series: 'iPhone', releaseYear: 2024, islandStyle: 'square' },
  { slug: 'iphone-16-pro', brand: 'Apple', model: 'iPhone 16 Pro', series: 'iPhone', releaseYear: 2024, islandStyle: 'square' },
  { slug: 'iphone-17', brand: 'Apple', model: 'iPhone 17', series: 'iPhone', releaseYear: 2025, islandStyle: 'square' },
  { slug: 'galaxy-s25', brand: 'Samsung', model: 'Galaxy S25', series: 'Galaxy S', releaseYear: 2025, islandStyle: 'pills' },
  { slug: 'galaxy-a56', brand: 'Samsung', model: 'Galaxy A56', series: 'Galaxy A', releaseYear: 2025, islandStyle: 'pills' },
  { slug: 'oneplus-13', brand: 'OnePlus', model: 'OnePlus 13', releaseYear: 2025, islandStyle: 'circle' },
  { slug: 'oneplus-nord-ce4', brand: 'OnePlus', model: 'OnePlus Nord CE4', series: 'Nord', releaseYear: 2024, islandStyle: 'pills' },
  { slug: 'redmi-note-14-pro', brand: 'Xiaomi', model: 'Redmi Note 14 Pro', series: 'Redmi Note', releaseYear: 2025, islandStyle: 'circle' },
  { slug: 'redmi-note-13', brand: 'Xiaomi', model: 'Redmi Note 13', series: 'Redmi Note', releaseYear: 2024, islandStyle: 'square' },
  { slug: 'realme-13-pro', brand: 'Realme', model: 'Realme 13 Pro', series: 'Number', releaseYear: 2024, islandStyle: 'circle' },
  { slug: 'realme-14-pro', brand: 'Realme', model: 'Realme 14 Pro', series: 'Number', releaseYear: 2025, islandStyle: 'circle' },
  { slug: 'vivo-v40', brand: 'Vivo', model: 'Vivo V40', series: 'V', releaseYear: 2024, islandStyle: 'circle' },
  { slug: 'vivo-v50', brand: 'Vivo', model: 'Vivo V50', series: 'V', releaseYear: 2025, islandStyle: 'pills' },
  { slug: 'nothing-phone-3a', brand: 'Nothing', model: 'Nothing Phone (3a)', series: 'Phone', releaseYear: 2025, islandStyle: 'pills' },
  { slug: 'pixel-9a', brand: 'Google', model: 'Pixel 9a', series: 'Pixel', releaseYear: 2025, islandStyle: 'pills' },
];

export const PHONE_MODELS: readonly PhoneModel[] = [...BASE_PHONE_MODELS, ...PHOTO_PHONE_MODELS];

const THEME_META: readonly { handle: ThemeHandle; name: string; blurb: string }[] = [
  { handle: 'marble', name: 'Marble', blurb: 'Veined stone finishes that look carved, not printed.' },
  { handle: 'holographic', name: 'Holographic', blurb: 'Rainbow sheen that shifts every time the phone turns.' },
  { handle: 'abstract', name: 'Abstract', blurb: 'Aurora ribbons and deep-space gradients.' },
  { handle: 'aesthetic', name: 'Aesthetic', blurb: 'Y2K checkers, stickers and candy colours.' },
  { handle: 'quotes', name: 'Quotes', blurb: 'Four words, big type, your whole mood.' },
  { handle: 'minimal', name: 'Minimal', blurb: 'One line, one dot, warm off-white calm.' },
];

export const THEMES: readonly Theme[] = THEME_META.map((meta) => ({
  ...meta,
  designIds: DESIGNS.filter((d) => d.theme === meta.handle).map((d) => d.id),
}));

// Deterministic per-design subset of 9–15 model slugs (mulberry32 on the design seed).
function fitsFor(seed: number): string[] {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const slugs = BASE_PHONE_MODELS.map((m) => m.slug);
  for (let i = slugs.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [slugs[i], slugs[j]] = [slugs[j], slugs[i]];
  }
  const count = 9 + Math.floor(rand() * 7);
  const picked = new Set(slugs.slice(0, count));
  return BASE_PHONE_MODELS.filter((m) => picked.has(m.slug)).map((m) => m.slug);
}

/** Photographed stock, in catalogue order. The placeholder family/theme only satisfies the type. */
export const PHOTO_PRODUCTS: readonly HomeProduct[] = PHOTOS.map((photo) => ({
  id: `photo_${photo.id}`,
  handle: photo.slug,
  title: photo.title,
  designId: `photo_${photo.id}`,
  family: 'minimal',
  theme: 'minimal',
  priceFromInr: photo.priceInr,
  ...(photo.isNew ? { isNew: true } : {}),
  ...(photo.trendingRank !== undefined ? { trendingRank: photo.trendingRank } : {}),
  fitsModels: [...photo.modelSlugs],
  holo: false,
  finish: 'soft',
  photo,
  brandLine: `${photo.brand} ${photo.series}`,
  regularInr: photo.regularInr,
  stock: photo.stock ?? DEFAULT_STOCK,
}));

export const PROCEDURAL_PRODUCTS: readonly HomeProduct[] = DESIGNS.map((d) => ({
  id: `prod_${d.id}`,
  handle: d.handle,
  title: d.name,
  designId: d.id,
  family: d.family,
  theme: d.theme,
  priceFromInr: d.priceFromInr,
  ...(d.badge ? { badge: d.badge } : {}),
  ...(d.isNew ? { isNew: true } : {}),
  ...(d.trendingRank !== undefined ? { trendingRank: d.trendingRank } : {}),
  fitsModels: fitsFor(d.seed),
  holo: d.holo,
  finish: d.finish,
}));

export const PRODUCTS: readonly HomeProduct[] = [...PHOTO_PRODUCTS, ...PROCEDURAL_PRODUCTS];

export type CaseType = 'soft' | 'glass';

export interface CaseTypeInfo {
  type: CaseType;
  name: string;
  blurb: string;
  priceDeltaInr: number;
}

export const CASE_TYPES: readonly CaseTypeInfo[] = [
  { type: 'soft', name: 'Soft silicone', blurb: 'Flexible TPU, matte print, raised lip', priceDeltaInr: 0 },
  { type: 'glass', name: 'Glass back', blurb: 'Tempered glass, glossy print, TPU bumper', priceDeltaInr: 150 },
];

export interface Variant {
  id: string;
  sku: string;
  modelSlug: string;
  caseType: CaseType;
  priceInr: number;
  stock: number;
}

export interface ProductDetail extends HomeProduct {
  description: string;
  caseTypes: CaseType[];
  variants: Variant[];
  details: { material: string; print: string; fit: string; care: string };
}

interface FamilyCopy {
  description: (name: string) => string;
  print: string;
}

const FAMILY_COPY: Record<Family, FamilyCopy> = {
  marble: {
    description: (name) =>
      `${name} takes the look of polished stone: veins that split and rejoin, a little depth under the surface, and a quiet base colour that does not shout. The veining is drawn for this cover rather than scanned from a slab, so it stays crisp at the corners where photographs of stone go soft.`,
    print:
      'Full-bleed veined pattern carried over the sides, so the stone does not stop at the edge. Matte on silicone; under glass the veins pick up a soft depth.',
  },
  holo: {
    description: (name) =>
      `${name} is a pale, near-silver base with a thin-film sheen on top. Tilt the phone and the sheen walks across the back in a slow band of colour; hold it still and it reads as a clean pearl grey.`,
    print:
      'A fine prismatic layer sits over the printed base. The colour shift comes from the layer itself, not from a picture of a rainbow, so it moves with the light in your hand.',
  },
  aurora: {
    description: (name) =>
      `${name} is a near-black sky with ribbons of colour folded through it, soft at the edges and brighter where they cross. The composition is weighted toward the lower half so the camera island sits in the dark.`,
    print:
      'Smooth gradients with no visible banding. The darkest areas print as true black rather than dark grey, which keeps the ribbons looking lit from behind.',
  },
  y2k: {
    description: (name) =>
      `${name} is sharp geometry in candy colours: a grid that warps as it crosses the back, with a second colour showing through the gaps. It reads loud from across the room and clean up close.`,
    print:
      'Hard-edged shapes with high contrast. Edges are vector-sharp, a full row meets the top edge, and the warp is centred on the back rather than drifting toward a corner.',
  },
  quote: {
    description: (name) =>
      `${name} puts four words at most in large display type, tipped a few degrees so the back reads as a sticker rather than a label. The ground is a single warm colour with a faint texture so the letters have something to sit on.`,
    print:
      'Bold display type with a hard drop shadow in a second colour. Letterforms are printed from vectors, so the edges stay crisp and the shadow never blurs.',
  },
  sticker: {
    description: (name) =>
      `${name} is a scatter of hand-drawn stickers piled over a bright base, each with its own white border and a hint of shadow. They are arranged so the camera island covers nothing you would miss.`,
    print:
      'Flat colours with white sticker borders and a soft drop shadow, printed as one layer. Nothing is raised or applied, so there are no edges to catch or peel.',
  },
  minimal: {
    description: (name) =>
      `${name} is one mark on an off-white ground: a line, an arc or a dot, placed low and slightly off-centre. The ground carries a faint paper grain so the back does not read as blank plastic.`,
    print:
      'A single-colour mark on a warm off-white field. The grain is printed, not embossed, so the surface stays smooth and the mark stays exactly where it was placed.',
  },
};

const MATERIAL_SOFT =
  'Flexible TPU, 1.5 mm across the back and thicker at the corners, with a matte-touch finish that does not hold fingerprints. It bends to go on and off and settles back flat.';
const MATERIAL_SOFT_AND_GLASS =
  'Soft silicone: flexible TPU, 1.5 mm across the back, matte-touch. Glass back: 0.6 mm tempered glass bonded to a TPU bumper, printed on the underside so the art sits behind the glass and cannot wear.';
const CARE_SOFT =
  'Wipe with a damp cloth and a drop of mild soap. Keep it out of direct sun for long stretches, since TPU yellows slowly under UV. Do not use alcohol or acetone on the print.';
const CARE_SOFT_AND_GLASS =
  'Wipe with a damp cloth and a drop of mild soap; a dry microfibre cloth keeps the glass streak-free. Keep it out of direct sun for long stretches. Do not use alcohol or acetone on the print.';

function fitCopy(modelCount: number): string {
  return `Cut for each of the ${modelCount} listed models: the camera opening follows that phone's island and the buttons and ports stay open. A 1.2 mm lip runs around the screen and the camera so the phone rests on the case, not on glass.`;
}

// SKU codes: DESIGN-MODEL-TYPE, e.g. MDNG-IP16P-SOFT.
function designCode(handle: string): string {
  const consonants = handle.replace(/[^a-z]/g, '').replace(/[aeiou]/g, '').toUpperCase();
  return `${consonants}XXXX`.slice(0, 4);
}

function modelCode(slug: string): string {
  return slug
    .split('-')
    .map((part, i) => {
      if (/\d/.test(part)) return part.toUpperCase();
      return i === 0 ? part.slice(0, 2).toUpperCase() : part.slice(0, 1).toUpperCase();
    })
    .join('');
}

function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function unit(seed: number, key: string): number {
  let t = (hash32(key) ^ seed) >>> 0;
  t = (t + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Mostly 6–40; about 1 in 6 is 1–3 ("Only N left"); about 1 in 10 is 0 ("Sold out").
function stockFor(seed: number, modelSlug: string, type: CaseType): number {
  const key = `${modelSlug}:${type}`;
  const r = unit(seed, key);
  if (r < 0.1) return 0;
  if (r < 0.1 + 1 / 6) return 1 + Math.floor(unit(seed, `${key}:low`) * 3);
  return 6 + Math.floor(unit(seed, `${key}:full`) * 35);
}

function variantsFor(product: HomeProduct, seed: number, caseTypes: CaseType[]): Variant[] {
  const design = designCode(product.handle);
  const variants: Variant[] = [];
  for (const modelSlug of product.fitsModels) {
    for (const caseType of caseTypes) {
      const info = CASE_TYPES.find((c) => c.type === caseType);
      const sku = `${design}-${modelCode(modelSlug)}-${caseType.toUpperCase()}`;
      variants.push({
        id: `variant_${sku.toLowerCase()}`,
        sku,
        modelSlug,
        caseType,
        priceInr: product.priceFromInr + (info?.priceDeltaInr ?? 0),
        stock: stockFor(seed, modelSlug, caseType),
      });
    }
  }
  if (variants.length > 0 && variants.every((v) => v.stock === 0)) variants[0].stock = 12;
  return variants;
}

function proceduralDetail(product: HomeProduct): ProductDetail {
  const design = DESIGNS.find((d) => d.id === product.designId);
  const seed = design?.seed ?? hash32(product.handle);
  const caseTypes: CaseType[] = product.finish === 'glass' ? ['soft', 'glass'] : ['soft'];
  const copy = FAMILY_COPY[product.family];
  const glass = caseTypes.includes('glass');
  return {
    ...product,
    description: copy.description(product.title),
    caseTypes,
    variants: variantsFor(product, seed, caseTypes),
    details: {
      material: glass ? MATERIAL_SOFT_AND_GLASS : MATERIAL_SOFT,
      print: copy.print,
      fit: fitCopy(product.fitsModels.length),
      care: glass ? CARE_SOFT_AND_GLASS : CARE_SOFT,
    },
  };
}

const LOOK_COPY: Record<PhotoEntry['look'], string> = {
  'carbon-and-aramid': 'The back is a thin aramid-fibre weave with a raised ring around the camera.',
  sparkle: 'The glitter is set into the shell itself, so it does not flake or rub off.',
  'animal-print': 'The pattern is part of the woven back, not a printed film.',
  gradient: 'Two colours fade into each other across the back, with the weave showing through.',
  solid: 'One colour, a textured grip and a fold-out stand on the back.',
};

const MATERIAL_ARAMID = 'Aramid fibre (nano fibre) shell with a soft inner lining';
const MATERIAL_SILICONE = 'Textured silicone with a fold-out stand';
const PRINT_PHOTO = 'The finish in the photo is the shell itself; nothing is printed on afterwards.';
const CARE_PHOTO = 'Wipe with a damp cloth and a drop of mild soap. Do not use alcohol or acetone on the shell.';

function photoDescription(photo: PhotoEntry): string {
  const hinge = photo.tags?.includes('hinge') ? ' A separate hinge piece covers the spine when the phone is folded.' : '';
  return `${photo.design} is a ${photo.brand} ${photo.series} cover for the ${photo.modelLabel}, photographed in our ${SHOP_CITY} shop. ${LOOK_COPY[photo.look]}${hinge}`;
}

function photoVariants(photo: PhotoEntry): Variant[] {
  return photo.modelSlugs.map((modelSlug) => {
    const sku = `PH-${photo.id}-${modelCode(modelSlug)}`;
    return {
      id: `variant_${sku.toLowerCase()}`,
      sku,
      modelSlug,
      caseType: 'soft',
      priceInr: photo.priceInr,
      stock: photo.stock ?? DEFAULT_STOCK,
    };
  });
}

function photoDetail(product: HomeProduct, photo: PhotoEntry): ProductDetail {
  return {
    ...product,
    description: photoDescription(photo),
    caseTypes: [],
    variants: photoVariants(photo),
    details: {
      material: photo.brand === 'Borluco' ? MATERIAL_SILICONE : MATERIAL_ARAMID,
      print: PRINT_PHOTO,
      fit: `Made for the ${photo.modelLabel}. The camera opening follows that phone's island and the buttons and ports stay open.`,
      care: CARE_PHOTO,
    },
  };
}

export const PRODUCT_DETAILS: readonly ProductDetail[] = PRODUCTS.map((product) =>
  product.photo ? photoDetail(product, product.photo) : proceduralDetail(product),
);

// --- accessories ---------------------------------------------------------------------------------

const ACCESSORY_STOCK = 25;

/** "glass-privacy" → "GLAPRI": three letters of each part, unique across the accessory list. */
function accessoryCode(id: string): string {
  return id
    .split('-')
    .map((part) => part.slice(0, 3))
    .join('')
    .toUpperCase();
}

/** One variant per phone model; accessories have no case type, so `soft` only fills the field. */
function accessoryDetail(entry: AccessoryEntry): ProductDetail {
  const fitsModels = PHONE_MODELS.map((m) => m.slug).filter((slug) => !entry.models || entry.models.includes(slug));
  return {
    id: `acc_${entry.id}`,
    handle: entry.handle,
    title: entry.title,
    designId: `acc_${entry.id}`,
    family: 'minimal',
    theme: 'minimal',
    priceFromInr: entry.priceInr,
    regularInr: entry.regularInr,
    fitsModels,
    holo: false,
    finish: 'soft',
    brandLine: ACCESSORY_TYPE_LABEL[entry.type],
    accessory: entry,
    description: entry.description,
    caseTypes: [],
    variants: fitsModels.map((modelSlug) => {
      const sku = `ACC-${accessoryCode(entry.id)}-${modelCode(modelSlug)}`;
      return {
        id: `variant_${sku.toLowerCase()}`,
        sku,
        modelSlug,
        caseType: 'soft' as const,
        priceInr: entry.priceInr,
        stock: ACCESSORY_STOCK,
      };
    }),
    details: {
      material: entry.details.material,
      print: entry.details.inBox,
      fit: entry.details.fit,
      care: entry.details.care,
    },
  };
}

export const ACCESSORY_DETAILS: readonly ProductDetail[] = ACCESSORIES.map(accessoryDetail);

// --- gadgets: wireless audio, chargers, cables -----------------------------------------------------

const GADGET_STOCK = 15;
const SKU_PREFIX = { audio: 'AUD', charging: 'CHG' } as const;

/**
 * One variant per option (colour or cable length). Gadgets do not fit one phone, so `modelSlug`
 * carries the option slug: the shared selection store, cart and sticky bar then work unchanged.
 * `fitsModels` stays empty.
 */
function gadgetDetail(entry: GadgetEntry): ProductDetail {
  const prefix = SKU_PREFIX[DEPARTMENT_OF[entry.type]];
  const code = entry.id.toUpperCase().replace(/-/g, '');
  const variants = entry.options.map((o) => {
    const sku = `${prefix}-${code}-${o.slug.toUpperCase()}`;
    return { id: `variant_${sku.toLowerCase()}`, sku, modelSlug: o.slug, caseType: 'soft' as const, priceInr: optionPrice(entry, o).priceInr, stock: GADGET_STOCK };
  });
  return {
    id: `gad_${entry.id}`,
    handle: entry.handle,
    title: entry.title,
    designId: `gad_${entry.id}`,
    family: 'minimal',
    theme: 'minimal',
    priceFromInr: Math.min(...variants.map((v) => v.priceInr)),
    regularInr: optionPrice(entry, entry.options[0]).regularInr,
    fitsModels: [],
    holo: false,
    finish: 'soft',
    brandLine: entry.original ? `Original ${entry.original.brand}` : GADGET_TYPE_LABEL[entry.type],
    gadget: entry,
    description: entry.description,
    caseTypes: [],
    variants,
    details: { material: '', print: entry.inBox, fit: '', care: '' },
  };
}

export const GADGET_DETAILS: readonly ProductDetail[] = GADGETS.map(gadgetDetail);
