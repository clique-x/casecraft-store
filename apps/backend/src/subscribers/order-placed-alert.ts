import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { orderAlertEmail, orderAlertWhatsapp } from '../lib/email/order-emails'
import { sendEmail } from '../lib/email/send'
import { loadOrder } from '../lib/orders'
import { orderAlertEmails, orderAlertWhatsappNumbers } from '../lib/shop'
import { sendWhatsapp, whatsappEnabled } from '../lib/whatsapp'

/**
 * Tells the shop's owner about every new order: an email to ORDER_ALERT_EMAILS and a WhatsApp message to
 * ORDER_ALERT_WHATSAPP. Each one is sent on its own, so a failure of one does not hold back the others or the
 * customer's confirmation (subscribers/order-placed.ts).
 */
export default async function orderPlacedAlert({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const order = await loadOrder(container, data.id)
  if (!order) return

  for (const to of orderAlertEmails()) {
    try {
      await sendEmail(container, {
        to,
        template: 'order-alert',
        email: orderAlertEmail(order),
        idempotencyKey: `order-alert:${order.id}:${to}`,
        resource: { id: order.id, type: 'order' },
        trigger: 'order.placed',
      })
    } catch (error) {
      logger.error(`New-order email to ${to} for #${order.displayId} failed: ${(error as Error).message}`)
    }
  }

  if (!whatsappEnabled()) return
  const message = orderAlertWhatsapp(order)
  for (const to of orderAlertWhatsappNumbers()) {
    try {
      await sendWhatsapp({ to, body: message.body, templateSid: process.env.TWILIO_WHATSAPP_ORDER_TEMPLATE_SID || undefined, variables: message.variables })
    } catch (error) {
      logger.error(`New-order WhatsApp to ${to} for #${order.displayId} failed: ${(error as Error).message}`)
    }
  }
}

export const config: SubscriberConfig = { event: 'order.placed' }
