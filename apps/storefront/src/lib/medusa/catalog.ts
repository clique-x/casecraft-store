import { cacheLife, cacheTag } from 'next/cache';
import { PHOTOS, type PhotoEntry } from '@/lib/catalog/photos';
import { DESIGNS } from '@/lib/designs/catalog';
import { MEDUSA_REGION_ID, medusaEnabled, sdk } from './client';
import { PHONE_MODELS, PRODUCT_DETAILS, type CaseType, type PhoneModel, type ProductDetail, type Variant } from './fixtures';

/** Tag on every cached catalogue read; POST /api/revalidate expires it after an admin change. */
export const CATALOG_TAG = 'catalog';

export interface Catalog {
  products: ProductDetail[];
  phoneModels: PhoneModel[];
}

/**
 * The whole catalogue, read once and cached until Medusa reports a change. With ~40 designs and
 * ~400 variants one read is cheaper than many per-page queries, and every page sees the same data.
 */
export async function getCatalog(): Promise<Catalog> {
  'use cache';
  cacheTag(CATALOG_TAG);
  cacheLife('hours');
  return medusaEnabled ? fetchMedusaCatalog() : { products: [...PRODUCT_DETAILS], phoneModels: [...PHONE_MODELS] };
}

/**
 * Handles for src/proxy.ts. The proxy runs outside the `use cache` scope, so it keeps its own
 * short-lived copy instead; a product added in the admin is reachable within a minute.
 */
const HANDLES_TTL_MS = 60_000;
let handlesMemo: { at: number; handles: Promise<string[]> } | null = null;

export function getCatalogHandles(): Promise<string[]> {
  if (!medusaEnabled) return Promise.resolve(PRODUCT_DETAILS.map((p) => p.handle));
  const now = Date.now();
  if (handlesMemo && now - handlesMemo.at < HANDLES_TTL_MS) return handlesMemo.handles;
  const handles = fetchProductHandles();
  handlesMemo = { at: now, handles };
  // A failed read must not be remembered for a minute.
  handles.catch(() => {
    if (handlesMemo?.handles === handles) handlesMemo = null;
  });
  return handles;
}

// --- Medusa reads ---------------------------------------------------------------------------------

/** Fields the store API returns; `*variants` is needed because a narrower list drops variant metadata. */
const PRODUCT_FIELDS = 'id,handle,title,description,metadata,*tags,*variants,*variants.calculated_price,+variants.inventory_quantity';
const PAGE_SIZE = 100;

type Metadata = Record<string, unknown> | null | undefined;

interface MedusaVariant {
  id: string;
  sku: string | null;
  manage_inventory?: boolean | null;
  inventory_quantity?: number | null;
  metadata?: Metadata;
  calculated_price?: { calculated_amount?: number | null } | null;
}

interface MedusaProduct {
  id: string;
  handle: string;
  title: string;
  description: string | null;
  metadata?: Metadata;
  tags?: { value: string }[] | null;
  variants?: MedusaVariant[] | null;
}

interface MedusaPhoneModel {
  slug: string;
  brand: string;
  name: string;
  series: string | null;
  release_year: number;
  island_style: PhoneModel['islandStyle'];
}

async function fetchMedusaCatalog(): Promise<Catalog> {
  const [phoneModels, products] = await Promise.all([fetchPhoneModels(), fetchAllProducts()]);
  const modelRank = new Map(phoneModels.map((m, i) => [m.slug, i]));
  const mapped = products
    .map((p) => toProductDetail(p, modelRank))
    .filter((p): p is ProductDetail => p !== null)
    .sort(byCatalogueOrder);
  return { products: mapped, phoneModels };
}

async function fetchPhoneModels(): Promise<PhoneModel[]> {
  const { phone_models } = await sdk!.client.fetch<{ phone_models: MedusaPhoneModel[] }>('/store/phone-models');
  return phone_models.map((m) => ({
    slug: m.slug,
    brand: m.brand,
    model: m.name,
    ...(m.series ? { series: m.series } : {}),
    releaseYear: m.release_year,
    islandStyle: m.island_style,
  }));
}

async function fetchAllProducts(): Promise<MedusaProduct[]> {
  const all: MedusaProduct[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { products, count } = await sdk!.store.product.list({
      region_id: MEDUSA_REGION_ID,
      fields: PRODUCT_FIELDS,
      limit: PAGE_SIZE,
      offset,
    });
    all.push(...(products as unknown as MedusaProduct[]));
    if (offset + PAGE_SIZE >= count) return all;
  }
}

async function fetchProductHandles(): Promise<string[]> {
  const handles: string[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { products, count } = await sdk!.store.product.list({ fields: 'handle', limit: PAGE_SIZE, offset });
    handles.push(...products.map((p) => p.handle));
    if (offset + PAGE_SIZE >= count) return handles;
  }
}

// --- Mapping Medusa products onto the storefront's types ----------------------------------------

