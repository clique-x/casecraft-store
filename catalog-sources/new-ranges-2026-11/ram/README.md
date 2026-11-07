# GadgetsHub RAM listing renders

Unbranded 3D renders of six memory-module types, in the shop's teal stage style. Each image is
2048 × 2048 RGB PNG: a #08252E backdrop, a cyan #00C5E0 rim glow and a velvet-draped podium.
There is no text, logo or capacity marking anywhere. Each label is a plain matte silver-white
sticker.

| File | What it shows |
| --- | --- |
| `<slug>-main.png` | Three-quarter view (module turned 28°, camera 9.5° above), standing on its contact edge, label side to camera |
| `<slug>-flat.png` | Straight-on front face (camera 4° above), module ≈ 80 % of the frame width |
| `plate-front.png`, `plate-34.png` | The empty stage for the flat and 3/4 cameras, for compositing other products (see below) |
| `ram-sheet.jpg` | Contact sheet: all 12 RAM images at 512 px, labelled |
| `render-meta.json` | Pixel positions of the podium contact line and top ellipse for every image |
| `src/` | Scene (`ram-scene.js`), renderer (`render.mjs`) and contact sheet (`sheet.mjs`) |

Slugs: `desktop-ddr3`, `laptop-ddr3l`, `desktop-ddr4`, `laptop-ddr4`, `desktop-ddr5`, `laptop-ddr5`.

Every module is drawn at the same on-screen width, so the laptop SO-DIMMs look as big as the
desktop DIMMs. The images are not to scale with each other; the flat view shows each module's true
proportions.

## Module geometry used

Measurements are in mm, on the face shown. x runs from the left end of the module as it appears in
the image. "Key offset" is the notch centre relative to the module centre (− means left of centre).
Flip a module over and its notch mirrors.

| | Desktop DDR3 | Laptop DDR3L | Desktop DDR4 | Laptop DDR4 | Desktop DDR5 | Laptop DDR5 |
| --- | --- | --- | --- | --- | --- | --- |
| Form factor | 240-pin UDIMM | 204-pin SO-DIMM | 288-pin UDIMM | 260-pin SO-DIMM | 288-pin UDIMM | 262-pin SO-DIMM |
| W × H | 133.35 × 30.0 | 67.6 × 30.0 | 133.35 × 31.25 | 69.6 × 30.0 | 133.35 × 31.25 | 69.6 × 30.0 |
| PCB thickness | 1.27 | 1.0 | 1.27 | 1.2 | 1.27 | 1.2 |
| Contact pitch (per side) | 1.00 | 0.60 | 0.85 | 0.50 | 0.85 | 0.50 |
| Contacts per face, left \| right of key | 48 \| 72 | 36 \| 66 | 77 \| 67 | 58 \| 72 | 73 \| 71 | 64 \| 67 |
| Contact span left \| right (pad centres) | 47.0 \| 71.0 | 21.0 \| 39.0 | 64.6 \| 56.1 | 28.5 \| 35.5 | 61.2 \| 59.5 | 31.5 \| 33.0 |
| **Key notch centre, from left end** | **54.675** | **24.8** | **70.925** | **31.3** | **67.525** | **34.05** |
| **Key offset from centre** | **−12.0** | **−9.0** | **+4.25** | **−3.5** | **+0.85** | **−0.75** |
| Notch width × depth | 2.0 × 4.3 | 1.2 × 3.4 | 1.8 × 3.9 | 1.2 × 3.3 | 1.8 × 3.9 | 1.2 × 3.3 |
| Pad width × length | 0.75 × 3.9 | 0.45 × 2.9 | 0.60 × 3.5 (centre) | 0.35 × 2.9 | 0.60 × 3.5 | 0.35 × 2.9 |
| Contact edge | straight | straight | curved: ends 1.0 higher than centre | straight | straight | straight |
| Side latch notches | semicircle Ø2.5 at y 17.3, both ends | semicircle R2.0 at y 20.0 | Ø2.5 at y 17.8 | R2.0 at y 20.0 | Ø2.5 at y 17.8 | R2.0 at y 20.0 |
| Bottom corners | 1.25 × 45° chamfer | 1.0 × 45° | 1.25 × 45° | 1.0 × 45° | 1.25 × 45° | 1.0 × 45° |
| DRAM per side | 8 (4 + 4), FBGA 9.0 × 11.0 | 4, FBGA 8.5 × 11.0 | 8, FBGA 7.5 × 11.0 | 4, FBGA 7.5 × 11.0 | 8, FBGA 7.5 × 11.0 | 4, FBGA 7.5 × 11.0 |
| PCB | dark green | dark green | dark green | dark green | black | black |
| Extras | SPD EEPROM | SPD EEPROM | SPD EEPROM | SPD EEPROM | 3 × 3 QFN PMIC, 3 inductors, bulk caps, SPD hub | same PMIC cluster, SPD hub |

The back face is modelled too, with the same chip count, but no image shows it. Passives are
modelled as small parts: 0402 caps with tinned ends, 4-element resistor arrays under each chip, and
a few 0402 resistors. Copper traces show faintly under the solder mask, with a fan-out trace and via
above every contact.

### Where the numbers come from, and how sure they are

- **Width, height and pin counts** follow the JEDEC module outlines (MO-269, MO-268, MO-309, MO-310
  and the DDR5 outlines) as stated in the brief. Micron datasheets give the same nominal sizes.
- **DDR3 UDIMM key, 54.675 mm from the left.** This comes from the contact spans on Micron DDR3
  UDIMM drawings: 47.0 mm (pins 1–48), a 5.0 mm gap, then 71.0 mm (pins 49–120), with equal end
  margins. High confidence.
