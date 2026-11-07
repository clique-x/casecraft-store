# New ranges, November 2026 (source material, not served)

This is the working material for the next catalogue additions. Nothing in this folder is built into the site or the
Docker image (`catalog-sources` is in `.dockerignore`). Product photos for the store are generated from it with
`pnpm --filter storefront photos:gadgets <srcDir>` once each product's id and gallery order are fixed.

## Status (7 Nov 2026)

- **Prices:** the owner fills them in on the price sheet, https://claude.ai/artifact/KgVdHwVJKjPvUy5cyN2jv9
  (141 rows; its data lives in the artifact's `prices` collection, one document per row id, fields `online`,
  `mrp`, `ours` (owner's own price, or null), `final`, `stock` = `shop` | `order` | `skip`).
  Rules (owner, 7 Nov): online − ₹100–150 rounded to end in 9 (online = Flipkart; Amazon refuses automated checks); boAt Stone 1200 Pro online − ₹400; Stone Arc Pro online − ₹300;
  Ranz OTG fixed ₹170. `order` items show "Ships in 3–5 days".
- **Owner decisions, 7 Nov:** memory cards up to 512GB only (1TB/1.5TB dropped); boAt speakers in black only
  (Stone 1200 Pro Twilight Black, Stone Arc Pro Raging Black; the grey images were removed).
- **Nothing is listed yet.** Products go live only after prices are in, screenshots are approved and the owner says "ok push".

## What is here

| Folder | Contents |
|---|---|
| `teal/` | 112 listing images (1440 px WebP): official brand photos cut out and placed on the GadgetsHub teal stage. Memory cards, SSDs (Samsung, SanDisk, WD), Consistent SSDs, boAt Stone 1200 Pro / Arc Pro (black), CP Plus ezyKam+ E28Q/E38Q/E48Q. `manifest.json` gives part number, source URL and caveats per image; `contact-sheet.jpg` per range. |
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
- #3 Samsung RAM: the stick is desktop length but its label reads M471A1K43DB1-CWE / PC4-3200AA-SA1, Samsung's laptop SO-DIMM code
  (a genuine desktop 8GB is M378A…, PC4-3200AA-U…). Not listed until the owner checks it with the supplier.
- RAM (7 Nov): listed per brand with real photos only: Samsung DDR3L laptop 4/8 GB and Samsung DDR4 desktop 16 GB (Samsung's own images,
  `teal/ram/`), SK hynix DDR4 laptop 8 GB (the shop's photo). DDR3 desktop, SK hynix DDR3L and Crucial come back once the owner sends
  photos of those sticks; their prices are already on the sheet.
- #25 butterfly glitter case and #31 detachable frame: new photos needed.
- Consistent "M.2 SATA" line: SATA or NVMe? (their pages say both). Consistent 2.5" 512GB has no usable photo.
- Character prints (Hello Kitty, Tom & Jerry) are trademarks: owner's call to list.

## Not covered

Crucial and Kingston (SSDs, memory cards): their sites refuse automated requests; needs model names or box photos
from the owner. Samsung EVO Plus 2021 microSD is not sold in India any more and is left off.
