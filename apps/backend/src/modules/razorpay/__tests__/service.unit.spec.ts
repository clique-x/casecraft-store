import crypto from 'node:crypto'
import RazorpayProviderService from '../service'

const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() } as never
const options = { key_id: 'rzp_test_key', key_secret: 'secret', webhook_secret: 'whsec' }

function makeService() {
  const service = new RazorpayProviderService({ logger }, options)
  const client = {
    orders: { create: jest.fn(), fetchPayments: jest.fn(), fetch: jest.fn() },
    payments: { fetch: jest.fn(), capture: jest.fn(), refund: jest.fn() },
  }
  ;(service as unknown as { client_: typeof client }).client_ = client
  return { service, client }
}

const session = { razorpay_order_id: 'order_1', key_id: 'rzp_test_key', amount: 114900, currency: 'INR', session_id: 'payses_1' }

describe('Razorpay provider', () => {
  it('creates a Razorpay order in paise for a new session', async () => {
    const { service, client } = makeService()
    client.orders.create.mockResolvedValue({ id: 'order_1', currency: 'INR' })
    const out = await service.initiatePayment({ amount: 1149, currency_code: 'inr', data: { session_id: 'payses_1' } } as never)
    expect(client.orders.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 114900, currency: 'INR', notes: { session_id: 'payses_1' } }),
    )
    expect(out).toEqual({ id: 'order_1', status: 'pending', data: session })
  })

  it('keeps the order when the amount is unchanged and makes a new one when it changes', async () => {
    const { service, client } = makeService()
    const same = await service.updatePayment({ amount: 1149, currency_code: 'inr', data: session } as never)
    expect(same.data).toBe(session)
    client.orders.create.mockResolvedValue({ id: 'order_2', currency: 'INR' })
    const changed = await service.updatePayment({ amount: 1648, currency_code: 'inr', data: session } as never)
    expect(changed.data).toMatchObject({ razorpay_order_id: 'order_2', amount: 164800 })
  })

  it.each([
    [[{ id: 'pay_1', status: 'captured', amount: 114900 }], 'captured'],
    [[{ id: 'pay_1', status: 'authorized', amount: 114900 }], 'authorized'],
    [[{ id: 'pay_1', status: 'captured', amount: 100 }], 'pending'],
    [[{ id: 'pay_1', status: 'failed', amount: 114900 }], 'error'],
    [[], 'pending'],
  ])('authorizes only on a full payment Razorpay confirms (%j → %s)', async (items, status) => {
    const { service, client } = makeService()
    client.orders.fetchPayments.mockResolvedValue({ items })
    const out = await service.authorizePayment({ data: session } as never)
    expect(out.status).toBe(status)
    if (status === 'captured' || status === 'authorized') expect(out.data).toMatchObject({ razorpay_payment_id: 'pay_1' })
  })

  it('refunds in paise against the Razorpay payment', async () => {
    const { service, client } = makeService()
    client.payments.refund.mockResolvedValue({ id: 'rfnd_1' })
    const out = await service.refundPayment({ amount: 500, data: { ...session, razorpay_payment_id: 'pay_1' } } as never)
    expect(client.payments.refund).toHaveBeenCalledWith('pay_1', { amount: 50000 })
    expect(out.data).toMatchObject({ refunds: ['rfnd_1'] })
  })

  describe('webhooks', () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { amount: 114900, status: 'captured', notes: { session_id: 'payses_1' } } } },
    })
    const sign = (raw: string, secret = 'whsec') => crypto.createHmac('sha256', secret).update(raw).digest('hex')

    it('maps a signed payment.captured to a successful payment', async () => {
      const { service } = makeService()
      const out = await service.getWebhookActionAndData({
        data: JSON.parse(body),
        rawData: Buffer.from(body),
        headers: { 'x-razorpay-signature': sign(body) },
      } as never)
      expect(out).toEqual({ action: 'captured', data: { session_id: 'payses_1', amount: 1149 } })
    })

    it('ignores a webhook with a bad signature', async () => {
      const { service } = makeService()
      const out = await service.getWebhookActionAndData({
        data: JSON.parse(body),
        rawData: Buffer.from(body),
        headers: { 'x-razorpay-signature': sign(body, 'wrong') },
      } as never)
      expect(out.action).toBe('not_supported')
    })
  })
})
