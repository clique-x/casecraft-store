# Product page brief — `/products/[handle]`

_Written 2026-10-30. Scope: the product detail page only. No cart, no checkout: the Medusa backend does not exist yet, so the buy button is deliberately inert and says so._

Binding spec: store-spec.md §1 (pick phone → designs that fit), §5 row `/products/[handle]` ("Gallery, model and case-type selectors, live stock state, price, add to cart, delivery estimate, related designs"), §6 feature 1 (`my_phone` cookie), §10 (original art only). Design language, tokens, fonts, motion: homepage-brief.md §4–§6 apply unchanged.

---

## 0. One paragraph

A visitor lands from a Trending card or an Instagram link. Above the fold on a phone they see the case in 3D (or a CSS case on low-end devices), the design name, the price for their phone, and two choices: which phone, which case type. Their phone is already selected if the `my_phone` cookie is set, and the 3D case shows that phone's camera island. Picking a model or case type updates the price, the stock line and the viewer with no page reload. Under that: a plain "Add to cart" that is visibly not live yet ("Checkout is coming soon"), a working "Ask on WhatsApp" link, the delivery and returns facts, product details, and two rows: more designs in the same theme and more designs that fit the selected phone.

## 1. Data model (fixtures until Medusa)

`lib/medusa/fixtures.ts` gains:

```ts
export type CaseType = 'soft' | 'glass';
export const CASE_TYPES: readonly { type: CaseType; name: string; blurb: string; priceDeltaInr: number }[] = [
  { type: 'soft',  name: 'Soft silicone', blurb: 'Flexible TPU, matte print, raised lip', priceDeltaInr: 0 },
  { type: 'glass', name: 'Glass back',    blurb: 'Tempered glass, glossy print, TPU bumper', priceDeltaInr: 150 },
];
export interface Variant { id: string; sku: string; modelSlug: string; caseType: CaseType; priceInr: number; stock: number }
export interface ProductDetail extends HomeProduct {
  description: string;            // 2–3 sentences, original copy per design family
  caseTypes: CaseType[];          // ['soft'] or ['soft','glass'] (glass only when design.finish === 'glass')
  variants: Variant[];            // fitsModels × caseTypes
  details: { material: string; print: string; fit: string; care: string };
}
```

- `priceInr` = `priceFromInr + priceDeltaInr`. SKU = `DESIGN-MODEL-TYPE` upper-cased, e.g. `MRBL-IP16P-SOFT` (derive a short code per design and model deterministically).
- `stock` is deterministic from (design seed, model slug, type): most 6–40, about 1 in 6 is 1–3 ("Only N left"), about 1 in 10 is 0 ("Sold out"). Never all sold out for a design.
- `lib/medusa/products.ts`: `getProduct(handle): Promise<ProductDetail | null>`, `getProductHandles(): Promise<string[]>`, `getRelatedByTheme(product, limit = 6): Promise<HomeProduct[]>`, `getMoreForPhone(product, modelSlug, limit = 6): Promise<HomeProduct[]>`. Pure, fixture-backed, wrapped in `'use cache'` with `cacheLife('max')` if that is what the Next 16 docs recommend for prerendered dynamic routes; otherwise plain async.

## 2. Route

- `app/(store)/products/[handle]/page.tsx` (server). `generateStaticParams` from `getProductHandles()`, `export const dynamicParams = false`, `notFound()` on unknown handles, `generateMetadata` (title `{name} phone back cover`, description from `description`, OG image deferred). Product JSON-LD with `offers` (lowest price, `InStock`/`OutOfStock` from any variant), `brand` = BRAND_NAME.
- `app/(store)/products/[handle]/not-found.tsx`: "That cover has moved" + link to `/trending` and the phone picker.
- `params` is a Promise in Next 16: `const { handle } = await params`.
- The page is fully static. The visitor's phone and query string are read on the client only (cookie via `useMyPhone`, `?model=` and `?type=` via `window.location` in an effect, never `useSearchParams`/`searchParams` on the server).

## 3. Layout

Phone (< lg): header → breadcrumb (Home › Trending › {name}) → viewer (square-ish stage, 100% width, ink background with the stage backdrop from the homepage) → buy box → delivery facts → details accordion → related rows → footer. Sticky bottom bar on phones: price + "Add to cart" (inert) replaced by "Ask on WhatsApp" as the only working CTA; it hides while the buy box is on screen.

Desktop (lg+): 12-col grid, max-w-7xl. Viewer sticky in the left 7 columns (`position: sticky; top: 5rem`), buy box + facts + details in the right 5 columns, related rows full-width below.

## 4. Viewer (`components/product/viewer/`)

