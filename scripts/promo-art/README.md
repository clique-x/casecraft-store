# Campaign images

Campaign images made in ChatGPT on 6 Nov 2026, served from `apps/storefront/public/promo/`.
Banners: `src/components/home/PromoBanners.tsx`. Link previews: `OG_IMAGE` in `src/lib/brand.ts` and the home page metadata.

| File | Used for | Links to |
| --- | --- | --- |
| `brand-hero-*.webp`, `og-brand-hero-1200x630.jpg`, `og-brand-hero-1200x1200.jpg` | Link previews (every page without a photo of its own) | — |
| `audio-sealed-*.webp` | Home banner after the audio picks | `/audio` |
| `covers-character-*.webp` | Home banner before the covers opener | `/covers` |
| `combo-protection-*.webp` | Home banner before the combo deals (phones and tablets) | `/accessories` |
| `combo-protection-wide-*.webp` | The same banner at 3:1 for desktops (from 1024 px) | `/accessories` |

The pictures are generated, not shop photos, so they stay out of product listings. `clean-covers.py` takes
"Shot in our Haridwar shop" off the covers image for the same reason.

The prices on them were checked against the shop on 6 Nov 2026: earbuds from ₹799, covers from ₹250, and
the Total protection kit with a ₹599 cover (₹1,296 instead of ₹1,446, ₹50 off each of three add-ons). If a
price changes, the image has to change with it.

## Rebuild

Save three of the images as `brand-hero.png`, `audio-sealed.png` and `combo-protection.png`, and the wide
combo banner as `combo-protection-wide.png`, in a folder (`SRC` below). Then, from the repo root, clean the covers image into the same folder and export:

```sh
python3 scripts/promo-art/clean-covers.py covers-original.png SRC/covers-character.png
node scripts/promo-art/export.mjs SRC
```
