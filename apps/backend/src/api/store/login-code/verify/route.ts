import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'
import { customerToken, ensureCustomerAccount } from '../../../../lib/customer-account'
import { checkLoginCode } from '../../../../lib/login-code'
import { loadOrders } from '../../../../lib/orders'
import { allow } from '../../../../lib/rate-limit'
import { emailEnabled, normaliseEmail } from '../../../../lib/shop'

/**
 * POST /store/login-code/verify { email, code } → a customer session token. The account is created on the
 * spot when this email has none yet, with the name, phone and delivery addresses of its past orders.
 */
export async function POST(req: MedusaRequest<{ email?: string; code?: string }>, res: MedusaResponse) {
  if (!emailEnabled()) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Email sign-in is not available yet')
  const email = normaliseEmail(req.body?.email)
  const code = String(req.body?.code ?? '').replace(/\s/g, '')
  if (!email || !/^\d{6}$/.test(code)) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Enter the 6-digit code from the email')
  if (!allow(`verify:${email}`, 10, 60 * 60 * 1000)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Too many attempts. Request a new code in a few minutes.')
  }
  if (!checkLoginCode(email, code)) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'That code is wrong or has expired')

  try {
    const past = await loadOrders(req.scope, { email }, 10)
    const latest = past.find((o) => o.address)?.address
    const account = await ensureCustomerAccount(req.scope, {
      email,
      firstName: latest?.firstName,
      lastName: latest?.lastName,
      phone: latest?.phone,
      addresses: past.map((o) => o.address).filter((a): a is NonNullable<typeof a> => Boolean(a)),
    })
    const { token, expiresAt } = customerToken(req.scope, account)
    res.json({ token, expires_at: expiresAt })
  } catch (error) {
    req.scope.resolve(ContainerRegistrationKeys.LOGGER).error(`Sign-in for an email account failed: ${(error as Error).message}`)
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'We could not sign you in. Please try again.')
  }
}
