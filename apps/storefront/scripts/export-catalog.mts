// Writes the storefront's built-in catalogue (src/lib/medusa/fixtures.ts) to apps/backend/data/catalog.json,
// which the Medusa seed script (apps/backend/src/scripts/seed.ts) loads into the database.
// Run with `pnpm catalog:export` after changing photo-catalog.json or the design catalogue.
import fs from 'node:fs/promises';
import path from 'node:path';
import { photoSrc } from '../src/lib/catalog/photos';
import { ACCESSORY_TYPE_LABEL } from '../src/lib/catalog/accessories';
import { ACCESSORY_DETAILS, CASE_TYPES, PHONE_MODELS, PRODUCT_DETAILS, THEMES } from '../src/lib/medusa/fixtures';

const OUT = path.resolve(import.meta.dirname, '../../backend/data/catalog.json');

const catalog = {
  phoneModels: PHONE_MODELS.map((m, rank) => ({
    slug: m.slug,
    brand: m.brand,
    name: m.model,
    series: m.series ?? null,
    releaseYear: m.releaseYear,
    islandStyle: m.islandStyle,
    rank,
  })),
  themes: THEMES.map((t) => ({ handle: t.handle, name: t.name, blurb: t.blurb })),
  caseTypes: CASE_TYPES.map((c) => ({ type: c.type, name: c.name })),
  products: [
    ...PRODUCT_DETAILS.map((p) => ({
    handle: p.handle,
    productType: 'Phone cover',
    title: p.title,
    description: p.description,
    // Photographed covers get their photo as the product image (served by the storefront).
    imagePath: p.photo ? photoSrc(p.photo.id, 960) : null,
    collections: [
      ...(p.trendingRank !== undefined ? ['trending'] : []),
      ...(p.isNew ? ['new-arrivals'] : []),
    ],
    // Procedural designs belong to a theme category; photographed stock carries a placeholder theme.
    category: p.photo ? null : p.theme,
    tags: p.badge ? [p.badge] : [],
    metadata: {
      kind: p.photo ? 'photo' : 'design',
      ...(p.photo ? { photo_id: p.photo.id } : { design_id: p.designId }),
      family: p.family,
      theme: p.theme,
      finish: p.finish,
      holo: p.holo,
      ...(p.badge ? { badge: p.badge } : {}),
      ...(p.isNew ? { is_new: true } : {}),
      ...(p.trendingRank !== undefined ? { trending_rank: p.trendingRank } : {}),
      ...(p.brandLine ? { brand_line: p.brandLine } : {}),
      ...(p.regularInr !== undefined ? { regular_inr: p.regularInr } : {}),
      case_types: p.caseTypes.join(','),
      detail_material: p.details.material,
      detail_print: p.details.print,
      detail_fit: p.details.fit,
      detail_care: p.details.care,
    },
    variants: p.variants.map((v) => ({
      sku: v.sku,
      modelSlug: v.modelSlug,
      caseType: v.caseType,
      priceInr: v.priceInr,
      stock: v.stock,
    })),
  })),
    ...ACCESSORY_DETAILS.map((p) => {
      const a = p.accessory!;
      return {
        handle: p.handle,
        productType: ACCESSORY_TYPE_LABEL[a.type],
        title: p.title,
        description: p.description,
        imagePath: null,
        collections: [],
        category: null,
        tags: [],
        metadata: {
          kind: 'accessory',
          accessory_id: a.id,
          accessory_type: a.type,
          regular_inr: a.regularInr,
          detail_material: a.details.material,
          detail_in_box: a.details.inBox,
          detail_fit: a.details.fit,
          detail_care: a.details.care,
        },
        variants: p.variants.map((v) => ({
          sku: v.sku,
          modelSlug: v.modelSlug,
          caseType: null,
          priceInr: v.priceInr,
          stock: v.stock,
        })),
      };
    }),
  ],
};

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, `${JSON.stringify(catalog, null, 2)}\n`);
const variantCount = catalog.products.reduce((n, p) => n + p.variants.length, 0);
console.log(
  `Wrote ${catalog.products.length} products, ${variantCount} variants and ${catalog.phoneModels.length} phone models to ${path.relative(process.cwd(), OUT)}`,
);
