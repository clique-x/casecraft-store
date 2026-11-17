import type { OrderSummary } from '../orders'
import { SHOP, inr } from '../shop'
import { COLOURS, button, esc, layout, paragraph, textFooter, type RenderedEmail } from './layout'

const { INK, MUTED, BORDER, BRAND } = COLOURS
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const ACCOUNT_URL = `${SHOP.url}/account`

function itemRows(order: OrderSummary): string {
  return order.items
    .map(
      (i) => `<tr>
<td width="56" style="padding:10px 12px 10px 0;vertical-align:top">${
        i.thumbnail
          ? `<img src="${esc(i.thumbnail)}" width="48" height="60" alt="" style="display:block;width:48px;height:60px;object-fit:contain;border-radius:8px;background:#f4f3ef">`
          : ''
      }</td>
<td style="padding:10px 0;vertical-align:top;font-family:${FONT};font-size:14px;line-height:1.4;color:${INK}"><strong>${esc(i.title)}</strong>${
        i.variantTitle ? `<br><span style="color:${MUTED};font-size:13px">${esc(i.variantTitle)}</span>` : ''
      }<br><span style="color:${MUTED};font-size:13px">Qty ${i.quantity}</span></td>
<td align="right" style="padding:10px 0 10px 12px;vertical-align:top;font-family:${FONT};font-size:14px;font-weight:700;color:${INK};white-space:nowrap">${inr(i.total)}</td>
</tr>`,
    )
    .join('')
}

function totalRow(label: string, value: string, strong = false, colour = INK): string {
  const weight = strong ? '800' : '400'
  const size = strong ? '16px' : '14px'
  return `<tr><td style="padding:4px 0;font-family:${FONT};font-size:${size};font-weight:${weight};color:${strong ? INK : MUTED}">${esc(label)}</td><td align="right" style="padding:4px 0;font-family:${FONT};font-size:${size};font-weight:${weight};color:${colour};white-space:nowrap">${esc(value)}</td></tr>`
}

function totalsTable(order: OrderSummary): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${BORDER};margin-top:6px;padding-top:8px">
${totalRow('Subtotal', inr(order.itemSubtotal))}
${order.discountTotal > 0 ? totalRow('Discount', `−${inr(order.discountTotal)}`, false, '#17804f') : ''}
${totalRow('Delivery', order.shippingTotal === 0 ? 'Free' : inr(order.shippingTotal))}
${totalRow(order.paidOnline ? 'Paid' : 'To pay on delivery', inr(order.total), true)}
</table>`
}

function addressBlock(order: OrderSummary): string {
  const a = order.address
  if (!a) return ''
  const lines = [`${a.firstName} ${a.lastName}`.trim(), a.address1, a.address2, `${a.city}, ${a.province} ${a.postalCode}`, a.phone && `+91 ${a.phone.replace(/^\+91/, '')}`]
    .filter(Boolean)
    .map((l) => esc(l))
    .join('<br>')
  return `<p style="margin:20px 0 4px;font-family:${FONT};font-size:13px;font-weight:700;color:${INK}">Delivering to</p><p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.5;color:${MUTED}">${lines}</p>`
}

function addressText(order: OrderSummary): string {
  const a = order.address
  if (!a) return ''
  return ['Delivering to:', `${a.firstName} ${a.lastName}`.trim(), a.address1, a.address2, `${a.city}, ${a.province} ${a.postalCode}`, a.phone && `+91 ${a.phone.replace(/^\+91/, '')}`]
    .filter(Boolean)
    .join('\n')
}

const accountLine = (email: string | null) =>
  `See this order and its tracking any time under My orders. Sign in with ${email ? esc(email) : 'this email address'}: we email you a one-time code, so there is no password to remember.`

