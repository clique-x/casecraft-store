# Mobile Cases Store — Plan & Spec

_Drafted 2026-10-28. Revised the same day to self-host on Medusa v2 + Hostinger KVM 2 instead of Shopify. Status: planning, no code yet._

## 1. What we're building

A custom-coded online store that sells trending phone back covers in India. Customers pick their phone, browse designs that fit it, and check out with UPI, cards or COD. You hold the stock and ship the orders yourself. Everything runs on your own VPS, with no platform subscription and no platform fee per order.

**Decisions so far**

| Area | Decision |
|------|----------|
| Storefront | Custom Next.js 16 (App Router) + Tailwind v4 + shadcn/ui |
| Commerce backend | Medusa v2 (open-source, TypeScript), self-hosted |
| Server | Hostinger KVM 2: 2 vCPU, 8 GB RAM, 100 GB NVMe |
| Payments | Razorpay (our own Medusa payment provider) + COD |
| Fulfillment | Own inventory, shipped via Shiprocket |
| Customisation | None at launch. Catalog of curated designs only. |

## 2. Architecture

```
Customer ──► Cloudflare (DNS, SSL, CDN cache, DDoS protection)
               │
               ▼
          KVM 2 VPS ─ Caddy (reverse proxy, HTTPS)
               ├── storefront   Next.js          → yourstore.in
               ├── medusa-server API + Admin     → api.yourstore.in (admin at /app)
               ├── medusa-worker subscribers, scheduled jobs, emails
               ├── postgres      all store data
               └── redis         events, workflows, cache, locks
               │
   External:   Razorpay (payments) · Shiprocket (shipping)
               Cloudflare R2 (product images + DB backups) · Resend (emails)
```

- **Medusa server** handles the store API (`/store/*`) and the admin API, and serves the **Admin dashboard**. You'll manage products, stock, orders and refunds there, so there's no admin panel to build.
- **Medusa worker** runs the background work: order emails, low-stock alerts, and Shiprocket syncing later.
- **Next.js** handles everything the customer sees, **including checkout** (Shopify used to provide that). It talks to Medusa through `@medusajs/js-sdk` with a publishable API key. Medusa's official Next.js Starter is a useful reference, but we'll write our own to match your conventions.
- **Cache refresh:** a Medusa subscriber on `product.updated` / inventory changes calls the storefront's `/api/revalidate` with a shared secret, so pages are fast and stock stays correct.

## 3. Medusa data model

### Store setup

| Medusa concept | Setting |
|----------------|---------|
| Region | India, currency **INR**, **prices include tax** |
| Tax region | India, GST rate for phone cases (confirm the HSN code and rate with your CA) |
| Sales channel | "Web store", linked to the storefront's publishable API key |
| Stock location | "Home warehouse" (your address), linked to the sales channel |
| Payment providers | Razorpay (custom) + manual provider shown as "Cash on Delivery" |
| Shipping options | "Standard delivery": flat fee below the free-shipping threshold, ₹0 above it, using price rules on the cart total |

### Products and variants

One **product = one design** (e.g. "Midnight Marble").

| Option | Values (examples) |
|--------|-------------------|
| `Phone Model` | iPhone 16 Pro, Galaxy S25, OnePlus 13, Redmi Note 14 Pro… |
| `Case Type` | Soft silicone, Glass… |

- Each variant (model × case type) has its own SKU, price and **inventory item** with a stock count at "Home warehouse".
- Turn on **manage inventory**, and keep backorders **off** so customers can't buy out-of-stock cases.
- SKU format: `DESIGN-MODEL-TYPE`, e.g. `MRBL-IP16P-SOFT`.

### Organisation

| Medusa feature | Used for |
|----------------|----------|
| **Collections** | `trending`, `new-arrivals` |
| **Categories** | Themes: Minimal, Aesthetic, Abstract, Quotes… |
| **Tags** | `bestseller`, `limited` for badges |
| **Product metadata** | `trending_rank` (manual order of the Trending row), material, finish, care notes |
| **Custom module `phone-model`** | brand, model name, slug, release year, image. Drives the phone picker and the "shop by phone" pages, and can be edited from an Admin page we add. |

### Custom store API routes

