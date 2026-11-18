# Payment marks in the footer (18 November 2026)

The footer's "how to pay" row shows the networks' own marks. They are the files below, saved unchanged from
Wikimedia Commons (upload.wikimedia.org) to `apps/storefront/public/brand/payments/`.

| File | Commons file | What it is |
|---|---|---|
| `upi.svg` | `UPI-Logo-vector.svg` | UPI logo with its descriptor line (NPCI) |
| `rupay.svg` | `RuPay.svg` | RuPay logo (NPCI) |
| `visa.svg` | `Visa_Inc._logo_(2021–present).svg` | Visa brand mark, current |
| `mastercard.svg` | `Mastercard_2019_logo.svg` | Mastercard symbol, current |

- They are trademarks of their owners, shown only to say which ways of paying the shop accepts. They are not
  recoloured, cropped or redrawn; each sits in a white tile at a size that gives the four the same visual weight.
- Each file was rendered and checked before use, and holds no script or external reference.
- Netbanking, Wallets and Cash on Delivery have no mark of their own, so they use a coloured icon and their name.

To check with the owner: the row shows Visa, Mastercard and RuPay, the three card networks a standard Razorpay
account accepts. If the shop's Razorpay account has a network switched off, remove its tile in
`components/layout/Footer.tsx` (`MARKS`).
