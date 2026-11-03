# Batch 2: products held back

Batch 2 (`Casecraft-Catalogue-ALL-Batches-Complete.zip`, Batch-2) has 43 products. 36 are in the catalogue.
These 7 are not, because showing them would misstate the product or the store cannot stage them yet.

| Phone | Case | Why held back |
|---|---|---|
| Galaxy S21 FE | Spigen Neo Hybrid Crystal, clear | Only the sealed box was photographed; the case design is inferred. No flat photo for a cutout. |
| Galaxy S23 | Spigen Neo Hybrid Crystal, clear | Only the sealed box was photographed; the case design is inferred. No flat photo for a cutout. |
| Galaxy S23 FE | Spigen Neo Hybrid Crystal, clear | Only the sealed box was photographed; the case design is inferred. No flat photo for a cutout. |
| Galaxy S24 FE | Spigen clear case | Only the sealed pouch was photographed; the case design is inferred. No flat photo for a cutout. |
| Galaxy S24 Ultra | Spigen Neo Hybrid Crystal, clear | The real case was only photographed in a hand, so there is no flat photo to cut out. |
| Pixel 9a | Anti-Burst bumper, navy | The AI back, side and in-hand views show a milky frosted back; the real case is clear. |
| Pixel 10 Pro XL | Anti-Burst bumper, navy | The AI back, side and in-hand views show a milky frosted back with a smeared hand; the real case is clear. |

## What a cutout needs

The product page stage and the home hero stand a transparent cutout of the real case on a ledge.
The cutouts come from the flat back photos taken on the green sheet (`scripts/photo-cutout/greenscreen.py`). A product with no flat photo has nothing true to cut out.

## To add one later

1. Photograph the real case flat on the green sheet (and open the box for the four Spigen cases).
2. Regenerate its AI views from that photo; check the back is clear or frosted like the real one.
3. Add its cutout as `public/products/photos/<id>.webp`, its entry to `photo-catalog.json`, then run
   `pnpm photos`, `pnpm photos:shots <dir>` and `pnpm photos:gallery <dir>`, and `pnpm catalog:export`.

The AI images for all 43 stay in the Drive archive.
