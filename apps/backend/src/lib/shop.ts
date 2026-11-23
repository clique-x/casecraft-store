/**
 * Shop details used in emails. Keep in step with apps/storefront/src/lib/brand.ts (BRAND_NAME, WHATSAPP_NUMBER,
 * DISPATCH_WINDOW, BUSINESS).
 */
export const SHOP = {
  name: 'GadgetsHub',
  /** The storefront's public address, for links in emails. */
  url: (process.env.STOREFRONT_URL || 'https://gadgetshub.io').replace(/\/$/, ''),
  whatsapp: '918755572898',
  phoneLabel: '+91 87555 72898',
  dispatchWindow: '24–72 h',
  /** Gadgets ordered in after the sale (ORDER_IN_WINDOW in apps/storefront/src/lib/catalog/gadgets.ts). */
  orderInWindow: '3–5 days',
  business: 'EarthClique Technologies',
  address: 'Shop No. 209, 2nd Floor, Deep Ganga Shopping Complex, SIDCUL, Haridwar, Uttarakhand 249403, India',
  /** Printed in the email footer once set; keep it equal to BUSINESS.gstin in the storefront's brand.ts. */
  gstin: null as string | null,
} as const

export const LOGIN_CODE_MINUTES = 10

/** The admin dashboard's public address, for links in emails to the shop's owner. */
export function adminUrl(): string {
  const base = process.env.API_DOMAIN ? `https://${process.env.API_DOMAIN}` : process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
  return `${base.replace(/\/$/, '')}/app`
}

const list = (value: string | undefined, fallback: string) => (value ?? fallback).split(',').map((v) => v.trim()).filter(Boolean)

/**
 * Who hears about every new order. ORDER_ALERT_EMAILS and ORDER_ALERT_WHATSAPP (comma-separated) replace the
 * defaults; set either to an empty value to turn that alert off.
 */
export function orderAlertEmails(): string[] {
  return list(process.env.ORDER_ALERT_EMAILS, 'shambhvi91@gmail.com').flatMap((e) => normaliseEmail(e) ?? [])
}

/** WhatsApp numbers in international format, e.g. "+918077402898". A bare 10-digit number is taken as Indian. */
export function orderAlertWhatsappNumbers(): string[] {
  return list(process.env.ORDER_ALERT_WHATSAPP, '+918077402898').flatMap((raw) => {
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 10) return [`+91${digits}`]
    return digits.length >= 11 && digits.length <= 15 ? [`+${digits}`] : []
  })
}

/** Whether the shop can send email: SMTP is configured, or (development) emails go to a preview folder. */
export function emailEnabled(): boolean {
  return Boolean(process.env.EMAIL_FROM && (process.env.SMTP_HOST || process.env.EMAIL_PREVIEW_DIR))
}

/** "₹1,299" (and paise only when there are any). */
export function inr(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0)
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Lower-cased, trimmed email, or null when it does not look like one. */
export function normaliseEmail(input: unknown): string | null {
  const email = String(input ?? '').trim().toLowerCase()
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null
}
