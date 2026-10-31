import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'

const digits = (s: string) => s.replace(/\D/g, '').slice(-10)

/**
 * GET /store/order-lookup?order=1042&contact=<email or phone>
 * Order tracking for guests: the order number alone is guessable, so the email or the phone
 * number on the order must match too. Returns only what a tracking page needs.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderNo = Number(String(req.query.order ?? '').replace(/^#/, '').trim())
  const contact = String(req.query.contact ?? '').trim().toLowerCase()
  if (!Number.isInteger(orderNo) || orderNo <= 0 || contact.length < 5) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Enter your order number and the email or phone used to order')
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: 'order',
    fields: [
      'id',
      'display_id',
      'email',
      'status',
      'payment_status',
      'fulfillment_status',
      'created_at',
      'total',
      'currency_code',
      'shipping_address.phone',
      'shipping_address.city',
      'items.title',
      'items.variant_title',
      'items.quantity',
      'items.thumbnail',
      'fulfillments.labels.tracking_number',
      'fulfillments.labels.tracking_url',
      'fulfillments.shipped_at',
      'fulfillments.delivered_at',
    ],
    // The generated filter type says string; Postgres compares it with the integer column.
    filters: { display_id: String(orderNo) },
  })
  const order = data[0]
  const phone = order?.shipping_address?.phone ? digits(order.shipping_address.phone) : ''
  const matches =
    order && (order.email?.toLowerCase() === contact || (phone.length === 10 && digits(contact) === phone))
  if (!matches) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'No order matches that number and contact')
  }
  const { shipping_address, ...rest } = order
  res.json({ order: { ...rest, city: shipping_address?.city ?? null } })
}
