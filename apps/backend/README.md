# CaseCraft backend (Medusa v2)

The commerce backend for the storefront: products, prices, stock, phone models and, later, carts, orders and payments. The Medusa Admin dashboard runs at http://localhost:9000/app.

## What is set up

| Piece | Where | Notes |
|---|---|---|
| Store, region, tax | `src/scripts/seed.ts` | One region, India, in INR with tax-inclusive prices. No GST rate yet: confirm it with your CA. |
| Stock location and shipping | `src/scripts/seed.ts` | "Home warehouse" with Standard delivery: ₹49, free from ₹499. The ₹49 fee is a placeholder. |
| Catalogue | `data/catalog.json` | Exported from the storefront by `pnpm catalog:export`, loaded by the seed. |
| Phone models | `src/modules/phone-model` | Custom module with brand, name, release year, camera island and picker order. |
| Phone models API | `src/api/store/phone-models/route.ts` | `GET /store/phone-models`, used by the phone picker. |
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

## Production notes

- Set `REDIS_URL`. Events, workflows, locks and the cache then go through Redis, so a separate worker process can share them.
- Run one process with `MEDUSA_WORKER_MODE=server` and one with `MEDUSA_WORKER_MODE=worker`.
- Generate real `JWT_SECRET`, `COOKIE_SECRET` and `STOREFRONT_REVALIDATE_SECRET` values. Never commit `.env`.
