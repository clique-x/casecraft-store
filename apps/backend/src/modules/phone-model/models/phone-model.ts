import { model } from '@medusajs/framework/utils'

/** A phone the store makes covers for. Drives the phone picker and "shop by phone" pages. */
export const PhoneModel = model
  .define('phone_model', {
    id: model.id({ prefix: 'phm' }).primaryKey(),
    /** URL-safe key used in variant metadata and the `my_phone` cookie, e.g. `iphone-16-pro`. */
    slug: model.text().unique(),
    brand: model.text(),
    /** Display name, e.g. "iPhone 16 Pro". Also the value of the product option "Phone Model". */
    name: model.text(),
    series: model.text().nullable(),
    release_year: model.number(),
    /** Camera island shape the 3D viewer draws: square, pills or circle. */
    island_style: model.enum(['square', 'pills', 'circle']).default('square'),
    /** Order in the picker; lower comes first. */
    rank: model.number().default(0),
    is_active: model.boolean().default(true),
  })
  .indexes([{ on: ['rank'] }])
