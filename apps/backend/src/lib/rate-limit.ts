// Rate limits, kept in memory by the API server process (one process in production: MEDUSA_WORKER_MODE=server).

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

/**
 * The shopper's IP address. Store requests come from the storefront's server, so `req.ip` is the same for
 * everyone; the storefront passes the visitor's address in `x-client-ip`. A caller can set that header
 * itself, so limits keyed on it are a first line only: per-email and overall limits still apply.
 */
export function clientIp(headers: Record<string, string | string[] | undefined>, fallback?: string): string {
  const raw = headers['x-client-ip']
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim()
  return value && value.length <= 64 ? value : fallback || 'unknown'
}
