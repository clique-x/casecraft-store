import type { PhoneModel } from '@/lib/medusa/fixtures';
import raw from './photo-catalog.json';

export type PhotoCut = 'faded' | 'full';
export type PhotoLook = 'carbon-and-aramid' | 'sparkle' | 'animal-print' | 'gradient' | 'print' | 'solid' | 'clear' | 'stand';
export type PhotoWidth = 320 | 480 | 720 | 960;

export interface PhotoEntry {
  id: number;
  slug: string;
  brand: string;
  series: string;
  design: string;
  title: string;
  priceInr: number;
  regularInr: number;
  models: string[];
  modelSlugs: string[];
  modelLabel: string;
  image: string;
  imageW: number;
  imageH: number;
  cut: PhotoCut;
  heroEligible: boolean;
  heroRank?: number;
  trendingRank?: number;
  isNew?: boolean;
  look: PhotoLook;
  tags?: string[];
  features: [string, string, string];
  featureAnchor?: [number, number];
  angles?: string[];
  /** Hand-held card shots at /products/photos/<id>/shot-<n>-<w>.webp; 0 is front-on. */
  shots?: number;
  /**
   * Square product-page gallery at /products/photos/<id>/g-<n>-<w>.webp, one label per image in
   * display order: the back on its own first, then in hand, then the rest, the spec card last.
   */
  gallery?: string[];
  /** Shell material line for the product details; a generic line is used when absent. */
  material?: string;
  /** What the finish or artwork is, for the product details; a generic line is used when absent. */
  print?: string;
  /**
   * False when the transparent cutout is not clean enough to stand on its own: the cover then stays out
   * of the home hero and the product page opens on its gallery instead of the tilt stage.
   */
  stage?: boolean;
  stock?: number;
  hidden?: boolean;
  variants: number[];
  source: string;
}

export const PHOTO_WIDTHS: readonly PhotoWidth[] = [320, 480, 720, 960];
/** The `src` candidate every `<img>` starts from; the browser upgrades through `srcset`. */
export const PHOTO_DEFAULT_WIDTH: PhotoWidth = 480;
export const DEFAULT_FEATURE_ANCHOR: readonly [number, number] = [0.32, 0.22];
export const DEFAULT_STOCK = 8;
/** Visible hero cast length per breakpoint (brief §1.11). */
export const HERO_COUNT = { lg: 6, phone: 5 } as const;
/** Shared by `castFor` and `heroChipModels` so every chip is guaranteed to narrow the cast. */
const MIN_CAST = 3;
const WIDE_ASPECT = 1.15;

/** Phone models that exist because a photographed cover fits them; `PHONE_MODELS` spreads them in. */
export const PHOTO_PHONE_MODELS: readonly PhoneModel[] = [
  { slug: 'iphone-13-pro', brand: 'Apple', model: 'iPhone 13 Pro', series: 'iPhone', releaseYear: 2021, islandStyle: 'square' },
  { slug: 'iphone-14', brand: 'Apple', model: 'iPhone 14', series: 'iPhone', releaseYear: 2022, islandStyle: 'square' },
  { slug: 'iphone-14-pro', brand: 'Apple', model: 'iPhone 14 Pro', series: 'iPhone', releaseYear: 2022, islandStyle: 'square' },
  { slug: 'iphone-15', brand: 'Apple', model: 'iPhone 15', series: 'iPhone', releaseYear: 2023, islandStyle: 'square' },
  { slug: 'iphone-15-pro', brand: 'Apple', model: 'iPhone 15 Pro', series: 'iPhone', releaseYear: 2023, islandStyle: 'square' },
  { slug: 'iphone-17-air', brand: 'Apple', model: 'iPhone 17 Air', series: 'iPhone', releaseYear: 2025, islandStyle: 'pills' },
  { slug: 'iphone-17-pro', brand: 'Apple', model: 'iPhone 17 Pro', series: 'iPhone', releaseYear: 2025, islandStyle: 'square' },
  { slug: 'iphone-18', brand: 'Apple', model: 'iPhone 18', series: 'iPhone', releaseYear: 2026, islandStyle: 'square' },
  { slug: 'iphone-18-pro', brand: 'Apple', model: 'iPhone 18 Pro', series: 'iPhone', releaseYear: 2026, islandStyle: 'square' },
  { slug: 'galaxy-s23-fe', brand: 'Samsung', model: 'Galaxy S23 FE', series: 'Galaxy S', releaseYear: 2023, islandStyle: 'pills' },
  { slug: 'galaxy-s23-ultra', brand: 'Samsung', model: 'Galaxy S23 Ultra', series: 'Galaxy S', releaseYear: 2023, islandStyle: 'pills' },
  { slug: 'galaxy-s24-ultra', brand: 'Samsung', model: 'Galaxy S24 Ultra', series: 'Galaxy S', releaseYear: 2024, islandStyle: 'pills' },
  { slug: 'galaxy-s25-ultra', brand: 'Samsung', model: 'Galaxy S25 Ultra', series: 'Galaxy S', releaseYear: 2025, islandStyle: 'pills' },
  { slug: 'pixel-9', brand: 'Google', model: 'Pixel 9', series: 'Pixel', releaseYear: 2024, islandStyle: 'pills' },
];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function fail(id: unknown, key: string, expected: string): never {
  throw new Error(`photo-catalog.json: item ${String(id)} field "${key}" must be ${expected}`);
}