Medusa's standard `/store/products` filter can't filter by "has an in-stock variant for phone X", so we add:
- `GET /store/phone-models`: brands and models for the picker
- `GET /store/phones/:slug/products`: designs with an in-stock variant for that phone

### ⚠️ Inventory reality check

Stock multiplies quickly: **designs × phone models × case types**. Even 20 designs × 15 models × 2 types is 600 SKUs.
- Launch with **1–2 case types** and the **top 12–15 phone models** your audience uses.
- A daily **low-stock alert** job emails you every variant with fewer than 3 units in stock.
- Expand models and types only where sales data shows demand.

## 4. Payments, shipping and emails

### Razorpay (custom payment provider)
The community Razorpay plugins for Medusa v2 are all early versions (v0.x). We'll write a small provider module ourselves, using one of them as a reference:
1. At checkout, Medusa creates a payment session, and the provider creates a **Razorpay order**.
2. The storefront opens **Razorpay Checkout**, where the customer pays by UPI, card, netbanking or wallet.
3. The provider **verifies the payment signature** before completing the cart.
4. A **Razorpay webhook** (`payment.captured`, `payment.failed`, refunds) at `/hooks/payment/razorpay` keeps payment status correct even if the customer closes the tab.
5. Refunds go through the Medusa Admin.

Use Razorpay **test mode** keys until launch.

### Cash on Delivery
- Uses Medusa's built-in manual payment provider, labelled "Cash on Delivery". It's marked paid when the courier sends your COD money.
- If you choose a COD fee, a small custom workflow adds a "COD charge" line to the order when COD is selected.
- Optionally cap COD at an order value limit.

### Shipping
- **Launch:** create each shipment in the Shiprocket panel, then add the tracking number to the order in Medusa Admin. That triggers the "shipped" email.
- **Phase 2:** a custom Medusa fulfillment provider calls the Shiprocket API to create shipments, fetch tracking automatically, and run a pincode serviceability check on the product page.

### Emails (Medusa Notification module + Resend)
Subscribers in the worker send: order confirmation, order shipped (with tracking link), order cancelled/refunded, and your daily low-stock alert.

### GST invoices
Medusa doesn't generate tax invoices. If you're GST-registered, the worker generates a PDF invoice on `order.placed` (with React-PDF), stores it in R2 and attaches it to the confirmation email. Confirm the registration rules and invoice format with your CA.

## 5. Pages (Next.js routes)

| Route | Purpose |
|-------|---------|
| `/` | Hero, "Select your phone" picker, Trending row, New arrivals, Shop by theme, Shop by brand, trust strip (COD, free shipping threshold, returns) |
| `/trending` | Full trending collection with filters |
| `/collections/[handle]`, `/categories/[handle]` | Listings. Filters: phone model, case type, price; sort options. |
| `/phones/[brand]/[model]` | "iPhone 16 Pro back covers": every design in stock for that model. **Main SEO entry point.** |
| `/products/[handle]` | Gallery, model and case-type selectors, live stock state, price, add to cart, related designs |
| `/search` | Medusa product search (`q`); Meilisearch in Phase 2 |
| Cart | Slide-out drawer |
| `/checkout` | Contact → address (Indian address + pincode) → shipping → payment (Razorpay / COD) → place order |
| `/order/confirmed/[id]` | Confirmation page and summary |
| `/account` | Optional login, order history, saved addresses. Guest checkout stays allowed. |
| `/pages/[slug]` | Shipping, returns, privacy, terms, contact (Markdown files in the repo) |

## 6. MVP features

1. **"My phone" picker.** The customer picks their model once and it's saved in a cookie. Listings then show only designs available for that phone, and the product page preselects it.
2. **Catalog browsing.** Trending, collections, themes, brand pages, filters, sorting.
3. **Product page.** Gallery, variant selection, stock state (in stock / only N left / sold out), add to cart.
4. **Cart drawer.** Medusa cart with the cart ID in a cookie, quantity changes, and a free-shipping progress bar.
5. **Checkout.** Guest checkout, Razorpay + COD, automatic discount codes (Medusa Promotions, which also covers "Buy 2 get 10% off").
6. **Order emails, GST invoice, low-stock alerts.**
7. **WhatsApp support button.** Floating button that opens chat with a prefilled message.
8. **SEO basics.** Metadata per page, Product JSON-LD, sitemap, OG images, fast mobile pages.

