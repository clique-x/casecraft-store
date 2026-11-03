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

## Green-screen photos (any OS)

For flat photos of a case lying on a green sheet, `greenscreen.py` makes the cutout without a Mac:

```bash
python3 scripts/photo-cutout/greenscreen.py back.jpg apps/storefront/public/products/photos/<id>.webp
```

It keys on the sheet's green so shadows disappear with it, keeps clear and frosted plastic semi-transparent,
treats dark pixels inside the case outline as solid, and drops dust. Options: `--frost R,G,B,floor` for a
frosted or smoked back panel (the panel gets that tint and at least that opacity, below the camera opening)
and `--film` to remove a red peel-off film tab. It needs `numpy` and `Pillow`. Set `cut: "full"` in
`photo-catalog.json`, since the whole case is in the frame.
