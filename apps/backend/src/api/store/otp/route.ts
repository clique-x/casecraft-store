import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'
import { allow, normaliseIndianMobile, otpEnabled, sendCode } from '../../../lib/phone-otp'

/** GET /store/otp → whether phone login is available (the storefront hides it otherwise). */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({ enabled: otpEnabled() })
}

/** POST /store/otp { phone } → sends a login code by SMS. */
export async function POST(req: MedusaRequest<{ phone?: string }>, res: MedusaResponse) {
  if (!otpEnabled()) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Phone login is not available')
  const phone = normaliseIndianMobile(req.body?.phone)
  if (!phone) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Enter a 10-digit Indian mobile number')
  if (!allow(`send:${phone}`, 3, 10 * 60 * 1000) || !allow(`ip:${req.ip}`, 10, 60 * 60 * 1000)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Too many codes requested. Try again in a few minutes.')
  }
  try {
    await sendCode(phone)
  } catch (error) {
    req.scope.resolve(ContainerRegistrationKeys.LOGGER).error(`OTP send failed: ${(error as Error).message}`)
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'We could not send the code. Please try again.')
  }
  res.json({ sent: true })
}
