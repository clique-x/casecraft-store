import type { MedusaContainer } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/** Razorpay's provider id; every other provider is Cash on Delivery (`pp_system_default`). */
const RAZORPAY = 'pp_razorpay_razorpay'

export interface OrderAddress {
  firstName: string
  lastName: string
  address1: string
  address2: string
  city: string
  province: string
  postalCode: string
  phone: string
}

export interface OrderSummary {
  id: string
  displayId: number
  email: string | null
  createdAt: string
  status: string
  paymentStatus: string
  fulfillmentStatus: string
  paidOnline: boolean
  paymentLabel: string
  items: { id: string; title: string; variantTitle: string | null; quantity: number; unitPrice: number; total: number; thumbnail: string | null }[]
  itemSubtotal: number
  shippingTotal: number
  discountTotal: number
  total: number
  address: OrderAddress | null
  shipments: { fulfillmentId: string; trackingNumber: string | null; trackingUrl: string | null; shippedAt: string | null; deliveredAt: string | null }[]
}

export const ORDER_FIELDS = [
  'id',
  'display_id',
  'email',
  'created_at',
  'status',
  'payment_status',
  'fulfillment_status',
  'item_subtotal',
  'shipping_total',
  'discount_total',
  'total',
  'items.id',
  'items.title',
  'items.product_title',
  'items.variant_title',
  'items.quantity',
  'items.unit_price',
  'items.total',
  'items.thumbnail',
  'shipping_address.first_name',
  'shipping_address.last_name',
  'shipping_address.address_1',
  'shipping_address.address_2',
  'shipping_address.city',
  'shipping_address.province',
  'shipping_address.postal_code',
  'shipping_address.phone',
  'payment_collections.payment_sessions.provider_id',
  'fulfillments.id',
  'fulfillments.shipped_at',
  'fulfillments.delivered_at',
  'fulfillments.canceled_at',
  'fulfillments.labels.tracking_number',
  'fulfillments.labels.tracking_url',
]

const s = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))
const n = (v: unknown) => Number(v ?? 0) || 0

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the generated graph types differ per field list
export function toOrderSummary(o: any): OrderSummary {
  const providers: string[] = (o.payment_collections ?? []).flatMap((c: any) => (c?.payment_sessions ?? []).map((p: any) => p?.provider_id))
  const paidOnline = providers.includes(RAZORPAY)
  const a = o.shipping_address
  return {
    id: o.id,
    displayId: n(o.display_id),
    email: o.email ?? null,
    createdAt: s(o.created_at instanceof Date ? o.created_at.toISOString() : o.created_at),
    status: s(o.status),
    paymentStatus: s(o.payment_status),
    fulfillmentStatus: s(o.fulfillment_status),
    paidOnline,
    paymentLabel: paidOnline ? 'Paid online' : 'Cash on Delivery',
    items: (o.items ?? []).filter(Boolean).map((i: any) => ({
      id: i.id,
      title: s(i.product_title || i.title),
      variantTitle: i.variant_title ? s(i.variant_title) : null,
      quantity: n(i.quantity),
      unitPrice: n(i.unit_price),
      total: n(i.total),
      thumbnail: i.thumbnail ?? null,
    })),
    itemSubtotal: n(o.item_subtotal),
    shippingTotal: n(o.shipping_total),
    discountTotal: n(o.discount_total),
    total: n(o.total),
    address: a
      ? {
          firstName: s(a.first_name),
          lastName: s(a.last_name),
          address1: s(a.address_1),
          address2: s(a.address_2),
          city: s(a.city),
          province: s(a.province),
          postalCode: s(a.postal_code),
          phone: s(a.phone),
        }
      : null,
    shipments: (o.fulfillments ?? [])
      .filter((f: any) => f && !f.canceled_at)
      .map((f: any) => {
        const label = (f.labels ?? []).find((l: any) => l?.tracking_number || l?.tracking_url) ?? null
        const iso = (d: unknown) => (d ? s(d instanceof Date ? d.toISOString() : d) : null)
        return {
          fulfillmentId: f.id,
          trackingNumber: label?.tracking_number || null,
          trackingUrl: label?.tracking_url || null,
          shippedAt: iso(f.shipped_at),
          deliveredAt: iso(f.delivered_at),
        }
      }),
  }
}

export async function loadOrders(container: MedusaContainer, filters: Record<string, unknown>, take = 50): Promise<OrderSummary[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: 'order',
    fields: ORDER_FIELDS,
    filters: filters as never,
    pagination: { take, order: { created_at: 'DESC' } },
  })
  return data.map(toOrderSummary)
}

export async function loadOrder(container: MedusaContainer, id: string): Promise<OrderSummary | null> {
  return (await loadOrders(container, { id }, 1))[0] ?? null
}

/** Where an order stands, in the customer's words. */
export function orderStage(o: OrderSummary): 'canceled' | 'delivered' | 'shipped' | 'packing' {
  if (o.status === 'canceled') return 'canceled'
  if (o.shipments.some((x) => x.deliveredAt) || o.fulfillmentStatus === 'delivered') return 'delivered'
  if (o.shipments.some((x) => x.shippedAt) || /shipped/.test(o.fulfillmentStatus)) return 'shipped'
  return 'packing'
}
