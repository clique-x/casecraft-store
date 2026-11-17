import { SHOP } from '../shop'

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const INK = '#141414'
const MUTED = '#5c5a54'
const BORDER = '#e4e2db'
const BRAND = '#0e6b76'
const SURFACE = '#f4f3ef'
export const COLOURS = { INK, MUTED, BORDER, BRAND, SURFACE }

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px"><tr><td style="border-radius:10px;background:${INK}"><a href="${esc(href)}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px">${esc(label)}</a></td></tr></table>`
}

export function paragraph(html: string, style = ''): string {
  return `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.55;color:${INK};${style}">${html}</p>`
}

/**
 * The frame every email shares: wordmark, white card, help line and the business footer. `preheader` is the
 * grey preview line inboxes show after the subject.
 */
export function layout({ preheader, body }: { preheader: string; body: string }): string {
  const wa = `https://wa.me/${SHOP.whatsapp}`
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(SHOP.name)}</title></head>
<body style="margin:0;padding:0;background:${SURFACE}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 4px 18px;font-family:${FONT};font-size:22px;font-weight:800;letter-spacing:-0.02em;color:${INK}"><a href="${esc(SHOP.url)}" style="color:${INK};text-decoration:none">Gadgets<span style="color:${BRAND}">Hub</span></a></td></tr>
<tr><td style="background:#ffffff;border:1px solid ${BORDER};border-radius:16px;padding:28px 24px">${body}</td></tr>
<tr><td style="padding:20px 8px 0;font-family:${FONT};font-size:13px;line-height:1.55;color:${MUTED}">
Questions? <a href="${wa}" style="color:${BRAND};font-weight:600">WhatsApp us on ${esc(SHOP.phoneLabel)}</a> or reply to this email.<br><br>
${esc(SHOP.name)} is run by ${esc(SHOP.business)}, ${esc(SHOP.address)}.${SHOP.gstin ? ` GSTIN ${esc(SHOP.gstin)}.` : ''}
</td></tr>
</table></td></tr></table>
</body></html>`
}

/** The plain-text footer, matching layout(). */
export function textFooter(): string {
  return `\n\nQuestions? WhatsApp us on ${SHOP.phoneLabel} (https://wa.me/${SHOP.whatsapp}) or reply to this email.\n${SHOP.name} is run by ${SHOP.business}, ${SHOP.address}.${SHOP.gstin ? ` GSTIN ${SHOP.gstin}.` : ''}`
}
