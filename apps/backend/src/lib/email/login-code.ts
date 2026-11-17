import { LOGIN_CODE_MINUTES, SHOP } from '../shop'
import { COLOURS, esc, layout, paragraph, textFooter, type RenderedEmail } from './layout'

/** The one-time code that signs a customer in to see their orders. */
export function loginCodeEmail(code: string): RenderedEmail {
  const site = SHOP.url.replace(/^https?:\/\//, '')
  const body = [
    paragraph('Your sign-in code is', 'margin-bottom:6px;color:' + COLOURS.MUTED),
    `<p style="margin:0 0 18px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:34px;font-weight:800;letter-spacing:0.18em;color:${COLOURS.INK}">${esc(code)}</p>`,
    paragraph(`Type it on ${esc(site)} to see your orders, tracking and saved addresses. It works for ${LOGIN_CODE_MINUTES} minutes, once.`),
    paragraph(
      'Did not ask for it? You can ignore this email: nobody can sign in without the code. Never share it, not even with us.',
      `font-size:13px;color:${COLOURS.MUTED};margin:0`,
    ),
  ].join('')
  return {
    subject: `${code} is your ${SHOP.name} sign-in code`,
    html: layout({ preheader: `It works for ${LOGIN_CODE_MINUTES} minutes. Never share it.`, body }),
    text:
      `Your ${SHOP.name} sign-in code is ${code}\n\n` +
      `Type it on ${site} to see your orders, tracking and saved addresses. It works for ${LOGIN_CODE_MINUTES} minutes, once.\n\n` +
      'Did not ask for it? You can ignore this email: nobody can sign in without the code. Never share it, not even with us.' +
      textFooter(),
  }
}
