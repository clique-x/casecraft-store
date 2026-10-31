import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * Tells the storefront to drop its cached catalogue whenever products, prices or stock change,
 * so admin edits show up without a redeploy. Admin price edits arrive as `product-variant.updated`.
 * Needs STOREFRONT_URL and STOREFRONT_REVALIDATE_SECRET.
 */
export default async function revalidateStorefront({ event, container }: SubscriberArgs<unknown>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const url = process.env.STOREFRONT_URL
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET
  if (!url || !secret) return

  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/api/revalidate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-revalidate-secret': secret },
      body: JSON.stringify({ tag: 'catalog', event: event.name }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) logger.warn(`Storefront revalidation after ${event.name} returned ${res.status}`)
  } catch (error) {
    logger.warn(`Storefront revalidation after ${event.name} failed: ${(error as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: [
    'product.created',
    'product.updated',
    'product.deleted',
    'product-variant.created',
    'product-variant.updated',
    'product-variant.deleted',
    'inventory-level.created',
    'inventory-level.updated',
    'inventory-level.deleted',
  ],
}
