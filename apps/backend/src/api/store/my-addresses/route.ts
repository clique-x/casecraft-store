import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'
import { readPass } from '../../../lib/phone-otp'

const MAX_ADDRESSES = 4

interface Row {
  first_name: string | null
  last_name: string | null
  address_1: string | null
  address_2: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  phone: string | null
  email: string | null
}

/**
 * GET /store/my-addresses with header `x-phone-pass` (from POST /store/otp/verify) →
 * the distinct delivery addresses of past orders placed with that phone number, newest first.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const phone = readPass(req.headers['x-phone-pass'])
  if (!phone) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, 'Verify your phone number first')

  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const rows = (await pg
    .select('a.first_name', 'a.last_name', 'a.address_1', 'a.address_2', 'a.city', 'a.province', 'a.postal_code', 'a.phone', 'o.email')
    .from({ o: 'order' })
    .join({ a: 'order_address' }, 'a.id', 'o.shipping_address_id')
    .where('a.phone', phone)
    .whereNull('o.deleted_at')
    .orderBy('o.created_at', 'desc')
    .limit(50)) as Row[]

  const seen = new Set<string>()
  const addresses: Omit<Row, 'email'>[] = []
  for (const r of rows) {
    const key = [r.address_1, r.address_2, r.postal_code].map((s) => (s ?? '').trim().toLowerCase()).join('|')
    if (!r.address_1 || seen.has(key)) continue
    seen.add(key)
    addresses.push({
      first_name: r.first_name ?? '',
      last_name: r.last_name ?? '',
      address_1: r.address_1 ?? '',
      address_2: r.address_2 ?? '',
      city: r.city ?? '',
      province: r.province ?? '',
      postal_code: r.postal_code ?? '',
      phone: r.phone ?? phone,
    })
    if (addresses.length >= MAX_ADDRESSES) break
  }
  res.json({ email: rows[0]?.email ?? null, addresses })
}
