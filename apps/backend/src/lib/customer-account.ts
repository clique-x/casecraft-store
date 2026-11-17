import type { ICustomerModuleService, MedusaContainer } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules, generateJwtToken } from '@medusajs/framework/utils'
import { createCustomerAccountWorkflow } from '@medusajs/medusa/core-flows'
import type { OrderAddress } from './orders'

/** The auth provider name on accounts that sign in with an emailed one-time code. */
export const EMAIL_CODE_PROVIDER = 'email-code'
const SESSION_DAYS = 30
const MAX_SAVED_ADDRESSES = 6

export interface AccountDetails {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  /** Delivery addresses to save for the next checkout (already saved ones are skipped). */
  addresses?: OrderAddress[]
}

export interface Account {
  customerId: string
  authIdentityId: string
}

/**
 * The customer account for an email address, created when it does not exist yet: a registered customer
 * (has_account) linked to an auth identity that signs in with an emailed code, so there is no password to
 * send or forget. Called after every order and at sign-in; it also fills a missing name or phone and saves
 * the delivery address for the next checkout.
 */
export async function ensureCustomerAccount(container: MedusaContainer, details: AccountDetails): Promise<Account> {
  const auth = container.resolve(Modules.AUTH)
  const customers = container.resolve(Modules.CUSTOMER)
  const email = details.email.trim().toLowerCase()

  const authIdentityId = await authIdentityFor(container, email)
  const identity = await auth.retrieveAuthIdentity(authIdentityId)
  let customerId = typeof identity.app_metadata?.customer_id === 'string' ? identity.app_metadata.customer_id : null
  if (customerId && (await customers.listCustomers({ id: customerId }, { select: ['id'] })).length === 0) customerId = null

  if (!customerId) {
    const [existing] = await customers.listCustomers({ email, has_account: true }, { select: ['id'] })
    if (existing) {
      customerId = existing.id
      await auth.updateAuthIdentities({ id: authIdentityId, app_metadata: { ...(identity.app_metadata ?? {}), customer_id: existing.id } })
    } else {
      const { result } = await createCustomerAccountWorkflow(container).run({
        input: {
          authIdentityId,
          customerData: {
            email,
            first_name: details.firstName || undefined,
            last_name: details.lastName || undefined,
            phone: details.phone || undefined,
          },
        },
      })
      customerId = result.id
    }
  }

  await fillBlanks(customers, customerId, details)
  for (const address of details.addresses ?? []) {
    if (!address.address1 || !address.postalCode) continue
    await saveAddress(customers, customerId, address).catch((error: Error) =>
      container.resolve(ContainerRegistrationKeys.LOGGER).warn(`Could not save an address for ${customerId}: ${error.message}`),
    )
  }
  return { customerId, authIdentityId }
}

/** The email-code auth identity for this address, created on first use (twice at once: the second one reads it back). */
async function authIdentityFor(container: MedusaContainer, email: string): Promise<string> {
  const auth = container.resolve(Modules.AUTH)
  const find = async () => (await auth.listProviderIdentities({ provider: EMAIL_CODE_PROVIDER, entity_id: email }))[0]?.auth_identity_id
  const found = await find()
  if (found) return found
  try {
    const created = await auth.createAuthIdentities({ provider_identities: [{ provider: EMAIL_CODE_PROVIDER, entity_id: email }] })
    return created.id
  } catch (error) {
    const again = await find()
    if (again) return again
    throw error
  }
}

async function fillBlanks(customers: ICustomerModuleService, id: string, d: AccountDetails): Promise<void> {
  const c = await customers.retrieveCustomer(id, { select: ['id', 'first_name', 'last_name', 'phone'] })
  const update: Record<string, string> = {}
  if (!c.first_name && d.firstName) update.first_name = d.firstName
  if (!c.last_name && d.lastName) update.last_name = d.lastName
  if (!c.phone && d.phone) update.phone = d.phone
  if (Object.keys(update).length > 0) await customers.updateCustomers(id, update)
}

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ')

async function saveAddress(customers: ICustomerModuleService, customerId: string, a: OrderAddress): Promise<void> {
  const saved = await customers.listCustomerAddresses({ customer_id: customerId })
  const same = saved.some(
    (s) => norm(s.address_1) === norm(a.address1) && norm(s.postal_code) === norm(a.postalCode) && norm(s.phone) === norm(a.phone),
  )
  if (same || saved.length >= MAX_SAVED_ADDRESSES) return
  await customers.createCustomerAddresses({
    customer_id: customerId,
    first_name: a.firstName,
    last_name: a.lastName,
    address_1: a.address1,
    address_2: a.address2 || undefined,
    city: a.city,
    province: a.province,
    postal_code: a.postalCode,
    country_code: 'in',
    phone: a.phone,
    is_default_shipping: saved.length === 0,
  })
}

/** A customer session token, the same kind Medusa's own login returns, valid for SESSION_DAYS. */
export function customerToken(container: MedusaContainer, account: Account): { token: string; expiresAt: number } {
  const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig
  const token = generateJwtToken(
    {
      actor_id: account.customerId,
      actor_type: 'customer',
      auth_identity_id: account.authIdentityId,
      auth_provider: EMAIL_CODE_PROVIDER,
      mfa_enabled: false,
      mfa_challenge_completed_at: null,
      app_metadata: { customer_id: account.customerId },
      user_metadata: {},
    },
    { secret: http.jwtSecret, expiresIn: `${SESSION_DAYS}d`, jwtOptions: http.jwtOptions },
  )
  return { token, expiresAt: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000 }
}
