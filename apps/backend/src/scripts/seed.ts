import fs from 'node:fs'
import path from 'node:path'
import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules, ProductStatus } from '@medusajs/framework/utils'
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductTagsWorkflow,
  createProductTypesWorkflow,
  createPromotionsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateProductsWorkflow,
  updateRegionsWorkflow,
  updateStoresWorkflow,
} from '@medusajs/medusa/core-flows'
import { PHONE_MODEL_MODULE } from '../modules/phone-model'
import type PhoneModelModuleService from '../modules/phone-model/service'

/** Shape of data/catalog.json, written by `pnpm --filter storefront catalog:export`. */
interface Catalog {
  phoneModels: {
    slug: string
    brand: string
    name: string
    series: string | null
    releaseYear: number
    islandStyle: 'square' | 'pills' | 'circle'
    rank: number
  }[]
  themes: { handle: string; name: string; blurb: string }[]
  caseTypes: { type: string; name: string }[]
  products: {
    handle: string
    /** "Phone cover", "Screen guard", "Camera lens protector" or "Back film"; the bundle promotion keys on it. */
    productType: string
    title: string
    description: string
    imagePath: string | null
    collections: string[]
    category: string | null
    tags: string[]
    metadata: Record<string, string | number | boolean>
    variants: { sku: string; modelSlug: string; caseType: string | null; priceInr: number; stock: number }[]
  }[]
}

const STORE_NAME = 'CaseCraft'
const SALES_CHANNEL_NAME = 'Web store'
const LOCATION_NAME = 'Home warehouse'
const REGION_NAME = 'India'
/** Matches FREE_SHIPPING_THRESHOLD_INR in apps/storefront/src/lib/brand.ts. */
const FREE_SHIPPING_THRESHOLD_INR = 499
/** Placeholder until the shipping fee is decided (store-spec.md §11, question 5). */
const SHIPPING_FEE_INR = 49

/** Bundle price: this much off each accessory when the cart also has a phone cover. Matches the storefront. */
const BUNDLE_CODE = 'BUNDLE50'
const BUNDLE_SAVING_INR = 50
const COVER_TYPE = 'Phone cover'

const COLLECTIONS = [
  { handle: 'trending', title: 'Trending' },
  { handle: 'new-arrivals', title: 'New arrivals' },
]

/**
 * Sets up the India store and loads the storefront's catalogue. Safe to run again: existing
 * records are found by name, handle or slug and left alone, so admin edits are never overwritten.
 *
 *   pnpm --filter backend seed
 */