- **DDR4 UDIMM key, 4.25 mm off centre.** The 64.6 mm and 56.1 mm contact spans (pins 1–77 and
  78–144 at 0.85 mm pitch) come from Micron's 288-pin DDR4 drawings; a web search snippet of the
  datasheet confirmed both figures. The offset assumes equal end margins. High confidence.
- **DDR3 SO-DIMM key, 24.8 mm from the end (9.0 mm off centre).** This comes from the 21.0 mm and
  39.0 mm contact spans on DDR3 SO-DIMM drawings. Good confidence.
- **DDR4 SO-DIMM key, 3.5 mm off centre.** The key sits after pin 144, according to a search
  snippet. That gives 72 + 58 contacts per face at 0.5 mm pitch. Medium confidence.
- **DDR5 UDIMM (+0.85 mm) and DDR5 SO-DIMM (−0.75 mm): not verified.** I could not open the JEDEC
  or Micron DDR5 drawings because the session's network blocks datasheet hosts. Both notches are
  placed "very near the centre", a single pin pitch or so off it, as the brief describes. The
  splits (73 | 71 and 64 | 67) are my best estimate, not a checked spec. Two things are known:
  pins 72/73 on a DDR5 UDIMM are the CK0_A clock pair, so the key cannot fall between them; and
  DDR5 RDIMMs use a different key position (spans 57.8 / 62.9 mm).
- **DDR4 edge curve.** The 1.0 mm rise, flat over ±14 mm and blending out to ±64 mm, is an
  approximation chosen to make the "longer middle contacts" visible. It is not the exact JEDEC
  profile.
- **Notch width and depth, latch-notch size and height, pad lengths, chip sizes and positions, label
  size.** These are approximate values chosen to match photographs of real modules. The 0.35 mm
  SO-DIMM pad width appears on a Micron DDR5 SO-DIMM drawing.
- **Which face is shown.** The DIMMs show the pin-1 face, with pin 1 at the left, so the DDR3 notch
  sits left of centre and the DDR4 notch right of centre. The SO-DIMMs are shown with the notch left
  of the middle, as most SO-DIMM product photos show them. That is the face with pin 1 at the right.

## Compositing other products onto the plates

The plates use the same cameras, lights, backdrop and podium as the RAM images. Nothing stands on
them. Coordinates are in pixels, with the origin at the top left of the 2048 × 2048 image. The
podium top is a flat circle 152 world units across. In the RAM images 1 world unit = 1 mm of a
133 mm DIMM.

| | `plate-front.png` (matches the `-flat` images) | `plate-34.png` (matches the `-main` images) |
| --- | --- | --- |
| Contact point (podium centre) | (1024, 1268) | (1024, 1249) |
| Podium top: left / right edge at that line | x 94 / x 1955 | x 7 / x 2042 |
| Podium top: back / front edge on the centre line | y 1179 / y 1392 | y 1072 / y 1506 |
| Scale at the contact point | ≈ 12.1 px per world unit | ≈ 13.2 px per world unit |
| Camera | 4° above horizontal, 20° FOV | 9.5° above horizontal, 21.5° FOV |
| RAM product size used | ≈ 1640 px wide | ≈ 1520 px wide (projected) |

- **Where to stand the product.** Put the base of the cut-out on the contact line (y 1268 front,
  y 1249 3/4), centred on x 1024. Small items can sit anywhere on the top ellipse, slightly in front
  of centre. The plates' halo is centred above the contact point and works best for products about
  600–700 px tall.
- **Key light.** A warm-white spot from the upper left and in front: about 40° left of the camera
  and 42° up (direction to the light ≈ (−0.48, 0.67, 0.57)). Lit faces point left and up.
  Cast shadows fall back and to the right, onto the podium top behind the product. In the front
  view that shadow is mostly hidden behind the product.
- **Rim and fill.** Cyan #00C5E0 comes from behind: a back light slightly right and above, plus a
  low spill from directly behind. The spill brightens the back rim of the podium and the top edges
  of the product. There is a faint cyan kicker from the back left and a dim teal fill from above.
- **Shadow to add under a cut-out.**
  1. A tight contact line along the base: black, 85–100 % opacity, 3–6 px blur.
  2. A wider soft occlusion: about 50–70 % opacity, 30–50 px blur, extending a few px beyond the
     footprint.
  3. In the 3/4 view, a faint soft shadow skewed up and to the right of the base.
- **Matching the rim glow.** The RAM images have a cyan halo that hugs the product's silhouette. The
  plates only carry a soft, generic halo. To match, blur the cut-out's alpha at about 10 px, 32 px,
  90 px and 220 px. Tint the result #00C5E0 and add it to the backdrop behind the product only,
  under the podium, at roughly 55 / 42 / 26 / 12 % weights. That is the recipe the RAM renders use
  (`ram-scene.js`, `glow`).
- **Grade.** The final images get a soft radial vignette and fine monochrome grain. Composite
  before any similar grade, or match it.

## Rebuild

```sh
# from this folder; uses the storefront's three + sharp (read-only) and the preinstalled Playwright Chromium
node src/render.mjs . --size 2048 --scale 2            # all 14 images (≈ 3 min on SwiftShader)
node src/render.mjs . desktop-ddr4-main plate-34       # just some
node src/sheet.mjs .                                   # ram-sheet.jpg
```

Each image renders at 4096 px in headless Chromium (three.js r187 on WebGL/SwiftShader) and is
Lanczos-downsampled to 2048 px. Module specs live in `SPECS` at the top of `src/ram-scene.js`.
