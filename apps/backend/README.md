# CaseCraft backend (Medusa v2)

The commerce backend for the storefront: products, prices, stock, phone models and, later, carts, orders and payments. The Medusa Admin dashboard runs at http://localhost:9000/app.

## What is set up

| Piece | Where | Notes |
|---|---|---|
| Store, region, tax | `src/scripts/seed.ts` | One region, India, in INR with tax-inclusive prices. No GST rate yet: confirm it with your CA. |
| Stock location and shipping | `src/scripts/seed.ts` | "Home warehouse" with Standard delivery: ₹49, free from ₹499. The ₹49 fee is a placeholder. |
| Catalogue | `data/catalog.json` | Exported from the storefront by `pnpm catalog:export`, loaded by the seed. |
| Accessories | `data/catalog.json` | Screen guards (clear, privacy), camera lens protector, full-frame back films (matte, carbon) and a body protection film for flagships only, one variant per supported phone model, with product types. |
| Bundle pricing | `src/scripts/seed.ts` | Automatic promotion `BUNDLE50`: ₹50 off each accessory when the cart also holds a phone cover. Medusa re-checks it on every cart change. Change the amount in the admin under Promotions, and `BUNDLE_SAVING_INR` in `apps/storefront/src/lib/catalog/accessories.ts` to match. |
| Phone models | `src/modules/phone-model` | Custom module with brand, name, release year, camera island and picker order. |
| Phone models API | `src/api/store/phone-models/route.ts` | `GET /store/phone-models`, used by the phone picker. |
| Razorpay | `src/modules/razorpay` | Payment provider: a Razorpay order per checkout, payment confirmed with Razorpay's API before an order is created, refunds from the admin, webhooks. Turned on when its keys are set. |
| Cash on Delivery | built in | Medusa's manual provider (`pp_system_default`), shown as Cash on Delivery. Mark the payment as captured in the admin once the courier remits. |
| Order tracking API | `src/api/store/order-lookup/route.ts` | `GET /store/order-lookup?order=&contact=`: order number plus the email or phone on the order. |
| Phone login | `src/lib/phone-otp.ts`, `src/api/store/otp`, `src/api/store/my-addresses` | Twilio Verify sends a code; after a correct code, the addresses of past orders with that phone show at checkout. Rate limited. Off until `TWILIO_VERIFY_SERVICE_SID` is set. |
| Storefront refresh | `src/subscribers/revalidate-storefront.ts` | Tells the storefront to refresh its cached catalogue when products, prices or stock change. |

Product metadata carries what the storefront needs to draw each cover: `photo_id` for photographed covers, `design_id` for procedural designs, plus `trending_rank`, `is_new`, `badge`, `regular_inr` and the `detail_*` copy. Each variant has `model_slug` and `case_type` in its metadata.

A product created in the admin only appears on the storefront once it has a `photo_id` that exists in `apps/storefront/src/lib/catalog/photo-catalog.json`, or a known `design_id`.

## Run it locally

You need Node.js 22.23 or newer, Postgres and Redis. The quickest way to get Postgres and Redis is Docker:

```bash
docker compose -f infra/docker-compose.dev.yml up -d
```

Run that from the repository root. With Homebrew instead: `brew install postgresql@16 redis`, start both, then `createdb casecraft`.

Then, from `apps/backend`:

```bash
cp .env.example .env
pnpm db:migrate
pnpm seed
npx medusa user -e you@example.com -p choose-a-password
pnpm dev
```

`pnpm seed` prints the publishable key and region ID the storefront needs. Copy them into `apps/storefront/.env.local`, as described in `apps/storefront/.env.example`.

The seed is safe to run again. It only adds what is missing and never overwrites admin edits.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start Medusa with the admin dashboard, reloading on changes |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm seed` | Set up the India store and load `data/catalog.json` |
| `pnpm build` / `pnpm start` | Production build and server |
| `npx medusa db:generate phoneModel` | Create a migration after changing the phone-model data model |

## Razorpay

1. In the Razorpay dashboard, open Account & Settings, then API Keys, and generate **test mode** keys.
2. Put them in `.env` as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`, restart Medusa, and run `pnpm seed` once. The seed adds Razorpay to the India region.
3. For webhooks, add `https://<your-api-domain>/hooks/payment/razorpay_razorpay` under Settings, then Webhooks, with the events `payment.authorized`, `payment.captured`, `payment.failed` and `order.paid`. Copy its secret into `RAZORPAY_WEBHOOK_SECRET`. Webhooks need a public URL, so they only work once the backend is deployed or tunnelled.
4. Test card: 4111 1111 1111 1111, any future expiry, any CVV. Test UPI: `success@razorpay`.
5. Switch to live keys only at launch.

Unit tests for the provider: `TEST_TYPE=unit NODE_OPTIONS=--experimental-vm-modules npx jest src/modules/razorpay`.

## Phone login (Twilio Verify)

1. In the Twilio Console open Identity, then Verify, then Services, and create a service with SMS on. Creating a service needs an upgraded (paid) Twilio account.
2. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_VERIFY_SERVICE_SID` in `.env` and restart Medusa.
3. Checkout then shows "Ordered before? Find my saved addresses" under the mobile number.

Limits: 3 codes per number per 10 minutes, 5 code checks per number per 10 minutes, 10 sends per IP per hour. They are kept in memory, so they reset when Medusa restarts.

## Production notes

- Set `REDIS_URL`. Events, workflows, locks and the cache then go through Redis, so a separate worker process can share them.
- Run one process with `MEDUSA_WORKER_MODE=server` and one with `MEDUSA_WORKER_MODE=worker`.
- Generate real `JWT_SECRET`, `COOKIE_SECRET` and `STOREFRONT_REVALIDATE_SECRET` values. Never commit `.env`.
