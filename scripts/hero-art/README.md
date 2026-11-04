# Home hero art

The art for the home hero and the category tiles, written to `apps/storefront/public/home/`.
Layouts and paths live in `apps/storefront/src/components/home/showcase/showcase-data.ts` (hero)
and `CategoryTiles.tsx` (tiles).

| File | What it is | Source |
| --- | --- | --- |
| `phone-magsafe-*.webp` | CaseCraft Silicone MagSafe, black, on an iPhone 15 Pro | Shop photo 50113 "On the phone", lifted off its backdrop |
| `phone-sf-carbon-*.webp` | CaseCraft SF Carbon on an iPhone 16 | Shop photo 50129 "On the phone", lifted off its backdrop |
| `guard-*.webp` | Edge-to-edge tempered glass screen guard | Render (`scenes.js`), no text or branding |
| `orbit-*.webp` | Translucent aqua glass loop behind the products | Render |
| `plinth-*.webp`, `plinth-stone-*.webp` | Polished base, teal and stone | Render |

The earbuds reuse the shop's existing cutout, `public/products/photos/gadgets/boat-800-hidef/cut-*.webp`.

## Rebuild everything

Run from the repo root, after `pnpm install`. The work directory can be anywhere.

```sh
sh scripts/hero-art/fetch-model.sh                       # ISNet model, ~170 MB, into scripts/hero-art/.models
M=scripts/hero-art/.models/isnet-general-use.onnx
P=apps/storefront/public/products/photos
python3 scripts/hero-art/cutout.py $M $P/50113/g-4-1440.webp /tmp/hero-art/phone-magsafe.png
python3 scripts/hero-art/cutout.py $M $P/50129/g-4-1440.webp /tmp/hero-art/phone-sf-carbon.png
node scripts/hero-art/render.mjs /tmp/hero-art/render       # three.js in headless Chromium
node scripts/hero-art/export.mjs /tmp/hero-art              # responsive WebP into public/home
```

`cutout.py` needs Python 3 with numpy, Pillow and onnxruntime. `render.mjs` needs Playwright's
Chromium; WebGL runs on SwiftShader, so no GPU is needed.

## Swap in other product art

1. Lift the product off its background: `python3 scripts/hero-art/cutout.py $M your-image.png /tmp/hero-art/<name>.png`
   (a render on plain white works as well as a photo).
2. Add `'<name>.png': ['<name>', [320, 560]]` to `MANIFEST` in `export.mjs` and run it.
3. Point the matching entry in `PRODUCT_ART` (showcase-data.ts) or `TILES` (CategoryTiles.tsx) at the
   new files, with the new width and height. Keep each hotspot and link pointing at a page that sells
   what the picture shows.
