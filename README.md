# CaseCraft Store

Modern e-commerce storefront for premium mobile cases and accessories, featuring interactive 3D product previews and smooth motion-driven UI.

Customers pick their phone, browse curated back-cover designs that fit it, inspect each case in 3D, and check out. The store is built for India: INR pricing, UPI, cards and cash on delivery.

> **Status: in development.** The storefront runs on built-in sample data (`src/lib/medusa/fixtures.ts`). The Medusa commerce backend, checkout and payments are planned but not connected yet. See [`claudedocs/store-spec.md`](claudedocs/store-spec.md).

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
| Package manager | pnpm workspaces |
| Planned backend | Medusa v2, PostgreSQL, Redis |
| Planned services | Razorpay, Shiprocket, Cloudflare R2, Resend |

## Project structure

```text
.
├── apps/
│   └── storefront/               # Next.js customer-facing store
│       ├── public/products/      # Product photos and generated variants
│       ├── scripts/              # Photo variant and shot generators
│       └── src/
│           ├── app/(store)/      # Home page and /products/[handle]
│           ├── components/       # home, product viewer, phone picker, motion, ui
│           └── lib/              # catalog, designs, three, medusa (sample data)
├── claudedocs/                   # Store spec and page briefs
├── scripts/photo-cutout/         # Swift tool that cuts products out of photos
├── package.json
└── pnpm-workspace.yaml
```

## Getting started

### Prerequisites

- Node.js 20 or newer
- pnpm 10. Run `corepack enable` once to get the version pinned in `package.json`.

### Install and run

```bash
git clone https://github.com/clique-x/casecraft-store.git
cd casecraft-store
pnpm install
pnpm dev
```

Open http://localhost:3000.

No environment variables are needed yet. When Medusa is connected, add them to `apps/storefront/.env.local`, which git ignores.

### Scripts

Run these from the repository root:

| Command | What it does |
|---|---|
| `pnpm dev` | Start the storefront in development mode |
| `pnpm build` | Create a production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Generate route types and run the TypeScript compiler |

Product photo tools, run from `apps/storefront`:

| Command | What it does |
|---|---|
| `pnpm photos` | Generate 320 to 960 px WebP variants from catalogue originals |
| `pnpm photos:shots <dir>` | Turn hand-held shots into 4:5 card images |

To cut a product out of a photo on macOS, see [`scripts/photo-cutout/README.md`](scripts/photo-cutout/README.md).

## Roadmap

- [x] Home page with hero, themes and trending designs
- [x] Product page with 3D viewer and photo gallery
- [x] Phone picker
- [ ] Medusa v2 backend with products, stock and orders
- [ ] Cart and checkout
- [ ] Razorpay and cash on delivery
- [ ] Shiprocket shipping and order tracking
- [ ] Deployment to the VPS behind Cloudflare

## License

Proprietary. © 2026 CaseCraft. All rights reserved.