const PHOTO_INDEX = new Map(PHOTOS.map((p, i) => [p.id, i]));
const DESIGN_INDEX = new Map(DESIGNS.map((d, i) => [d.id, i]));
const CASE_TYPE_ORDER: readonly CaseType[] = ['soft', 'glass'];
/** Stock shown for variants that do not track inventory in Medusa. */
const UNTRACKED_STOCK = 99;

function str(meta: Metadata, key: string): string | undefined {
  const v = meta?.[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

/** Admin metadata edits store everything as strings, so numbers and booleans accept both forms. */
function num(meta: Metadata, key: string): number | undefined {
  const v = meta?.[key];
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function bool(meta: Metadata, key: string): boolean {
  const v = meta?.[key];
  return v === true || v === 'true';
}

function isCaseType(v: unknown): v is CaseType {
  return v === 'soft' || v === 'glass';
}

function toVariant(v: MedusaVariant): Variant | null {
  const modelSlug = str(v.metadata, 'model_slug');
  const caseType = v.metadata?.case_type;
  const price = v.calculated_price?.calculated_amount;
  if (!modelSlug || !isCaseType(caseType) || typeof price !== 'number') return null;
  const stock = v.manage_inventory === false ? UNTRACKED_STOCK : Math.max(0, v.inventory_quantity ?? 0);
  return { id: v.id, sku: v.sku ?? v.id, modelSlug, caseType, priceInr: price, stock };
}

/**
 * Photographed covers render their photo from the local photo catalogue and procedural covers
 * their design, so a Medusa product needs a matching `photo_id` or `design_id` in its metadata.
 * Products without one (e.g. created in the admin before their artwork exists) are skipped.
 */
function toProductDetail(p: MedusaProduct, modelRank: Map<string, number>): ProductDetail | null {
  const meta = p.metadata;
  const photoId = num(meta, 'photo_id');
  const photo: PhotoEntry | undefined = photoId !== undefined ? PHOTOS.find((e) => e.id === photoId) : undefined;
  const design = photo ? undefined : DESIGNS.find((d) => d.id === str(meta, 'design_id'));
  if (!photo && !design) {
    console.warn(`[medusa] Skipping product "${p.handle}": no known photo_id or design_id in its metadata`);
    return null;
  }

  const variants = (p.variants ?? [])
    .map(toVariant)
    .filter((v): v is Variant => v !== null && modelRank.has(v.modelSlug))
    .sort(
      (a, b) =>
        modelRank.get(a.modelSlug)! - modelRank.get(b.modelSlug)! ||
        CASE_TYPE_ORDER.indexOf(a.caseType) - CASE_TYPE_ORDER.indexOf(b.caseType),
    );
  if (variants.length === 0) {
    console.warn(`[medusa] Skipping product "${p.handle}": no priced variants for a known phone model`);
    return null;
  }

  const fitsModels = [...new Set(variants.map((v) => v.modelSlug))];
  const priceFromInr = Math.min(...variants.map((v) => v.priceInr));
  const tagBadge = p.tags?.find((t) => t.value === 'bestseller' || t.value === 'limited')?.value;
  const badge = (str(meta, 'badge') ?? tagBadge) as ProductDetail['badge'];
  const trendingRank = num(meta, 'trending_rank');
  const caseTypesMeta = str(meta, 'case_types')?.split(',').filter(isCaseType);
  const caseTypes: CaseType[] = caseTypesMeta ?? (photo ? [] : CASE_TYPE_ORDER.filter((t) => variants.some((v) => v.caseType === t)));
  const regularInr = num(meta, 'regular_inr');
  const brandLine = str(meta, 'brand_line');

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    description: p.description ?? '',
    designId: photo ? `photo_${photo.id}` : design!.id,
    family: photo ? 'minimal' : design!.family,
    theme: photo ? 'minimal' : design!.theme,
    finish: photo ? 'soft' : design!.finish,
    holo: photo ? false : design!.holo,
    priceFromInr,
    ...(badge === 'bestseller' || badge === 'limited' ? { badge } : {}),
    ...(bool(meta, 'is_new') ? { isNew: true } : {}),
    ...(trendingRank !== undefined ? { trendingRank } : {}),
    fitsModels,
    ...(photo
      ? {
          photo,
          ...(brandLine ? { brandLine } : {}),
          ...(regularInr !== undefined ? { regularInr } : {}),
          stock: Math.max(...variants.map((v) => v.stock)),
        }
      : {}),
    caseTypes,
    variants,
    details: {
      material: str(meta, 'detail_material') ?? '',
      print: str(meta, 'detail_print') ?? '',
      fit: str(meta, 'detail_fit') ?? '',
      care: str(meta, 'detail_care') ?? '',
    },
  };
}

/** Same order as the sample catalogue: photographed covers first, each in its catalogue order. */
function byCatalogueOrder(a: ProductDetail, b: ProductDetail): number {
  const rank = (p: ProductDetail) =>
    p.photo ? (PHOTO_INDEX.get(p.photo.id) ?? 0) : PHOTOS.length + (DESIGN_INDEX.get(p.designId) ?? 0);
  return rank(a) - rank(b);
}