/** "Thank you, your order is confirmed": the receipt, sent when the order is placed. */
export function orderPlacedEmail(order: OrderSummary): RenderedEmail {
  const first = order.address?.firstName?.trim()
  const pay = order.paidOnline
    ? `Paid online: ${inr(order.total)}.`
    : `Cash on Delivery: keep ${inr(order.total)} ready for the courier.`
  const body = [
    `<h1 style="margin:0 0 10px;font-family:${FONT};font-size:22px;line-height:1.25;font-weight:800;color:${INK}">Thank you${first ? `, ${esc(first)}` : ''}! Your order is confirmed.</h1>`,
    paragraph(
      `Order <strong>#${order.displayId}</strong>. We dispatch within ${esc(SHOP.dispatchWindow)} (items we order in for you take ${esc(SHOP.orderInWindow)}) and email you the tracking link when it ships.`,
    ),
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px">${itemRows(order)}</table>`,
    totalsTable(order),
    paragraph(esc(pay), `margin:14px 0 0;font-size:14px;color:${MUTED}`),
    addressBlock(order),
    button(ACCOUNT_URL, 'View my orders'),
    paragraph(accountLine(order.email), `font-size:13px;color:${MUTED};margin:0`),
  ].join('')

  const text = [
    `Thank you${first ? `, ${first}` : ''}! Your ${SHOP.name} order #${order.displayId} is confirmed.`,
    `We dispatch within ${SHOP.dispatchWindow} (items we order in for you take ${SHOP.orderInWindow}) and email you the tracking link when it ships.`,
    '',
    ...order.items.map((i) => `${i.quantity} × ${i.title}${i.variantTitle ? ` (${i.variantTitle})` : ''}: ${inr(i.total)}`),
    '',
    `Subtotal: ${inr(order.itemSubtotal)}`,
    ...(order.discountTotal > 0 ? [`Discount: −${inr(order.discountTotal)}`] : []),
    `Delivery: ${order.shippingTotal === 0 ? 'Free' : inr(order.shippingTotal)}`,
    `${order.paidOnline ? 'Paid' : 'To pay on delivery'}: ${inr(order.total)}`,
    pay,
    '',
    addressText(order),
    '',
    `My orders: ${ACCOUNT_URL}`,
    accountLine(order.email),
  ].join('\n')

  return {
    subject: `Order #${order.displayId} confirmed · ${SHOP.name}`,
    html: layout({ preheader: `${order.items.length === 1 ? order.items[0].title : `${order.items.length} items`}, ${inr(order.total)}. Dispatch within ${SHOP.dispatchWindow}.`, body }),
    text: text + textFooter(),
  }
}

/** "Your order is on its way", with the courier's tracking number and link. */
export function orderShippedEmail(order: OrderSummary, shipment: OrderSummary['shipments'][number]): RenderedEmail {
  const first = order.address?.firstName?.trim()
  const tracking = shipment.trackingNumber
    ? `Tracking number: <strong style="font-family:ui-monospace,Menlo,Consolas,monospace">${esc(shipment.trackingNumber)}</strong>`
    : ''
  const cod = order.paidOnline ? '' : ` Keep ${inr(order.total)} ready for the courier.`
  const body = [
    `<h1 style="margin:0 0 10px;font-family:${FONT};font-size:22px;line-height:1.25;font-weight:800;color:${INK}">Your order #${order.displayId} is on its way</h1>`,
    paragraph(`${first ? `${esc(first)}, your` : 'Your'} parcel is with the courier. Most orders arrive 3 to 7 working days after dispatch.${esc(cod)}`),
    tracking ? paragraph(tracking) : '',
    shipment.trackingUrl ? button(shipment.trackingUrl, 'Track your parcel') : button(ACCOUNT_URL, 'View my orders'),
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border-top:1px solid ${BORDER}">${itemRows(order)}</table>`,
    paragraph(
      `Something wrong with the parcel when it arrives? Take an unboxing video and <a href="https://wa.me/${SHOP.whatsapp}" style="color:${BRAND};font-weight:600">WhatsApp us</a>: we replace damaged or wrong items.`,
      `font-size:13px;color:${MUTED};margin:14px 0 0`,
    ),
  ].join('')

  const text = [
    `Your ${SHOP.name} order #${order.displayId} is on its way.`,
    `The parcel is with the courier. Most orders arrive 3 to 7 working days after dispatch.${cod}`,
    ...(shipment.trackingNumber ? [`Tracking number: ${shipment.trackingNumber}`] : []),
    ...(shipment.trackingUrl ? [`Track it: ${shipment.trackingUrl}`] : []),
    `My orders: ${ACCOUNT_URL}`,
    '',
    ...order.items.map((i) => `${i.quantity} × ${i.title}${i.variantTitle ? ` (${i.variantTitle})` : ''}`),
    '',
    'Something wrong with the parcel when it arrives? Take an unboxing video and WhatsApp us: we replace damaged or wrong items.',
  ].join('\n')

  return {
    subject: `Order #${order.displayId} is on its way · ${SHOP.name}`,
    html: layout({ preheader: shipment.trackingNumber ? `Tracking number ${shipment.trackingNumber}` : 'Your parcel has left our shop.', body }),
    text: text + textFooter(),
  }
}
