import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { adminResetEmail } from '../lib/email/admin-reset'
import { sendEmail } from '../lib/email/send'
import { adminUrl } from '../lib/shop'

/**
 * Emails the admin dashboard's "Forgot password?" link. Customers have no passwords (they sign in with an
 * emailed code), so only admin users get one.
 */
export default async function passwordReset({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {
  if (data.actor_type !== 'user') return
  const link = `${adminUrl()}/reset-password?${new URLSearchParams({ token: data.token, email: data.entity_id })}`
  try {
    await sendEmail(container, { to: data.entity_id, template: 'admin-password-reset', email: adminResetEmail(link), trigger: 'auth.password_reset' })
  } catch (error) {
    container.resolve(ContainerRegistrationKeys.LOGGER).error(`Admin password reset email failed: ${(error as Error).message}`)
  }
}

export const config: SubscriberConfig = { event: 'auth.password_reset' }
