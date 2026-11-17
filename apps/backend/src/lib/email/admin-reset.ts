import { SHOP } from '../shop'
import { COLOURS, button, layout, paragraph, type RenderedEmail } from './layout'

/** The admin's "Forgot password?" link (Medusa admin at /app). */
export function adminResetEmail(link: string): RenderedEmail {
  const body = [
    `<h1 style="margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;color:${COLOURS.INK}">Reset your admin password</h1>`,
    paragraph(`Someone asked to reset the password of this ${SHOP.name} admin login. The link works for 15 minutes.`),
    button(link, 'Choose a new password'),
    paragraph('Did not ask for it? Ignore this email; your password stays the same.', `font-size:13px;color:${COLOURS.MUTED};margin:0`),
  ].join('')
  return {
    subject: `Reset your ${SHOP.name} admin password`,
    html: layout({ preheader: 'The link works for 15 minutes.', body }),
    text: `Someone asked to reset the password of this ${SHOP.name} admin login.\n\nChoose a new password (the link works for 15 minutes):\n${link}\n\nDid not ask for it? Ignore this email; your password stays the same.`,
  }
}