## 7. Project structure

```
themobilecasesstore/
├── apps/
│   ├── backend/                          # Medusa v2
│   │   ├── medusa-config.ts
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── phone-model/          # data model + service
│   │       │   └── razorpay/             # payment provider
│   │       ├── api/store/phones/…        # custom store routes
│   │       ├── workflows/                # COD charge, invoice
│   │       ├── subscribers/              # emails, storefront revalidation
│   │       ├── jobs/                     # daily low-stock alert
│   │       └── admin/                    # phone-model admin page
│   └── storefront/                       # Next.js 16
│       └── src/
│           ├── app/(store)/…             # routes from §5
│           ├── app/api/revalidate/route.ts
│           ├── components/{ui,product,cart,checkout,phone-picker}/
│           └── lib/medusa/               # js-sdk client, data fetchers
├── infra/
│   ├── docker-compose.yml                # postgres, redis, medusa-server, medusa-worker, storefront, caddy
│   ├── Caddyfile
│   └── backup.sh                         # pg_dump → R2
├── .env.example                          # no real secrets in git
└── claudedocs/store-spec.md
```

## 8. Running it on the KVM 2

### Memory budget (rough estimate, measure after launch)

| Service | Approx. RAM |
|---------|-------------|
| Postgres | 0.5–1 GB |
| Redis | ~0.1 GB |
| Medusa server | 0.5–1 GB |
| Medusa worker | ~0.5 GB |
| Next.js storefront | 0.3–0.5 GB |
| Caddy | < 0.1 GB |
| **Total** | **≈ 2–3.5 GB of 8 GB** |

Medusa's docs ask for at least 2 GB, so there's plenty of headroom. **Build Docker images in GitHub Actions, not on the VPS.** Next.js and Medusa builds spike in memory and slow the live store.

### Server security
- SSH key login only. Disable password and root login.
- Firewall (`ufw`): only ports 22, 80, 443 open. Postgres and Redis are **never** reachable from the internet; they stay on the internal Docker network.
- Automatic security updates (`unattended-upgrades`), plus `fail2ban`.
- Cloudflare proxy in front, set to "Full (strict)" SSL.
- Secrets (`JWT_SECRET`, `COOKIE_SECRET`, Razorpay keys, DB password) only in the server's `.env`. Generate them randomly and never commit them.

### Backups (this replaces what Shopify did for you)
- Nightly `pg_dump`, compressed and uploaded to Cloudflare R2. Keep 14 daily + 8 weekly copies.
- Product images already live in R2, not on the VPS disk.
- Take a Hostinger snapshot before every Medusa upgrade.
- **Restore a backup to a test database once a month.** A backup you've never restored is a guess.

### Deploys and monitoring
- Push to `main` → GitHub Actions builds the images → pushes them to GHCR → SSHes into the VPS → `docker compose pull && docker compose up -d`. Medusa's `predeploy` script runs `medusa db:migrate` first.
- Free uptime monitor (UptimeRobot or Better Stack) on the homepage and `api.yourstore.in/health`, alerting to email or Telegram.
- Docker `restart: unless-stopped` and log rotation on every container.

## 9. Phases

**Phase 0: Setup**
- Domain, Cloudflare, brand name, logo, colour palette
- Harden the VPS, set up Docker Compose, Caddy, Postgres, Redis
- Accounts: Razorpay (KYC takes time, start early), Shiprocket, Resend, Cloudflare R2
- List the launch phone models and case types
- Photograph the first 15–25 designs on real phones, or mock them up

**Phase 1: MVP**
- Medusa backend: region/tax/sales channel/stock location/shipping config, phone-model module + store routes, Razorpay provider, COD, emails, invoice, low-stock job
- Storefront: layout, home, listings, phone pages, product page, cart drawer, checkout, confirmation, policy pages, SEO
- Infra: CI/CD, backups, uptime monitoring
- Test orders end to end in Razorpay test mode (prepaid, COD, refund, out-of-stock), restore a backup once, then launch

