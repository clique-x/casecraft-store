/**
 * WhatsApp messages to the shop's owner through Twilio (the account that already sends the phone login codes).
 *
 * Needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM (the WhatsApp sender, e.g.
 * "+14155238886"). WhatsApp only delivers a message the shop starts when it uses an approved template, so set
 * TWILIO_WHATSAPP_ORDER_TEMPLATE_SID (a Content template, "HX…") too; without it the free-form text is sent,
 * which arrives only within 24 hours of the recipient's last message to the sender.
 */
const API_BASE = (process.env.TWILIO_API_BASE_URL || 'https://api.twilio.com').replace(/\/$/, '')

export function whatsappEnabled(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM)
}

const address = (number: string) => `whatsapp:${number.replace(/^whatsapp:/, '')}`

export interface WhatsappMessage {
  /** International format, e.g. "+918077402898". */
  to: string
  body: string
  /** Sent in place of `body` when both are set: an approved Content template and its {{n}} values. */
  templateSid?: string
  variables?: Record<string, string>
}

/** Sends one message; returns Twilio's message id. Throws when Twilio refuses it. */
export async function sendWhatsapp(message: WhatsappMessage): Promise<string> {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const form: Record<string, string> = { From: address(process.env.TWILIO_WHATSAPP_FROM!), To: address(message.to) }
  if (message.templateSid) {
    form.ContentSid = message.templateSid
    form.ContentVariables = JSON.stringify(message.variables ?? {})
  } else {
    form.Body = message.body
  }
  const res = await fetch(`${API_BASE}/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN!}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(form).toString(),
    signal: AbortSignal.timeout(10000),
  })
  const body = (await res.json().catch(() => ({}))) as { sid?: string; message?: string; code?: number }
  if (!res.ok) throw new Error(`${body.message || `Twilio HTTP ${res.status}`}${body.code ? ` (code ${body.code})` : ''}`)
  return body.sid ?? ''
}
