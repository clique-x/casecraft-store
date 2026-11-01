import crypto from 'node:crypto'

/**
 * Phone login for guests: Twilio Verify sends and checks the code; after a correct code the
 * shop issues a short signed pass that lets this phone number read its own past addresses.
 *
 * Needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID. Without the
 * Service SID the feature reports itself disabled and the storefront hides it.
 */
const VERIFY_BASE = (process.env.TWILIO_VERIFY_BASE_URL || 'https://verify.twilio.com').replace(/\/$/, '')
const PASS_TTL_MS = 30 * 60 * 1000

export function otpEnabled(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID)
}

/** "98765 43210", "+91 9876543210" → "+919876543210"; null when it is not an Indian mobile number. */
export function normaliseIndianMobile(input: unknown): string | null {
  const digits = String(input ?? '').replace(/\D/g, '').replace(/^(?:91|0)(?=\d{10}$)/, '')
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null
}

async function twilio(path: string, form: Record<string, string>): Promise<{ status?: string; message?: string; code?: number }> {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  const service = process.env.TWILIO_VERIFY_SERVICE_SID!
  const res = await fetch(`${VERIFY_BASE}/v2/Services/${service}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(form).toString(),
    signal: AbortSignal.timeout(10000),
  })
  const body = (await res.json().catch(() => ({}))) as { status?: string; message?: string; code?: number }
  if (!res.ok) throw Object.assign(new Error(body.message || `Twilio HTTP ${res.status}`), { status: res.status, code: body.code })
  return body
}

export async function sendCode(phone: string): Promise<void> {
  await twilio('Verifications', { To: phone, Channel: 'sms' })
}

/** True only when Twilio approves this code for this number. */
export async function checkCode(phone: string, code: string): Promise<boolean> {
  try {
    const res = await twilio('VerificationCheck', { To: phone, Code: code })
    return res.status === 'approved'
  } catch (error) {
    // 404: no pending verification (expired, already used or never sent).
    if ((error as { status?: number }).status === 404) return false
    throw error
  }
}

// --- signed pass ------------------------------------------------------------------------------------

function secret(): string {
  return process.env.JWT_SECRET || 'supersecret'
}

const b64 = (s: string) => Buffer.from(s).toString('base64url')
const sign = (data: string) => crypto.createHmac('sha256', secret()).update(`phone-pass.${data}`).digest('base64url')

export function issuePass(phone: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + PASS_TTL_MS
  const data = b64(JSON.stringify({ p: phone, e: expiresAt }))
  return { token: `${data}.${sign(data)}`, expiresAt }
}

/** The phone number a valid, unexpired pass was issued for. */
export function readPass(token: unknown): string | null {
  if (typeof token !== 'string') return null
  const [data, mac] = token.split('.')
  if (!data || !mac) return null
  const expected = sign(data)
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null
  try {
    const { p, e } = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as { p?: string; e?: number }
    return typeof p === 'string' && typeof e === 'number' && e > Date.now() ? p : null
  } catch {
    return null
  }
}

// --- rate limits (per server process; Twilio Verify adds its own limits and fraud checks) -----------

const hits = new Map<string, number[]>()

/** False when `key` has already been used `max` times within `windowMs`. */
export function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 10000) for (const [k, v] of hits) if (v.every((t) => now - t > windowMs)) hits.delete(k)
  return true
}
