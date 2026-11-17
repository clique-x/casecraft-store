import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { ensureCustomerAccount } from '../lib/customer-account'
import { orderPlacedEmail } from '../lib/email/order-emails'
import { sendEmail } from '../lib/email/send'
import { loadOrder } from '../lib/orders'

/**
 * After an order: the shopper gets an account under their email (with their name, phone and this delivery
 * address saved), and the order confirmation by email. No password is created or sent: they sign in later
 * with a one-time code emailed to the same address.
 */
export default async function orderPlaced({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const order = await loadOrder(container, data.id)
  if (!order?.email) return

  try {
    await ensureCustomerAccount(container, {
      email: order.email,
      firstName: order.address?.firstName,
      lastName: order.address?.lastName,
      phone: order.address?.phone,
      addresses: order.address ? [order.address] : [],
    })
  } catch (error) {
    logger.error(`Could not set up the account for order #${order.displayId}: ${(error as Error).message}`)
  }

  try {
    await sendEmail(container, {
      to: order.email,
      template: 'order-placed',
      email: orderPlacedEmail(order),
      idempotencyKey: `order-placed:${order.id}`,
      resource: { id: order.id, type: 'order' },
      trigger: 'order.placed',
    })
  } catch (error) {
    logger.error(`Order confirmation email for #${order.displayId} failed: ${(error as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: 'order.placed' }
