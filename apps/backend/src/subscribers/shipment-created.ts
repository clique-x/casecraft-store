import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { orderShippedEmail } from '../lib/email/order-emails'
import { sendEmail } from '../lib/email/send'
import { loadOrder } from '../lib/orders'

/**
 * "Your order is on its way" when a fulfilment is marked as shipped in the admin (Orders → the order →
 * Fulfillment → Mark as shipped, with the courier's tracking number and link). Skipped when the admin
 * unticks "Send notification".
 */
export default async function shipmentCreated({ event: { data }, container }: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  if (data.no_notification) return
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  try {
    const { data: rows } = await query.graph({ entity: 'fulfillment', fields: ['id', 'order.id'], filters: { id: data.id } })
    const orderId = (rows[0] as { order?: { id?: string } } | undefined)?.order?.id
    const order = orderId ? await loadOrder(container, orderId) : null
    const shipment = order?.shipments.find((s) => s.fulfillmentId === data.id)
    if (!order?.email || !shipment) return
    await sendEmail(container, {
      to: order.email,
      template: 'order-shipped',
      email: orderShippedEmail(order, shipment),
      idempotencyKey: `order-shipped:${data.id}`,
      resource: { id: order.id, type: 'order' },
      trigger: 'shipment.created',
    })
  } catch (error) {
    logger.error(`Shipping email for fulfillment ${data.id} failed: ${(error as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: 'shipment.created' }
