# Photo cutout

Turns a product photo (case held in hand, any background) into a transparent WebP for the storefront.
Uses macOS Vision, so it runs offline on any Mac (macOS 14+).

```bash
swiftc -O -o cutout scripts/photo-cutout/cutout.swift
./cutout photo.jpg out.png
cwebp -q 84 -alpha_q 92 -resize 0 1100 out.png -o apps/storefront/public/products/photos/<id>.webp
```

The hand is removed by cutting straight across just above it (about 83% of the case height), so the
storefront fades the bottom edge of these images (`cut: "faded"` in `photo-catalog.json`). For clean,
background-removed photos exported from an AI tool, skip this tool, convert to WebP, and set `cut: "full"`.
