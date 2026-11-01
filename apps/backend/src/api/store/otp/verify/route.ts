import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'
import { allow, checkCode, issuePass, normaliseIndianMobile, otpEnabled } from '../../../../lib/phone-otp'

/** POST /store/otp/verify { phone, code } → a 30-minute pass for reading this number's addresses. */
export async function POST(req: MedusaRequest<{ phone?: string; code?: string }>, res: MedusaResponse) {
  if (!otpEnabled()) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Phone login is not available')
  const phone = normaliseIndianMobile(req.body?.phone)
  const code = String(req.body?.code ?? '').trim()
  if (!phone || !/^\d{4,10}$/.test(code)) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Enter the code from the SMS')
  if (!allow(`check:${phone}`, 5, 10 * 60 * 1000)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Too many attempts. Request a new code in a few minutes.')
  }
  let approved: boolean
  try {
    approved = await checkCode(phone, code)
  } catch (error) {
    req.scope.resolve(ContainerRegistrationKeys.LOGGER).error(`OTP check failed: ${(error as Error).message}`)
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'We could not check the code. Please try again.')
  }
  if (!approved) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'That code is wrong or has expired')
  const { token, expiresAt } = issuePass(phone)
  res.json({ token, expires_at: expiresAt })
}