export default async function seed({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const fulfillment = container.resolve(Modules.FULFILLMENT)
  const storeModule = container.resolve(Modules.STORE)
  const phoneModels = container.resolve<PhoneModelModuleService>(PHONE_MODEL_MODULE)

  const catalogPath = path.resolve(process.cwd(), 'data/catalog.json')
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as Catalog
  const storefrontUrl = (process.env.STOREFRONT_URL || 'http://localhost:3000').replace(/\/$/, '')

  // Store, sales channel and publishable key -----------------------------------------------------
  // `medusa db:migrate` already creates a store, a default sales channel and a publishable key.
  // Adopt those (renamed for CaseCraft) rather than creating parallel ones the key would not see.
  let [store] = await storeModule.listStores({}, { take: 1, relations: ['supported_currencies'] })
  if (!store) {
    const { result } = await createStoresWorkflow(container).run({
      input: { stores: [{ name: STORE_NAME, supported_currencies: [{ currency_code: 'inr', is_default: true }] }] },
    })
    store = result[0]
  }

  let salesChannelId = store.default_sales_channel_id
  if (!salesChannelId) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: SALES_CHANNEL_NAME, description: 'The CaseCraft storefront' }] },
    })
    salesChannelId = result[0].id
  }
  await container.resolve(Modules.SALES_CHANNEL).updateSalesChannels(salesChannelId, {
    name: SALES_CHANNEL_NAME,
    description: 'The CaseCraft storefront',
  })

  const inrIsDefault = store.supported_currencies?.some((c) => c?.currency_code === 'inr' && c.is_default)
  if (store.name !== STORE_NAME || !inrIsDefault || store.default_sales_channel_id !== salesChannelId) {
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: {
          name: STORE_NAME,
          supported_currencies: [{ currency_code: 'inr', is_default: true }],
          default_sales_channel_id: salesChannelId,
        },
      },
    })
    logger.info(`Store is "${STORE_NAME}", selling in INR through "${SALES_CHANNEL_NAME}"`)
  }

  const [existingKey] = (
    await query.graph({ entity: 'api_key', fields: ['id', 'sales_channels.id'], filters: { type: 'publishable' } })
  ).data
  let apiKeyId = existingKey?.id
  if (!apiKeyId) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: { api_keys: [{ title: 'Storefront', type: 'publishable', created_by: '' }] },
    })
    apiKeyId = result[0].id
    logger.info('Created publishable API key "Storefront"')
  }
  if (!existingKey?.sales_channels?.some((sc) => sc?.id === salesChannelId)) {
    await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: apiKeyId, add: [salesChannelId] } })
  }

  // Region and tax --------------------------------------------------------------------------------
  let regionId = (await query.graph({ entity: 'region', fields: ['id'], filters: { name: REGION_NAME } })).data[0]?.id
  if (!regionId) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: REGION_NAME,
            currency_code: 'inr',
            countries: ['in'],
            // Cash on Delivery uses Medusa's manual provider until the Razorpay provider exists.
            payment_providers: ['pp_system_default'],
            is_tax_inclusive: true,
          },
        ],
      },
    })
    regionId = result[0].id
    // No default rate yet: confirm the GST rate and HSN code for phone cases with your CA (store-spec.md §3).
    await createTaxRegionsWorkflow(container).run({ input: [{ country_code: 'in', provider_id: 'tp_system' }] })
    logger.info('Created region "India" (INR, prices include tax)')
  }

  // Razorpay joins Cash on Delivery once its keys are configured (medusa-config.ts).
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const { data: regions } = await query.graph({
      entity: 'region',
      fields: ['id', 'payment_providers.id'],
      filters: { id: regionId },
    })
    const current = (regions[0]?.payment_providers ?? []).map((p) => p?.id).filter((id): id is string => Boolean(id))
    if (!current.includes('pp_razorpay_razorpay')) {
      await updateRegionsWorkflow(container).run({
        input: { selector: { id: regionId }, update: { payment_providers: [...current, 'pp_razorpay_razorpay'] } },
      })
      logger.info('Enabled Razorpay for the India region')
    }
  }

  // Stock location and shipping -------------------------------------------------------------------
  let locationId = (await query.graph({ entity: 'stock_location', fields: ['id'], filters: { name: LOCATION_NAME } })).data[0]?.id
  if (!locationId) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: { locations: [{ name: LOCATION_NAME, address: { city: 'Haridwar', country_code: 'IN', address_1: '' } }] },
    })
    locationId = result[0].id
    await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: locationId, add: [salesChannelId] } })
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: locationId },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: 'manual_manual' },
    })

    const fulfillmentSet = await fulfillment.createFulfillmentSets({
      name: 'Home warehouse delivery',
      type: 'shipping',
      service_zones: [{ name: 'India', geo_zones: [{ country_code: 'in', type: 'country' }] }],
    })
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: locationId },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    })

    const [shippingProfile] = (await query.graph({ entity: 'shipping_profile', fields: ['id'] })).data
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: 'Standard delivery',
          price_type: 'flat',
          provider_id: 'manual_manual',
          service_zone_id: fulfillmentSet.service_zones[0].id,
          shipping_profile_id: shippingProfile.id,
          type: { label: 'Standard', description: 'Dispatched in 24–72 hours.', code: 'standard' },
          prices: [
            { currency_code: 'inr', amount: SHIPPING_FEE_INR },
            {
              currency_code: 'inr',
              amount: 0,
              rules: [{ attribute: 'item_total', operator: 'gte', value: FREE_SHIPPING_THRESHOLD_INR }],
            },
          ],
          rules: [
            { attribute: 'enabled_in_store', value: 'true', operator: 'eq' },
            { attribute: 'is_return', value: 'false', operator: 'eq' },
          ],
        },
      ],
    })
    logger.info(`Created "${LOCATION_NAME}" and Standard delivery (₹${SHIPPING_FEE_INR}, free from ₹${FREE_SHIPPING_THRESHOLD_INR})`)
  }

  // Phone models ----------------------------------------------------------------------------------
  const knownSlugs = new Set((await phoneModels.listPhoneModels({}, { select: ['slug'], take: null })).map((m) => m.slug))
  const newModels = catalog.phoneModels.filter((m) => !knownSlugs.has(m.slug))
  if (newModels.length > 0) {
    await phoneModels.createPhoneModels(
      newModels.map((m) => ({
        slug: m.slug,
        brand: m.brand,
        name: m.name,
        series: m.series,
        release_year: m.releaseYear,
        island_style: m.islandStyle,
        rank: m.rank,
      })),
    )
    logger.info(`Created ${newModels.length} phone models`)
  }
  const modelName = new Map(catalog.phoneModels.map((m) => [m.slug, m.name]))
  const caseTypeName = new Map(catalog.caseTypes.map((c) => [c.type, c.name]))

  // Product options, collections and categories ---------------------------------------------------
  const optionValues = {
    'Phone Model': catalog.phoneModels.map((m) => m.name),
    'Case Type': catalog.caseTypes.map((c) => c.name),
  }
  const { data: existingOptions } = await query.graph({ entity: 'product_option', fields: ['id', 'title', 'values.value'] })
  const optionIds: Record<string, string> = {}
  for (const [title, values] of Object.entries(optionValues)) {
    const existing = existingOptions.find((o) => o.title === title)
    if (existing) {
      optionIds[title] = existing.id
      const missing = values.filter((v) => !existing.values?.some((ev) => ev?.value === v))
      if (missing.length > 0) {
        logger.warn(`Option "${title}" is missing values ${missing.join(', ')}; add them in the admin before seeding those products`)
      }
      continue
    }
    const { result } = await createProductOptionsWorkflow(container).run({ input: { product_options: [{ title, values }] } })
    optionIds[title] = result[0].id
  }

  const { data: existingCollections } = await query.graph({ entity: 'product_collection', fields: ['id', 'handle'] })
  const missingCollections = COLLECTIONS.filter((c) => !existingCollections.some((e) => e.handle === c.handle))
  if (missingCollections.length > 0) {
    await createCollectionsWorkflow(container).run({ input: { collections: missingCollections } })
  }
  const collectionId = new Map(
    (await query.graph({ entity: 'product_collection', fields: ['id', 'handle'] })).data.map((c) => [c.handle, c.id]),
  )

  const { data: existingCategories } = await query.graph({ entity: 'product_category', fields: ['id', 'handle'] })
  const missingThemes = catalog.themes.filter((t) => !existingCategories.some((c) => c.handle === t.handle))
  if (missingThemes.length > 0) {
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missingThemes.map((t) => ({ name: t.name, handle: t.handle, description: t.blurb, is_active: true })),
      },
    })
  }
  const categoryId = new Map(
    (await query.graph({ entity: 'product_category', fields: ['id', 'handle'] })).data.map((c) => [c.handle, c.id]),
  )

  const tagValues = [...new Set(catalog.products.flatMap((p) => p.tags))]
  const { data: existingTags } = await query.graph({ entity: 'product_tag', fields: ['id', 'value'] })
  const missingTags = tagValues.filter((value) => !existingTags.some((t) => t.value === value))
  if (missingTags.length > 0) {
    await createProductTagsWorkflow(container).run({ input: { product_tags: missingTags.map((value) => ({ value })) } })
  }
  const tagId = new Map((await query.graph({ entity: 'product_tag', fields: ['id', 'value'] })).data.map((t) => [t.value, t.id]))

  // Product types -----------------------------------------------------------------------------------
  const typeNames = [...new Set(catalog.products.map((p) => p.productType))]
  const { data: existingTypes } = await query.graph({ entity: 'product_type', fields: ['id', 'value'] })
  const missingTypes = typeNames.filter((value) => !existingTypes.some((t) => t.value === value))
  if (missingTypes.length > 0) {
    await createProductTypesWorkflow(container).run({ input: { product_types: missingTypes.map((value) => ({ value })) } })
    logger.info(`Created product types: ${missingTypes.join(', ')}`)
  }
  const typeId = new Map((await query.graph({ entity: 'product_type', fields: ['id', 'value'] })).data.map((t) => [t.value, t.id]))

  // Products --------------------------------------------------------------------------------------
  const { data: existingProducts } = await query.graph({ entity: 'product', fields: ['handle'] })
  const existingHandles = new Set(existingProducts.map((p) => p.handle))
  const toCreate = catalog.products.filter((p) => !existingHandles.has(p.handle))
  const [shippingProfile] = (await query.graph({ entity: 'shipping_profile', fields: ['id'] })).data

  // Batches keep each workflow transaction small; 415 variants in one call is slow to roll back.
  const BATCH = 10
  for (let i = 0; i < toCreate.length; i += BATCH) {
    const batch = toCreate.slice(i, i + BATCH)
    await createProductsWorkflow(container).run({
      input: {
        products: batch.map((p) => {
          const imageUrl = p.imagePath ? `${storefrontUrl}${p.imagePath}` : undefined
          return {
            title: p.title,
            handle: p.handle,
            description: p.description,
            status: ProductStatus.PUBLISHED,
            shipping_profile_id: shippingProfile.id,
            ...(imageUrl ? { thumbnail: imageUrl, images: [{ url: imageUrl }] } : {}),
            ...(p.category && categoryId.has(p.category) ? { category_ids: [categoryId.get(p.category)!] } : {}),
            // Medusa allows one collection per product; trending wins, `is_new` metadata still flags new arrivals.
            ...(p.collections[0] ? { collection_id: collectionId.get(p.collections[0]) } : {}),
            ...(p.tags.length > 0 ? { tag_ids: p.tags.map((value) => tagId.get(value)!) } : {}),
            metadata: p.metadata,
            type_id: typeId.get(p.productType),
            // Accessories vary by phone model only.
            options: p.variants.some((v) => v.caseType)
              ? [{ id: optionIds['Phone Model'] }, { id: optionIds['Case Type'] }]
              : [{ id: optionIds['Phone Model'] }],
            sales_channels: [{ id: salesChannelId }],
            variants: p.variants.map((v) => ({
              title: v.caseType
                ? `${modelName.get(v.modelSlug) ?? v.modelSlug} / ${caseTypeName.get(v.caseType) ?? v.caseType}`
                : (modelName.get(v.modelSlug) ?? v.modelSlug),
              sku: v.sku,
              manage_inventory: true,
              allow_backorder: false,
              options: (v.caseType
                ? {
                    'Phone Model': modelName.get(v.modelSlug) ?? v.modelSlug,
                    'Case Type': caseTypeName.get(v.caseType) ?? v.caseType,
                  }
                : { 'Phone Model': modelName.get(v.modelSlug) ?? v.modelSlug }) as Record<string, string>,
              metadata: (v.caseType ? { model_slug: v.modelSlug, case_type: v.caseType } : { model_slug: v.modelSlug }) as Record<
                string,
                string
              >,
              prices: [{ currency_code: 'inr', amount: v.priceInr }],
            })),
          }
        }),
      },
    })
  }
  if (toCreate.length > 0) logger.info(`Created ${toCreate.length} products`)

  // Products created before product types existed get theirs now (the bundle promotion needs them).
  const { data: untyped } = await query.graph({ entity: 'product', fields: ['id', 'handle', 'type_id'] })
  const typeByHandle = new Map(catalog.products.map((p) => [p.handle, p.productType]))
  const byType = new Map<string, string[]>()
  for (const prod of untyped) {
    const wanted = typeByHandle.get(prod.handle)
    if (!wanted || prod.type_id) continue
    byType.set(wanted, [...(byType.get(wanted) ?? []), prod.id])
  }
  for (const [value, ids] of byType) {
    await updateProductsWorkflow(container).run({ input: { selector: { id: ids }, update: { type_id: typeId.get(value) } } })
    logger.info(`Set type "${value}" on ${ids.length} existing products`)
  }

  // Bundle promotion -------------------------------------------------------------------------------
  // Automatic: every accessory (screen guard, lens protector, back film) is ₹50 less when the same cart
  // holds a phone cover. Medusa re-checks it on every cart change, so removing the cover removes it.
  const { data: existingPromos } = await query.graph({ entity: 'promotion', fields: ['id'], filters: { code: BUNDLE_CODE } })
  if (existingPromos.length === 0) {
    const accessoryTypeIds = typeNames.filter((t) => t !== COVER_TYPE).map((t) => typeId.get(t)!)
    await createPromotionsWorkflow(container).run({
      input: {
        promotionsData: [
          {
            code: BUNDLE_CODE,
            type: 'standard',
            status: 'active',
            is_automatic: true,
            application_method: {
              type: 'fixed',
              value: BUNDLE_SAVING_INR,
              currency_code: 'inr',
              target_type: 'items',
              allocation: 'each',
              max_quantity: 10,
              target_rules: [{ attribute: 'items.product.type_id', operator: 'in', values: accessoryTypeIds }],
            },
            rules: [{ attribute: 'items.product.type_id', operator: 'in', values: [typeId.get(COVER_TYPE)!] }],
          },
        ],
      },
    })
    logger.info(`Created automatic promotion ${BUNDLE_CODE}: ₹${BUNDLE_SAVING_INR} off each accessory with a cover`)
  }

  // Stock: one inventory level at the home warehouse for every catalogue variant that has none yet.
  // Variants that already have a level keep their (possibly admin-edited) count.
  const stockBySku = new Map(catalog.products.flatMap((p) => p.variants.map((v) => [v.sku, v.stock] as const)))
  if (stockBySku.size > 0) {
    const { data: items } = await query.graph({
      entity: 'inventory_item',
      fields: ['id', 'sku', 'location_levels.location_id'],
      filters: { sku: [...stockBySku.keys()] },
    })
    const levels = items
      .filter((item) => !item.location_levels?.some((l) => l?.location_id === locationId))
      .map((item) => ({ inventory_item_id: item.id, location_id: locationId, stocked_quantity: stockBySku.get(item.sku!) ?? 0 }))
    if (levels.length > 0) {
      await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: levels } })
      logger.info(`Stocked ${levels.length} variants at "${LOCATION_NAME}"`)
    }
  }

  const { data: keys } = await query.graph({ entity: 'api_key', fields: ['token'], filters: { type: 'publishable' } })
  logger.info('Seed finished. Put these in apps/storefront/.env.local:')
  logger.info(`  MEDUSA_BACKEND_URL=${process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'}`)
  logger.info(`  MEDUSA_PUBLISHABLE_KEY=${keys[0]?.token ?? '<create one in Settings → Publishable API Keys>'}`)
  logger.info(`  MEDUSA_REGION_ID=${regionId}`)
}