function str(r: Record<string, unknown>, key: string): string {
  const v = r[key];
  return typeof v === 'string' ? v : fail(r.id, key, 'a string');
}

function num(r: Record<string, unknown>, key: string): number {
  const v = r[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : fail(r.id, key, 'a number');
}

function bool(r: Record<string, unknown>, key: string): boolean {
  const v = r[key];
  return typeof v === 'boolean' ? v : fail(r.id, key, 'a boolean');
}

function optNum(r: Record<string, unknown>, key: string): number | undefined {
  return r[key] === undefined ? undefined : num(r, key);
}

function optBool(r: Record<string, unknown>, key: string): boolean | undefined {
  return r[key] === undefined ? undefined : bool(r, key);
}

function strList(r: Record<string, unknown>, key: string): string[] {
  const v = r[key];
  return Array.isArray(v) && v.every((s): s is string => typeof s === 'string') ? v : fail(r.id, key, 'a string array');
}

function numList(r: Record<string, unknown>, key: string): number[] {
  const v = r[key];
  return Array.isArray(v) && v.every((n): n is number => typeof n === 'number') ? v : fail(r.id, key, 'a number array');
}

function cutOf(r: Record<string, unknown>): PhotoCut {
  const v = r.cut;
  return v === 'faded' || v === 'full' ? v : fail(r.id, 'cut', "'faded' or 'full'");
}

const LOOKS: readonly PhotoLook[] = ['carbon-and-aramid', 'sparkle', 'animal-print', 'gradient', 'print', 'solid', 'clear', 'stand'];

function lookOf(r: Record<string, unknown>): PhotoLook {
  const v = r.look;
  return LOOKS.find((l) => l === v) ?? fail(r.id, 'look', `one of ${LOOKS.join(', ')}`);
}

function featuresOf(r: Record<string, unknown>): [string, string, string] {
  const list = strList(r, 'features');
  return list.length === 3 ? [list[0], list[1], list[2]] : fail(r.id, 'features', 'three strings');
}

function anchorOf(r: Record<string, unknown>): [number, number] | undefined {
  if (r.featureAnchor === undefined) return undefined;
  const list = numList(r, 'featureAnchor');
  return list.length === 2 ? [list[0], list[1]] : fail(r.id, 'featureAnchor', 'two numbers');
}

function parseEntry(v: unknown): PhotoEntry {
  if (!isRecord(v)) throw new Error('photo-catalog.json: every item must be an object');
  const entry: PhotoEntry = {
    id: num(v, 'id'),
    slug: str(v, 'slug'),
    brand: str(v, 'brand'),
    series: str(v, 'series'),
    design: str(v, 'design'),
    title: str(v, 'title'),
    priceInr: num(v, 'priceInr'),
    regularInr: num(v, 'regularInr'),
    models: strList(v, 'models'),
    modelSlugs: strList(v, 'modelSlugs'),
    modelLabel: str(v, 'modelLabel'),
    image: str(v, 'image'),
    imageW: num(v, 'imageW'),
    imageH: num(v, 'imageH'),
    cut: cutOf(v),
    heroEligible: bool(v, 'heroEligible'),
    look: lookOf(v),
    features: featuresOf(v),
    variants: numList(v, 'variants'),
    source: str(v, 'source'),
  };
  const heroRank = optNum(v, 'heroRank');
  if (heroRank !== undefined) entry.heroRank = heroRank;
  const trendingRank = optNum(v, 'trendingRank');
  if (trendingRank !== undefined) entry.trendingRank = trendingRank;
  const isNew = optBool(v, 'isNew');
  if (isNew !== undefined) entry.isNew = isNew;
  if (v.tags !== undefined) entry.tags = strList(v, 'tags');
  const anchor = anchorOf(v);
  if (anchor) entry.featureAnchor = anchor;
  if (v.angles !== undefined) entry.angles = strList(v, 'angles');
  const shots = optNum(v, 'shots');
  if (shots !== undefined) entry.shots = shots;
  const stock = optNum(v, 'stock');
  if (stock !== undefined) entry.stock = stock;
  const hidden = optBool(v, 'hidden');
  if (hidden !== undefined) entry.hidden = hidden;
  if (v.gallery !== undefined) entry.gallery = strList(v, 'gallery');
  if (v.material !== undefined) entry.material = str(v, 'material');
  if (v.print !== undefined) entry.print = str(v, 'print');
  const stage = optBool(v, 'stage');
  if (stage !== undefined) entry.stage = stage;
  return entry;
}

const RAW: unknown = raw;
if (!Array.isArray(RAW)) throw new Error('photo-catalog.json must be an array');
const ALL: readonly PhotoEntry[] = RAW.map(parseEntry);

/** Every listed photo product; hidden items are filtered out. */
export const PHOTOS: readonly PhotoEntry[] = ALL.filter((e) => e.hidden !== true);

const BY_ID: ReadonlyMap<number, PhotoEntry> = new Map(PHOTOS.map((e) => [e.id, e]));
const BY_SLUG: ReadonlyMap<string, PhotoEntry> = new Map(PHOTOS.map((e) => [e.slug, e]));

function byRank(key: 'heroRank' | 'trendingRank') {
  return (a: PhotoEntry, b: PhotoEntry) => (a[key] ?? Infinity) - (b[key] ?? Infinity);
}

/** Hero-eligible covers by `heroRank`. */
export const HERO_ORDER: readonly PhotoEntry[] = PHOTOS.filter((e) => e.heroEligible).sort(byRank('heroRank'));

if (HERO_ORDER.length === 0) throw new Error('photo-catalog.json: at least one item must be heroEligible');

/** Hero cast for a phone: HERO_ORDER narrowed to covers that fit when that leaves ≥ 3, else the full order. */
export function castFor(modelSlug: string | null): PhotoEntry[] {
  if (modelSlug === null) return [...HERO_ORDER];
  const fits = HERO_ORDER.filter((e) => e.modelSlugs.includes(modelSlug));
  return fits.length >= MIN_CAST ? fits : [...HERO_ORDER];
}

/** Models with ≥ 3 hero-eligible covers (the cast threshold); the chip strip shows "All" plus one chip per model. */
export function heroChipModels(): PhoneModel[] {
  return PHOTO_PHONE_MODELS.filter(
    (m) => HERO_ORDER.filter((e) => e.modelSlugs.includes(m.slug)).length >= MIN_CAST,
  );
}

export function getTrendingPhotos(): PhotoEntry[] {
  return PHOTOS.filter((e) => e.trendingRank !== undefined).sort(byRank('trendingRank'));
}

export function getNewPhotos(): PhotoEntry[] {
  return PHOTOS.filter((e) => e.isNew === true).sort(byRank('trendingRank'));
}

export function getPhoto(idOrSlug: number | string): PhotoEntry | undefined {
  return typeof idOrSlug === 'number' ? BY_ID.get(idOrSlug) : BY_SLUG.get(idOrSlug);
}

export function photoSrc(id: number, w: PhotoWidth): string {
  return `/products/photos/${id}/${w}.webp`;
}

export function photoDefaultSrc(entry: PhotoEntry): string {
  return entry.variants.length > 0 ? photoSrc(entry.id, PHOTO_DEFAULT_WIDTH) : entry.image;
}

/**
 * Width descriptors are the real pixel widths: variants are never enlarged past the trimmed
 * original, so a 624 px photo advertises `720.webp 624w` once and skips the identical 960 file.
 */
export function srcSetFor(entry: PhotoEntry): string {
  if (entry.variants.length === 0) return `${entry.image} ${entry.imageW}w`;
  const candidates: string[] = [];
  let last = 0;
  for (const w of PHOTO_WIDTHS) {
    if (!entry.variants.includes(w)) continue;
    const actual = Math.min(w, entry.imageW);
    if (actual <= last) continue;
    last = actual;
    candidates.push(`${photoSrc(entry.id, w)} ${actual}w`);
  }
  return candidates.join(', ');
}

const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** "₹1,099" with Indian grouping. */
export function formatInr(n: number): string {
  return `₹${INR.format(n)}`;
}

export function featuresFor(entry: PhotoEntry): [string, string, string] {
  return entry.features;
}

export function featureAnchorFor(entry: PhotoEntry): readonly [number, number] {
  return entry.featureAnchor ?? DEFAULT_FEATURE_ANCHOR;
}

export function isWide(entry: PhotoEntry): boolean {
  return entry.imageW / entry.imageH > WIDE_ASPECT;
}

/** Alt text per brief §1.4. */
export function photoAlt(entry: PhotoEntry): string {
  return `${entry.design} ${entry.brand} ${entry.series} cover for ${entry.modelLabel}`;
}

/** Widths written by scripts/photo-shots.mjs; every shot is cropped to 4:5. */
export const SHOT_WIDTHS = [160, 480, 800] as const;

export function shotSrc(id: number, n: number, w: (typeof SHOT_WIDTHS)[number] = 480): string {
  return `/products/photos/${id}/shot-${n}-${w}.webp`;
}

export function shotSrcSet(id: number, n: number): string {
  return SHOT_WIDTHS.map((w) => `${shotSrc(id, n, w)} ${w}w`).join(', ');
}

/** Widths written by scripts/photo-gallery.mjs; every gallery image is square. 160 feeds the thumbnail strip. */
export const GALLERY_WIDTHS = [160, 480, 960, 1440] as const;

export function gallerySrc(id: number, n: number, w: (typeof GALLERY_WIDTHS)[number] = 960): string {
  return `/products/photos/${id}/g-${n}-${w}.webp`;
}

/**
 * A small image of a cover with its studio background: the front-on shot, else the first gallery
 * image, else the cutout. Thumbnails use it because a transparent cutout of a clear or frosted cover
 * turns to grain at small sizes.
 */
export function backdropThumbSrc(entry: PhotoEntry, w: 160 | 480 = 480): string {
  if ((entry.shots ?? 0) > 0) return shotSrc(entry.id, 0, w);
  if ((entry.gallery?.length ?? 0) > 0) return gallerySrc(entry.id, 0, w);
  return photoSrc(entry.id, 480);
}

export function backdropThumbSrcSet(entry: PhotoEntry): string {
  return `${backdropThumbSrc(entry, 160)} 160w, ${backdropThumbSrc(entry, 480)} 480w`;
}

export function gallerySrcSet(id: number, n: number): string {
  return GALLERY_WIDTHS.map((w) => `${gallerySrc(id, n, w)} ${w}w`).join(', ');
}
