import type { MedusaContainer } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import { emailEnabled } from '../shop'
import type { RenderedEmail } from './layout'

export interface EmailRequest {
  to: string
  template: string
  email: RenderedEmail
  /** Sends at most once per key (a retried event does not email twice). */
  idempotencyKey?: string
  resource?: { id: string; type: string }
  trigger?: string
}

/**
 * Sends one email through the notification module (the smtp-email provider). Returns false, sending nothing,
 * while email is not configured. Only ids go into the stored notification record, never the rendered email.
 */
export async function sendEmail(container: MedusaContainer, req: EmailRequest): Promise<boolean> {
  if (!emailEnabled()) return false
  const notifications = container.resolve(Modules.NOTIFICATION)
  await notifications.createNotifications({
    to: req.to,
    channel: 'email',
    template: req.template,
    content: { subject: req.email.subject, html: req.email.html, text: req.email.text },
    data: req.resource ? { [`${req.resource.type}_id`]: req.resource.id } : {},
    idempotency_key: req.idempotencyKey,
    resource_id: req.resource?.id,
    resource_type: req.resource?.type,
    trigger_type: req.trigger,
  })
  return true
}
