# New ranges, November 2026 (source material, not served)

This is the working material for the next catalogue additions. Nothing in this folder is built into the site or the
Docker image (`catalog-sources` is in `.dockerignore`). Product photos for the store are generated from it with
`pnpm --filter storefront photos:gadgets <srcDir>` once each product's id and gallery order are fixed.

## Status (7 Nov 2026)

- **Prices:** the owner fills them in on the price sheet, https://claude.ai/artifact/KgVdHwVJKjPvUy5cyN2jv9
  (146 rows; its data lives in the artifact's `prices` collection, one document per row id, fields `online`,
  `mrp`, `ours` (owner's own price, or null), `final`, `stock` = `shop` | `order` | `skip`).
  Rules: online − ₹90–100 rounded to end in 9; boAt Stone 1200 Pro online − ₹400; Stone Arc Pro online − ₹300;
  Ranz OTG fixed ₹170. `order` items show "Ships in 3–5 days".
- **Nothing is listed yet.** Products go live only after prices are in, screenshots are approved and the owner says "ok push".

## What is here

| Folder | Contents |
|---|---|
| `teal/` | 114 listing images (1440 px WebP): official brand photos cut out and placed on the GadgetsHub teal stage. Memory cards, SSDs (Samsung, SanDisk, WD), Consistent SSDs, boAt Stone 1200 Pro / Arc Pro, CP Plus ezyKam+ E28Q/E38Q/E48Q. `manifest.json` gives part number, source URL and caveats per image; `contact-sheet.jpg` per range. |
| `ram/` | Our own unbranded DDR3/DDR3L/DDR4/DDR5 desktop and laptop RAM renders, plus the empty stage plates (`plate-front`, `plate-34`) used for compositing. |
| `shop-photos/` | The owner's Drive photos (teal edition), only the views the audit kept, numbered in listing order. `index.json` maps each to its ZIP folder. |
| `research/` | Official specs per range (`range.json` + notes): SSDs, memory cards, Consistent. |
| `audit/` | Per-product photo audit (`a-01-08` … `d-26-31`), boAt / CP Plus / Consistent notes (`new-ranges.md`), RAM plan, owner prices. |
| `tools/` | Scripts that made the above (they reference the session's scratch paths; adjust before re-running). |

## Open questions for the owner (block those products until answered)

- #14 hydrogel film: front screen or back film?
- #15 FLAYR glass: the box prints "8K"; can that box go to buyers?
- #17 FLAYR Super Large Arc: which phone?
- #20 Tom & Jerry black: Redmi A1 or A2?
- #24 clear bumper Edge 60 Pro: frame black or navy?
- #30 metal frame iPhone 16 Pro: does the Apple logo show through?
- #3 Samsung RAM: label says laptop DDR4, owner says desktop DDR3; measure the stick. #2 Hynix: needs new photos.
- #25 butterfly glitter case and #31 detachable frame: new photos needed.
- Consistent "M.2 SATA" line: SATA or NVMe? (their pages say both). Consistent 2.5" 512GB has no usable photo.
- Character prints (Hello Kitty, Tom & Jerry) are trademarks: owner's call to list.

## Not covered

Crucial and Kingston (SSDs, memory cards): their sites refuse automated requests; needs model names or box photos
from the owner. Samsung EVO Plus 2021 microSD is not sold in India any more and is left off.