- `ProductViewer.client.tsx`: tier gate using `detectTier()` (same ladder as the hero; `none` → CSS fallback), lazy `next/dynamic(() => import('./ProductStage'), { ssr: false })`, crossfade from the fallback via `--viewer-opacity`, loads only when in view, frameloop `never` when scrolled away (small `useElementFrameloop(ref)` hook; do not reuse `useHeroFrameloop`, which is tied to `heroState`).
- Fallback and SSR content: `CaseArt` from `components/phone-picker/BrandOutline` with `lip` and the selected model's `islandStyle`, inside the ink stage. Always rendered on the server so there is an LCP image-like element immediately.
- `ProductStage.tsx` (client, three): `<Canvas>` with `SceneLights` (reuse from the hero), camera at `[0, 0, 4.2]`, fov 32; one `ProductCase` group. Drag to rotate (yaw unlimited, pitch clamped ±0.6 rad, expDamp λ 6, inertia on release), slow idle yaw of 0.25 rad/s resuming 3 s after the last interaction, none under reduced motion. Touch: horizontal drag rotates, `touch-action: pan-y` so vertical scroll wins. Keyboard: the stage is focusable with ArrowLeft/Right rotating by 0.3 rad.
- `ProductCase.tsx`: `createFeaturedParts(smoothness, islandStyle)` (extend `lib/three/case-geometry.ts` additively so the island matches `PhoneModel.islandStyle`: square island, two vertical pills, or a circle; the existing call sites keep working with the default). Material: `MeshPhysicalMaterial` with the design map from `getFeaturedTexture(design, 512)`; `glass` case type → clearcoat 1, clearcoatRoughness 0.08, roughness 0.18, iridescence 1 with `getThicknessMap()` when `design.holo` (else `getFlatThicknessMap()`); `soft` → roughness 0.55, clearcoat 0, metalness 0. Dispose textures/materials on unmount.
- The viewer reads the selected model and case type from the variant store (§5) and reacts without remounting.
- Exactly: no shadow maps, no postprocessing, DPR capped by tier, draw calls ≤ 6.

## 5. Buy box (`components/product/BuyBox.client.tsx`)

- `lib/product/variant-store.ts`: a tiny external store per page: `{ modelSlug: string | null; caseType: CaseType }`, `set(partial)`, `subscribe`, `useVariantSelection()`. Initialised by the buy box from: `?model=`/`?type=` if valid, else `my_phone` cookie if the product fits it, else the first in-stock model. Keeps `?model=&type=` in the URL with `history.replaceState` (no navigation).
- Model selector: brand tabs → model chips (same visual language as `PhonePicker`, `aria-pressed` buttons, visible focus). Models the design does not fit are not shown; a "Doesn't fit your {model}" notice appears when the cookie phone is not in `fitsModels`, with a link to `/phones/{brand}/{slug}`. Picking a model also calls `setPhone(slug)` only if no phone was set yet (never overwrite a saved phone silently).
- Case type: two large radio cards (name, blurb, "+₹150"), only the types the design has.
- Price: `tabular-nums`, updates per variant; "from ₹X" only before a model is chosen.
- Stock line: `In stock` (green token) / `Only N left` (warn token) / `Sold out` (muted) from the selected variant; sold-out disables nothing else, it just swaps the CTA label to "Notify me" (inert as well, same coming-soon note).
- CTAs: primary `Add to cart` rendered with `aria-disabled="true"` and a visible helper "Checkout is coming soon · order on WhatsApp for now". Secondary `Ask on WhatsApp` → `https://wa.me/{WHATSAPP_NUMBER}?text=` with design name, model, case type, SKU.
- Delivery facts: dispatch `DISPATCH_WINDOW`, free shipping over `FREE_SHIPPING_THRESHOLD_INR`, COD, `REPLACEMENT_DAYS`-day replacement. Icons from lucide.

## 6. Details and related

- `ProductDetails.tsx` (server): accordion (shadcn-style, token colours) with Material, Print, Fit, Care from `details`; plus a "Design" paragraph (`description`). Keep copy original; no brand or franchise names.
- `RelatedRows.tsx` (server): "More in {theme}" (`getRelatedByTheme`) and "More for your phone" (`MoreForPhone.client` reads the variant store's model and filters `PRODUCTS` client-side from a prop list, so the page stays static). Both reuse `ProductCard` and the row styling from `TrendingRow`.
- Breadcrumb with `BreadcrumbList` JSON-LD.

## 7. Acceptance

- `/products/holo-shift` and all 24 handles prerender as static (`○`); `/products/nope` is a 404 with the store chrome.
- With cookie `my_phone=pixel-9a` the page opens with Pixel 9a selected, the viewer shows a pills island, the price is the soft price, and the sticky bar reads "₹349 · Ask on WhatsApp".
- Switching to Glass updates the price (+150), the stock line and the viewer finish within one frame; the URL gains `?model=pixel-9a&type=glass`; reload restores it.
- A model the design does not fit never appears as a chip; a cookie phone that does not fit shows the notice.
- Keyboard: Tab order breadcrumb → viewer → model tabs/chips → case types → CTAs; chips have visible focus; the inert button is announced as disabled with the reason.
- 360 px: no horizontal scroll, viewer height ≤ 60svh, sticky bar never covers the buy box while it is on screen.
- three is not in the first-load JS of the product route; the 3D chunk loads only after the viewer is in view and the tier is not `none`.
- No hardcoded colours outside catalog palettes; no `any`; typecheck, lint, build green.
