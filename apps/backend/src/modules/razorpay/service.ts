import Razorpay from 'razorpay'
import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils'
import { AbstractPaymentProvider, BigNumber, MedusaError, PaymentActions } from '@medusajs/framework/utils'
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  PaymentSessionStatus,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from '@medusajs/framework/types'

export interface RazorpayOptions {
  key_id: string
  key_secret: string
  /** Secret set on the webhook in the Razorpay dashboard (Settings → Webhooks). */
  webhook_secret?: string
}

/** What the provider stores on the Medusa payment session; `key_id` and the order id reach the storefront. */
interface SessionData {
  razorpay_order_id: string
  key_id: string
  amount: number
  currency: string
  session_id?: string
  razorpay_payment_id?: string
  [key: string]: unknown
}

type RazorpayPaymentStatus = 'created' | 'authorized' | 'captured' | 'refunded' | 'failed'

/** INR (and every Razorpay currency we use) has 2 decimals: amounts go to Razorpay in paise. */
function toPaise(amount: unknown): number {
  return Math.round(Number(new BigNumber(amount as number).numeric) * 100)
}

function fromPaise(paise: number | string): number {
  return Number(paise) / 100
}

/**
 * Razorpay for Medusa v2: one Razorpay order per payment session.
 *
 * 1. initiatePayment creates the Razorpay order. The storefront opens Razorpay Checkout with
 *    `key_id` and `razorpay_order_id` from the session data.
 * 2. authorizePayment (run when the cart completes) asks Razorpay for that order's payments and
 *    only reports `authorized`/`captured` when Razorpay itself has a successful payment for the
 *    full amount, so nothing the browser sends can fake a payment.
 * 3. Webhooks (POST /hooks/payment/razorpay_razorpay) keep the status right if the tab closes.
 */
class RazorpayProviderService extends AbstractPaymentProvider<RazorpayOptions> {
  static identifier = 'razorpay'

  protected readonly options_: RazorpayOptions
  protected readonly client_: Razorpay
  protected readonly logger_: Logger

