# CaseCraft Store

Modern e-commerce storefront for premium mobile cases and accessories, featuring interactive 3D product previews and smooth motion-driven UI.

Customers pick their phone, browse curated back-cover designs that fit it, inspect each case in 3D, and check out. The store is built for India: INR pricing, UPI, cards and cash on delivery.

> **Status: in development.** Products, prices, stock, cart, checkout (Razorpay and Cash on Delivery) and order tracking run on the Medusa backend in `apps/backend`. Without Medusa settings the storefront falls back to built-in sample data and orders go to WhatsApp. Order emails and Shiprocket are not built yet. See [`claudedocs/store-spec.md`](claudedocs/store-spec.md).

## Features

- **3D product viewer.** Rotate and inspect cases on a real phone model, built with React Three Fiber.
- **Phone picker.** Choose your phone and see only the designs that fit it.
- **Motion-driven UI.** Word reveals, marquees and page transitions with GSAP and Motion.
- **Real product photography.** Responsive WebP images with generated size variants.
- **Fast by default.** Next.js 16 App Router with cache components and partial prefetching.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI |
| Animation | GSAP, Motion |
| 3D | Three.js, React Three Fiber, Drei |
| Images | sharp (variant generation), macOS Vision (photo cutouts) |
| Commerce backend | Medusa v2, PostgreSQL, Redis |
| Package manager | pnpm workspaces |
| Planned services | Razorpay, Shiprocket, Cloudflare R2, Resend |

## Project structure

```text
.
├── apps/
│   ├── backend/                  # Medusa v2: products, stock, phone models, admin
│   │   ├── data/catalog.json     # Catalogue loaded by the seed script
│   │   └── src/                  # phone-model module, store API, seed, subscribers
│   └── storefront/               # Next.js customer-facing store
│       ├── public/products/      # Product photos and generated variants
│       ├── scripts/              # Photo tools and the catalogue export
│       └── src/
│           ├── app/(store)/      # Home page and /products/[handle]
│           ├── app/api/revalidate/  # Called by Medusa after catalogue changes
│           ├── components/       # home, product viewer, phone picker, motion, ui
│           └── lib/medusa/       # Medusa client, catalogue loader, sample data
├── infra/docker-compose.dev.yml  # Local Postgres and Redis
├── claudedocs/                   # Store spec and page briefs
├── scripts/photo-cutout/         # Swift tool that cuts products out of photos
├── package.json
└── pnpm-workspace.yaml
```

## Getting started

### Prerequisites

- Node.js 22.23 or newer
- pnpm 10. Run `corepack enable` once to get the version pinned in `package.json`.
- For the backend: PostgreSQL and Redis. `infra/docker-compose.dev.yml` starts both with Docker.

### Storefront only, with sample data

```bash
git clone https://github.com/clique-x/casecraft-store.git
cd casecraft-store
pnpm install
pnpm dev
```

Open http://localhost:3000.

### With the Medusa backend

1. Start Postgres and Redis:

   ```bash
   docker compose -f infra/docker-compose.dev.yml up -d
   ```

2. Set up and start the backend. The seed prints the values for the next step.

   ```bash
   cp apps/backend/.env.example apps/backend/.env
   pnpm backend:migrate
   pnpm backend:seed
   pnpm backend:dev
   ```

3. Copy `apps/storefront/.env.example` to `apps/storefront/.env.local` and fill in the publishable key and region ID from the seed output. Use the same secret for `REVALIDATE_SECRET` there and `STOREFRONT_REVALIDATE_SECRET` in the backend's `.env`.

4. Start the storefront with `pnpm dev`.

The admin dashboard is at http://localhost:9000/app. Create a login with `npx medusa user -e you@example.com -p your-password` from `apps/backend`. Price and stock changes made there show on the storefront on the next page load.

The storefront fetches the catalogue at build time too, so Medusa must be running for `pnpm build` when the Medusa variables are set. See [`apps/backend/README.md`](apps/backend/README.md) for details.

### Scripts

Run these from the repository root:

| Command | What it does |
|---|---|
| `pnpm dev` | Start the storefront in development mode |
| `pnpm build` | Create a production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Generate route types and run the TypeScript compiler |
| `pnpm backend:dev` | Start Medusa and its admin dashboard on port 9000 |
| `pnpm backend:migrate` | Apply database migrations |
| `pnpm backend:seed` | Set up the India store and load the catalogue |
| `pnpm catalog:export` | Rewrite `apps/backend/data/catalog.json` from the storefront's sample catalogue |

Product photo tools, run from `apps/storefront`:

| Command | What it does |
|---|---|
| `pnpm photos` | Generate 320 to 960 px WebP variants from catalogue originals |
| `pnpm photos:shots <dir>` | Turn hand-held shots into 4:5 card images |
| `pnpm photos:gallery <dir>` | Turn `<id>/<n>-<Label>.jpg` files into the square product-page gallery, in display order |

To cut a product out of a photo on macOS, see [`scripts/photo-cutout/README.md`](scripts/photo-cutout/README.md).

## Roadmap

- [x] Home page with hero, themes and trending designs
- [x] Product page with 3D viewer and photo gallery
- [x] Phone picker
- [x] Medusa v2 backend with products, prices, stock and phone models
- [x] Shop by phone, look, trending, new arrivals and search pages
- [x] Cart drawer, cart page and checkout with Indian address and pincode lookup
- [x] Razorpay and Cash on Delivery
- [x] Order confirmation and order tracking
- [x] Shipping, returns, refunds, privacy, terms and contact pages
- [x] Screen guards, lens protectors, back films and a flagship body protection film, with add-ons and ready-made bundles on cover pages
- [x] Phone-aware combo deals on the home page
- [x] Wireless audio: earbuds, neckbands and Bluetooth speakers with colour options (`/audio`)
- [x] Chargers and original data cables with phone-fit notes (`/charging`)
- [x] Step-by-step checkout with saved addresses, location and pincode autofill, and phone login (Twilio Verify)
- [ ] Order emails (Resend) and GST invoices
- [ ] Phone-model admin page
- [ ] Shiprocket shipping and order tracking
- [ ] Deployment to the VPS behind Cloudflare

## License

Proprietary. © 2026 CaseCraft. All rights reserved.
