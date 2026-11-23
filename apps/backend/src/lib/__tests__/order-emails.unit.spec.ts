import { loginCodeEmail } from '../email/login-code'
import { orderAlertEmail, orderAlertWhatsapp, orderPlacedEmail, orderShippedEmail } from '../email/order-emails'
import type { OrderSummary } from '../orders'

const order: OrderSummary = {
  id: 'order_1',
  displayId: 1042,
  email: 'priya@example.com',
  createdAt: '2026-11-17T10:00:00.000Z',
  status: 'pending',
  paymentStatus: 'not_paid',
  fulfillmentStatus: 'not_fulfilled',
  paidOnline: false,
  paymentLabel: 'Cash on Delivery',
  items: [{ id: 'i1', title: 'Cover <b>"Ink"</b>', variantTitle: 'Galaxy S25', quantity: 1, unitPrice: 349, total: 349, thumbnail: null }],
  itemSubtotal: 349,
  shippingTotal: 49,
  discountTotal: 0,
  total: 398,
  address: { firstName: 'Priya', lastName: 'S', address1: '12 Main Rd', address2: '', city: 'Haridwar', province: 'Uttarakhand', postalCode: '249401', phone: '9876543210' },
  shipments: [],
}

describe('shop emails', () => {
  it('order confirmation: number, items, COD total, no password, escaped HTML', () => {
    const e = orderPlacedEmail(order)
    expect(e.subject).toBe('Order #1042 confirmed · GadgetsHub')
    expect(e.html).toContain('Cover &lt;b&gt;&quot;Ink&quot;&lt;/b&gt;')
    expect(e.html).not.toContain('<b>"Ink"</b>')
    expect(e.text).toContain('To pay on delivery: ₹398')
    expect(e.text).toContain('Delivery: ₹49')
    expect(`${e.html}${e.text}`.toLowerCase()).not.toContain('password:')
    expect(e.text).toContain('+91 9876543210')
  })

  it('shipped: tracking number and link', () => {
    const shipment = { fulfillmentId: 'ful_1', trackingNumber: 'DLV1', trackingUrl: 'https://example.com/t/DLV1', shippedAt: null, deliveredAt: null }
    const e = orderShippedEmail(order, shipment)
    expect(e.subject).toBe('Order #1042 is on its way · GadgetsHub')
    expect(e.html).toContain('href="https://example.com/t/DLV1"')
    expect(e.text).toContain('Tracking number: DLV1')
  })

  it('owner alert: amount, payment, customer contact and the admin link', () => {
    const e = orderAlertEmail(order)
    expect(e.subject).toBe('New order #1042 · ₹398 · COD · Priya S')
    expect(e.text).toContain('Customer: Priya S, priya@example.com, +91 9876543210')
    expect(e.text).toContain('To collect on delivery: ₹398')
    expect(e.text).toContain('/app/orders/order_1')
    expect(e.html).toContain('Cover &lt;b&gt;&quot;Ink&quot;&lt;/b&gt;')
    expect(e.html).toContain('/app/orders/order_1"')
  })

  it('owner WhatsApp alert: single-line template values and a free-form body', () => {
    const long = { ...order, items: Array.from({ length: 40 }, (_, n) => ({ ...order.items[0], id: `i${n}`, title: 'Cover\nwith a long name' })) }
    const { variables, body } = orderAlertWhatsapp(long)
    expect(variables['1']).toBe('1042')
    expect(variables['2']).toBe('Priya S, +91 9876543210')
    expect(variables['3']).toBe('₹398 (Cash on Delivery)')
    expect(variables['5']).toBe('Haridwar, Uttarakhand 249401')
    expect(variables['4'].length).toBeLessThanOrEqual(400)
    for (const v of Object.values(variables)) expect(v).not.toMatch(/\n/)
    expect(body).toContain('New order #1042 on GadgetsHub')
    expect(orderAlertWhatsapp({ ...order, address: null }).variables['2']).toBe('-')
  })

  it('sign-in code in the subject and body', () => {
    const e = loginCodeEmail('085591')
    expect(e.subject).toBe('085591 is your GadgetsHub sign-in code')
    expect(e.text).toContain('085591')
    expect(e.html).toContain('085591')
  })
})