  static validateOptions(options: Record<string, unknown>): void {
    if (!options.key_id || !options.key_secret) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Razorpay needs key_id and key_secret')
    }
  }

  constructor(container: { logger: Logger }, options: RazorpayOptions) {
    super(container, options)
    this.options_ = options
    this.logger_ = container.logger
    this.client_ = new Razorpay({ key_id: options.key_id, key_secret: options.key_secret })
  }

  private async createOrder(amount: unknown, currency: string, sessionId?: string): Promise<SessionData> {
    const paise = toPaise(amount)
    try {
      const order = await this.client_.orders.create({
        amount: paise,
        currency: currency.toUpperCase(),
        // Razorpay caps receipts at 40 characters.
        receipt: (sessionId ?? `rcpt_${Date.now()}`).slice(0, 40),
        notes: sessionId ? { session_id: sessionId } : {},
      })
      return {
        razorpay_order_id: order.id,
        key_id: this.options_.key_id,
        amount: paise,
        currency: order.currency,
        ...(sessionId ? { session_id: sessionId } : {}),
      }
    } catch (error) {
      throw this.wrap('create the Razorpay order', error)
    }
  }

  /** The best payment Razorpay has for the order, as a Medusa session status. */
  private async statusOf(data: SessionData): Promise<{ status: PaymentSessionStatus; data: SessionData }> {
    if (!data?.razorpay_order_id) return { status: 'pending', data }
    let items: { id: string; status: RazorpayPaymentStatus; amount: number | string }[]
    try {
      const res = await this.client_.orders.fetchPayments(data.razorpay_order_id)
      items = res.items as typeof items
    } catch (error) {
      throw this.wrap('check the Razorpay payment', error)
    }
    const full = (p: { amount: number | string }) => Number(p.amount) >= data.amount
    const captured = items.find((p) => p.status === 'captured' && full(p))
    if (captured) return { status: 'captured', data: { ...data, razorpay_payment_id: captured.id } }
    const authorized = items.find((p) => p.status === 'authorized' && full(p))
    if (authorized) return { status: 'authorized', data: { ...data, razorpay_payment_id: authorized.id } }
    if (items.length > 0 && items.every((p) => p.status === 'failed')) return { status: 'error', data }
    return { status: 'pending', data }
  }

  private wrap(action: string, error: unknown): MedusaError {
    const e = error as { statusCode?: number; error?: { description?: string; code?: string }; message?: string }
    const description =
      e?.error?.description ??
      e?.message ??
      (e?.statusCode ? `HTTP ${e.statusCode}` : null) ??
      (() => {
        try {
          return JSON.stringify(error).slice(0, 300)
        } catch {
          return String(error)
        }
      })()
    this.logger_.error(`Razorpay: could not ${action}: ${description}`)
    return new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Could not ${action}. Please try again.`)
  }

  async initiatePayment({ amount, currency_code, data }: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const sessionId = data?.session_id as string | undefined
    const session = await this.createOrder(amount, currency_code, sessionId)
    return { id: session.razorpay_order_id, data: session, status: 'pending' }
  }

  /** Razorpay orders are immutable, so a new cart total means a new order. */
  async updatePayment({ amount, currency_code, data }: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const current = data as SessionData | undefined
    if (current?.razorpay_order_id && current.amount === toPaise(amount)) return { data: current, status: 'pending' }
    const session = await this.createOrder(amount, currency_code, current?.session_id)
    return { data: session, status: 'pending' }
  }

  async authorizePayment({ data }: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    return this.statusOf(data as SessionData)
  }

  async getPaymentStatus({ data }: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    return this.statusOf(data as SessionData)
  }

  async capturePayment({ data }: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const session = data as SessionData
    if (!session?.razorpay_payment_id) return { data: session }
    try {
      const payment = await this.client_.payments.fetch(session.razorpay_payment_id)
      if (payment.status === 'authorized') {
        await this.client_.payments.capture(session.razorpay_payment_id, session.amount, session.currency)
      }
      return { data: session }
    } catch (error) {
      throw this.wrap('capture the Razorpay payment', error)
    }
  }

  async refundPayment({ amount, data }: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const session = data as SessionData
    if (!session?.razorpay_payment_id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'This payment has no Razorpay payment to refund')
    }
    try {
      const refund = await this.client_.payments.refund(session.razorpay_payment_id, { amount: toPaise(amount) })
      const refunds = Array.isArray(session.refunds) ? session.refunds : []
      return { data: { ...session, refunds: [...refunds, refund.id] } }
    } catch (error) {
      throw this.wrap('refund the Razorpay payment', error)
    }
  }

  async retrievePayment({ data }: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const session = data as SessionData
    if (!session?.razorpay_order_id) return { data: session }
    try {
      const order = await this.client_.orders.fetch(session.razorpay_order_id)
      return { data: { ...session, razorpay_order_status: order.status } }
    } catch (error) {
      throw this.wrap('fetch the Razorpay order', error)
    }
  }

  /** Razorpay orders cannot be cancelled; an unpaid order simply expires. */
  async cancelPayment({ data }: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data }
  }

  async deletePayment({ data }: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data }
  }

  async getWebhookActionAndData(webhook: ProviderWebhookPayload['payload']): Promise<WebhookActionResult> {
    const secret = this.options_.webhook_secret
    const signature = webhook.headers['x-razorpay-signature'] as string | undefined
    const raw = typeof webhook.rawData === 'string' ? webhook.rawData : webhook.rawData?.toString('utf8')
    if (!secret || !signature || !raw || !validateWebhookSignature(raw, signature, secret)) {
      this.logger_.warn('Razorpay webhook ignored: missing or invalid signature')
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const event = webhook.data as {
      event?: string
      payload?: { payment?: { entity?: { amount: number; status: string; notes?: Record<string, string>; order_id?: string } } }
    }
    const payment = event.payload?.payment?.entity
    const sessionId = payment?.notes?.session_id
    if (!payment || !sessionId) return { action: PaymentActions.NOT_SUPPORTED }
    const result = { session_id: sessionId, amount: fromPaise(payment.amount) }

    switch (event.event) {
      case 'payment.captured':
      case 'order.paid':
        return { action: PaymentActions.SUCCESSFUL, data: result }
      case 'payment.authorized':
        return { action: PaymentActions.AUTHORIZED, data: result }
      case 'payment.failed':
        return { action: PaymentActions.FAILED, data: result }
      default:
        return { action: PaymentActions.NOT_SUPPORTED }
    }
  }
}

export default RazorpayProviderService
