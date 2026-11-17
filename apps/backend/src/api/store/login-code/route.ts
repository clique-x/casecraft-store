import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'
import { loginCodeEmail } from '../../../lib/email/login-code'
import { sendEmail } from '../../../lib/email/send'
import { dropLoginCode, issueLoginCode } from '../../../lib/login-code'
import { allow, clientIp } from '../../../lib/rate-limit'
import { emailEnabled, normaliseEmail } from '../../../lib/shop'

/** GET /store/login-code → whether email sign-in is available (the storefront hides it otherwise). */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({ enabled: emailEnabled() })
}

/**
 * POST /store/login-code { email } → emails a 6-digit sign-in code. Answers the same whether or not the address
 * has ordered before, so it does not reveal who shops here.
 */
export async function POST(req: MedusaRequest<{ email?: string }>, res: MedusaResponse) {
  if (!emailEnabled()) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Email sign-in is not available yet')
  const email = normaliseEmail(req.body?.email)
  if (!email) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Enter a valid email address')

  const ok =
    allow(`code:${email}`, 3, 10 * 60 * 1000) &&
    allow(`code-day:${email}`, 10, 24 * 60 * 60 * 1000) &&
    allow(`code-ip:${clientIp(req.headers, req.ip)}`, 20, 60 * 60 * 1000) &&
    allow('code-all', 300, 60 * 60 * 1000)
  if (!ok) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Too many codes requested. Try again in a few minutes.')

  const code = issueLoginCode(email)
  try {
    await sendEmail(req.scope, { to: email, template: 'login-code', email: loginCodeEmail(code), trigger: 'login-code' })
  } catch (error) {
    dropLoginCode(email)
    req.scope.resolve(ContainerRegistrationKeys.LOGGER).error(`Sign-in code email failed: ${(error as Error).message}`)
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'We could not send the code. Please try again.')
  }
  res.json({ sent: true })
}
