import crypto from 'node:crypto'
import { LOGIN_CODE_MINUTES } from './shop'

/**
 * One-time sign-in codes, kept (hashed) in the API server's memory: a restart only means asking for a new
 * code. Each code works once, for LOGIN_CODE_MINUTES, and dies after MAX_ATTEMPTS wrong guesses.
 */
const MAX_ATTEMPTS = 5
const TTL_MS = LOGIN_CODE_MINUTES * 60 * 1000

interface Pending {
  hash: string
  expiresAt: number
  attempts: number
}

const pending = new Map<string, Pending>()

function hash(email: string, code: string): string {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'supersecret')
    .update(`login-code.${email}.${code}`)
    .digest('hex')
}

function sweep(now: number): void {
  if (pending.size < 5000) return
  for (const [k, v] of pending) if (v.expiresAt <= now) pending.delete(k)
}

/** A new 6-digit code for this email; any earlier code for it stops working. */
export function issueLoginCode(email: string): string {
  const now = Date.now()
  sweep(now)
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
  pending.set(email, { hash: hash(email, code), expiresAt: now + TTL_MS, attempts: 0 })
  return code
}

/** Forgets a code that could not be emailed. */
export function dropLoginCode(email: string): void {
  pending.delete(email)
}

/** True once for the right, unexpired code; a correct code is used up. */
export function checkLoginCode(email: string, code: string): boolean {
  const entry = pending.get(email)
  if (!entry) return false
  if (entry.expiresAt <= Date.now() || entry.attempts >= MAX_ATTEMPTS) {
    pending.delete(email)
    return false
  }
  const expected = Buffer.from(entry.hash, 'hex')
  const given = Buffer.from(hash(email, code), 'hex')
  if (crypto.timingSafeEqual(expected, given)) {
    pending.delete(email)
    return true
  }
  entry.attempts += 1
  if (entry.attempts >= MAX_ATTEMPTS) pending.delete(email)
  return false
}