**Phase 2: Growth**
- Shiprocket API integration + pincode check
- Reviews with photos (custom Medusa module)
- Meilisearch for better search (fits on the same VPS)
- Wishlist, "As seen on Insta" collection
- Analytics: GA4 + Meta Pixel (with server-side purchase events)

**Phase 3: Later (optional)**
- Custom photo-upload cases with live preview
- Screen guards / accessories as add-ons at checkout

## 10. Risks to watch

- **You run the server now.** Downtime, security patches and backups are your job. The setup in §8 covers the basics; don't skip the restore test.
- **Licensed artwork.** Many "trending" designs are anime characters, football clubs, Marvel or brand logos. Selling those without a licence risks takedowns, Razorpay account suspension or legal notices. Stick to original or licensed artwork.
- **Razorpay integration.** Payment code is the riskiest code we write: always verify signatures and handle webhooks, and test refunds and failed payments before launch.
- **Medusa upgrades.** Medusa v2 updates often. Pin versions, and upgrade on a test copy first.
- **Inventory spread.** Covered in §3. Start narrow.
- **COD returns (RTO).** Use a COD fee or cap, order confirmation via WhatsApp, and the courier's RTO-risk scoring.
- **Viral traffic.** A Reel can send a spike. Cloudflare caching of product pages absorbs most of it, and the VPS can be upgraded to KVM 4 if needed.

## 11. Open questions for you

1. Store/brand name and domain?
2. Which phone models at launch? (Your top 12–15)
3. Which case types and price points? (e.g. soft ₹299–₹399, glass ₹499–₹599)
4. Where do the designs come from: your own artists, a supplier's catalog, or licensed?
5. Free-shipping threshold and COD policy (fee? order value cap?)
6. Returns/replacement policy (e.g. 7-day replacement for damage/wrong model)?

## 12. Yearly cost estimate

_Checked 2026-10-28. Shipping, packaging and VPS renewal figures are estimates: check them against your Shiprocket dashboard, suppliers and Hostinger account. Excludes the cost of the cases themselves._

### Fixed yearly costs

| Item | Yearly |
|------|--------|
| Hostinger KVM 2 | Already paid. Check your renewal price: reviews report promo rates rising to about $15/mo (≈ ₹15,000/yr) at renewal. |
| Domain (.in / .com) | ~₹1,000 |
| Cloudflare (DNS, SSL, CDN) | ₹0 (free plan) |
| Cloudflare R2 (images + backups) | ₹0 (free tier covers 10 GB) |
| Resend (order emails) | ₹0 (free tier; check its monthly limit against your order volume) |
| Uptime monitoring | ₹0 (free tier) |
| Medusa | ₹0 (open source) |
| **Total** | **≈ ₹1,000 + your VPS** |

Not included: CA/GST filing fees, business email, ads.

### Variable cost per order

| Item | Prepaid order | COD order |
|------|---------------|-----------|
| Razorpay fee: 2% + GST = 2.36% | ₹10.6 on ₹450 | — |
| Shipping (estimate, 1 case < 500 g) | ₹50–70 | ₹50–70 |
| Courier COD charge (estimate) | — | ₹30–45 |
| Packaging | ₹10–15 | ₹10–15 |
| **Total** | **≈ ₹70–95** | **≈ ₹90–130** |

### Example year: 1,000 orders, ₹450 average order, 60% prepaid

| | Medusa on KVM 2 | Shopify Basic (old plan) |
|--|-----------------|--------------------------|
| Fixed costs | ₹1,000 | ₹22,000 |
| Payment fees | ₹6,400 | ₹12,700 |
| Shipping (1,000 × ₹60) | ₹60,000 | ₹60,000 |
| COD charges (400 × ₹40) | ₹16,000 | ₹16,000 |
| Packaging (1,000 × ₹12) | ₹12,000 | ₹12,000 |
| **Total running cost** | **≈ ₹95,000** + VPS | **≈ ₹1.23 lakh** |

The saving is ≈ ₹27,000 in year one, and it grows with every prepaid order, since there's no 2% platform fee. Even counting a full VPS renewal (~₹15,000), self-hosting still costs less. In exchange, you take on the server work in §8.
