"""Generate apps/storefront/src/lib/catalog/gadget-ranges.ts and stage its photos.

python3 -I tools/gen_ranges.py <scratchpad> <repo>
Prices come from the price sheet (fk/db-final/prices/*.json): `final` is the selling price, `mrp` the printed MRP,
`stock` 'shop' (on the shelf), 'order' (ships in 3–5 days) or 'skip'. Options without a price are left out.
Photos are copied to <scratchpad>/stage-gadgets/<id>/<n>-<Caption>.webp for scripts/photo-gadgets.mjs --teal.
"""
import json
import shutil
import sys
from pathlib import Path

S, R = Path(sys.argv[1]), Path(sys.argv[2])
SRC = R / "catalog-sources/new-ranges-2026-11"
STAGE = S / "stage-gadgets"
if STAGE.exists():
    shutil.rmtree(STAGE)

prices = {}
for f in (S / "fk/db-final/prices").glob("*.json"):
    d = json.load(open(f))
    d = d.get("data", d)
    prices[f.stem] = d


def shop(n, i):
    """The i-th kept view of shop product n (catalog-sources/.../shop-photos)."""
    folder = next((SRC / "shop-photos").glob(f"{n:02d}-*"))
    return next(folder.glob(f"{i}-*.webp"))


def teal(rel):
    return SRC / "teal" / rel


def ram(kind, view):
    return SRC / "ram" / f"{kind}-{view}.webp"


GREY = "#3a3d42"


def opt(slug, name, row, hex_=GREY):
    """An option priced from the sheet row, or None when the row has no price or is skipped."""
    p = prices.get(row)
    if not p or p.get("final") is None or p.get("stock") == "skip":
        return None
    price = int(p["final"])
    mrp = p.get("mrp")
    o = {"slug": slug, "name": name, "hex": hex_, "priceInr": price, "regularInr": int(mrp) if mrp and mrp > price else price}
    if p.get("stock") == "order":
        o["orderIn"] = True
    return o


products = []  # (group, entry, [(caption, path)], heroByOption)


def product(group, entry, options, gallery, hero=None):
    options = [o for o in options if o]
    if not options:
        print("skip (no priced option):", entry["id"])
        return
    first = min(options, key=lambda o: o["priceInr"])
    entry = {**entry, "priceInr": first["priceInr"], "regularInr": first["regularInr"], "options": options}
    keep = {o["slug"] for o in options}
    products.append((group, entry, gallery, {k: v for k, v in (hero or {}).items() if k in keep}))


SEALED = "sealed {brand} pack"

# ---------------------------------------------------------------- memory cards and pen drives
product("STORAGE", {
    "id": "sandisk-cruzer-blade", "handle": "sandisk-cruzer-blade-usb-pen-drive", "title": "SanDisk Cruzer Blade USB pen drive",
    "type": "pen-drive", "optionKind": "capacity",
    "short": "Slim USB 2.0 pen drive in 16, 32 and 64 GB",
    "description": "SanDisk's slim, capless Cruzer Blade: a light USB-A pen drive for carrying documents, photos and music between computers and other devices with a USB port. It is plug and play on Windows, macOS and Linux, so there is no software to install.",
    "features": ["16, 32 or 64 GB", "USB 2.0, plug and play", "Slim, light, capless design"],
    "specs": [
        {"label": "Capacity", "value": "16 GB, 32 GB or 64 GB"},
        {"label": "Interface", "value": "USB 2.0, USB Type-A plug"},
        {"label": "Works with", "value": "Windows, macOS and Linux; no software needed"},
    ],
    "inBox": "The pen drive in its sealed SanDisk blister pack.",
}, [opt("16gb", "16 GB", "zip-09"), opt("32gb", "32 GB", "zip-10"), opt("64gb", "64 GB", "zip-11")],
    [("16 GB", shop(9, 0)), ("32 GB", shop(10, 0)), ("64 GB", shop(11, 0)), ("In the pack", shop(10, 1)), ("Side view", shop(10, 2)), ("Features", shop(10, 3))],
    {"16gb": 0, "32gb": 1, "64gb": 2})

product("STORAGE", {
    "id": "sandisk-ultra-flair", "handle": "sandisk-ultra-flair-usb-3-pen-drive-128gb", "title": "SanDisk Ultra Flair USB 3.0 pen drive 128GB",
    "type": "pen-drive", "optionKind": "capacity",
    "short": "128 GB metal pen drive, up to 150 MB/s read",
    "description": "A 128 GB SanDisk Ultra Flair in a metal casing. USB 3.0 reads at up to 150 MB/s (SanDisk's figure on the pack), so large videos and backups copy quickly, and it still works in older USB 2.0 ports at USB 2.0 speed.",
    "features": ["128 GB", "USB 3.0, up to 150 MB/s read", "Metal casing"],
    "specs": [
        {"label": "Capacity", "value": "128 GB"},
        {"label": "Interface", "value": "USB 3.0 (works in USB 2.0 ports at USB 2.0 speed)"},
        {"label": "Read speed", "value": "Up to 150 MB/s (SanDisk's figure; write is slower)"},
        {"label": "Works with", "value": "Windows 10 or later, macOS 12 or later (as printed on the pack)"},
    ],
    "inBox": "The pen drive in its sealed SanDisk pack.",
}, [opt("128gb", "128 GB", "zip-12")], [("In the pack", shop(12, 0)), ("In use", shop(12, 1))])

product("STORAGE", {
    "id": "geonix-microsd-64gb", "handle": "geonix-64gb-microsdxc-memory-card", "title": "Geonix 64GB microSDXC memory card",
    "type": "memory-card", "optionKind": "capacity",
    "short": "A2, V30, U3: up to 150 MB/s read, 70 MB/s write",
    "description": "A 64 GB microSDXC card from Geonix, made in India, rated A2 for apps and V30 and U3 for steady 4K video. Geonix prints read speeds up to 150 MB/s and write speeds up to 70 MB/s on the pack, with a 5-year warranty.",
    "features": ["A2, V30, U3 rated", "Up to 150 MB/s read, 70 MB/s write", "5-year Geonix warranty"],
    "specs": [
        {"label": "Capacity", "value": "64 GB microSDXC"},
        {"label": "Speed", "value": "Up to 150 MB/s read, 70 MB/s write (as printed on the pack)"},
        {"label": "Ratings", "value": "A2, V30, U3"},
        {"label": "Warranty", "value": "5 years from Geonix (as printed on the pack)"},
        {"label": "Made in", "value": "India"},
    ],
    "inBox": "The card in its sealed Geonix pack.",
}, [opt("64gb", "64 GB", "zip-01")], [("In the pack", shop(1, 0)), ("On display", shop(1, 1)), ("In use", shop(1, 3))])

ULTRA = [("32gb", "32 GB", "32gb"), ("64gb", "64 GB", "64gb"), ("128gb", "128 GB", "128gb"), ("256gb", "256 GB", "256gb"), ("512gb", "512 GB", "512gb")]
product("STORAGE", {
    "id": "sandisk-ultra-microsd", "handle": "sandisk-ultra-microsd-card", "title": "SanDisk Ultra microSD card",
    "type": "memory-card", "optionKind": "capacity",
    "short": "A1 microSD for phones and tablets, 32 GB to 512 GB",
    "description": "SanDisk Ultra microSDHC and microSDXC UHS-I cards for phones, tablets and cameras. They are A1-rated so apps load quickly from the card, Class 10 for Full HD video, and read at up to 150 MB/s depending on the size. Write speeds are lower than read speeds.",
    "features": ["A1 rated for apps", "Up to 150 MB/s read", "10-year SanDisk limited warranty"],
    "specs": [
        {"label": "Capacity", "value": "32 GB to 512 GB"},
        {"label": "Read speed", "value": "Up to 120 MB/s (32 GB), 140 MB/s (64 and 128 GB), 150 MB/s (256 and 512 GB)"},
        {"label": "Ratings", "value": "A1, Class 10, UHS-I"},
        {"label": "Warranty", "value": "10-year limited warranty from SanDisk"},
    ],
    "inBox": "The microSD card in its sealed SanDisk pack.",
}, [opt(s, n, f"card-sandisk-ultra-microsd-{v}") for s, n, v in ULTRA],
    [(n, teal(f"memory-cards/sandisk-ultra-microsd/{v}.webp")) for s, n, v in ULTRA if prices.get(f"card-sandisk-ultra-microsd-{v}")],
    {s: i for i, (s, n, v) in enumerate([u for u in ULTRA if prices.get(f"card-sandisk-ultra-microsd-{u[2]}")])})

EXT = [("128gb", "128 GB", "128gb"), ("256gb", "256 GB", "256gb")]
product("STORAGE", {
    "id": "sandisk-extreme-microsd", "handle": "sandisk-extreme-microsd-card", "title": "SanDisk Extreme microSD card",
    "type": "memory-card", "optionKind": "capacity",
    "short": "A2, V30, U3 for 4K video and games, up to 190 MB/s read",
    "description": "SanDisk Extreme microSDXC cards for action cams, drones, Nintendo Switch and phones that shoot 4K. A2 loads apps quickly, V30 and U3 keep 4K recording steady, and reads reach up to 190 MB/s.",
    "features": ["A2, V30, U3 rated", "Up to 190 MB/s read", "SanDisk lifetime limited warranty"],
    "specs": [
        {"label": "Capacity", "value": "128 GB or 256 GB"},
        {"label": "Speed", "value": "Up to 190 MB/s read; up to 90 MB/s write (128 GB), 130 MB/s (256 GB)"},
        {"label": "Ratings", "value": "A2, V30, U3, Class 10, UHS-I"},
        {"label": "Warranty", "value": "Lifetime limited warranty from SanDisk (India)"},
    ],
    "inBox": "The microSD card in its sealed SanDisk pack.",
}, [opt(s, n, f"card-sandisk-extreme-microsd-{v}") for s, n, v in EXT],
    [(n, teal(f"memory-cards/sandisk-extreme-microsd/{v}.webp")) for s, n, v in EXT], {"128gb": 0, "256gb": 1})

product("STORAGE", {
    "id": "samsung-evo-plus-microsd", "handle": "samsung-evo-plus-microsd-card", "title": "Samsung EVO Plus microSD card 64GB",
    "type": "memory-card", "optionKind": "capacity",
    "short": "Up to 160 MB/s read, SD adapter included",
    "description": "Samsung's EVO Plus microSDXC card for phones, tablets and cameras, with reads up to 160 MB/s and an SD adapter in the pack for laptops and cameras that take full-size cards.",
    "features": ["Up to 160 MB/s read", "SD adapter included", "10-year Samsung limited warranty"],
    "specs": [
        {"label": "Capacity", "value": "64 GB microSDXC"},
        {"label": "Read speed", "value": "Up to 160 MB/s"},
        {"label": "Ratings", "value": "A1, V10, U1, Class 10"},
        {"label": "Warranty", "value": "10-year limited warranty from Samsung; not for dashcam or CCTV use"},
    ],
    "inBox": "The microSD card and an SD adapter, in the sealed Samsung pack.",
}, [opt("64gb", "64 GB", "card-samsung-evo-plus-microsd-2024-64gb")], [("64 GB", teal("memory-cards/samsung-evo-plus-microsd-2024/64gb.webp"))])

# ---------------------------------------------------------------- SSDs
CS = [("128gb", "128 GB"), ("256gb", "256 GB"), ("1tb", "1 TB")]
product("STORAGE", {
    "id": "consistent-s7-sata-ssd", "handle": "consistent-s7-2-5-inch-sata-ssd", "title": "Consistent S7 2.5-inch SATA SSD",
    "type": "ssd", "optionKind": "capacity",
    "short": "Made in India SATA SSD, up to 550 MB/s read, 5-year warranty",
    "description": "Consistent's S7 2.5-inch SATA III SSD, made in India. It replaces a laptop or desktop hard drive for faster boots and app loading, and reads at up to 550 MB/s (Consistent's figure). Consistent backs it with a 5-year warranty.",
    "features": ["2.5-inch SATA III, 6 Gb/s", "Up to 550 MB/s read", "5-year Consistent warranty"],
    "specs": [
        {"label": "Capacity", "value": "128 GB, 256 GB or 1 TB"},
        {"label": "Form factor", "value": "2.5-inch"},
        {"label": "Interface", "value": "SATA III, 6 Gb/s"},
        {"label": "Read speed", "value": "Up to 550 MB/s (Consistent's figure)"},
        {"label": "Warranty", "value": "5 years from Consistent"},
        {"label": "Made in", "value": "India"},
    ],
    "inBox": "The SSD in its sealed Consistent box.",
}, [opt(s, n, f"consistent-2-5-sata-{s}") for s, n in CS],
    [("128 GB", teal("consistent/consistent-s7-2-5-sata/128gb.webp")), ("256 GB", teal("consistent/consistent-s7-2-5-sata/256gb.webp")),
     ("1 TB", teal("consistent/consistent-s7-2-5-sata/1tb.webp")), ("128 GB box", teal("consistent/consistent-s7-2-5-sata/128gb-box.webp")),
     ("256 GB box", teal("consistent/consistent-s7-2-5-sata/256gb-box.webp")), ("In the shop", shop(8, 1)), ("Features", shop(8, 2))],
    {"128gb": 0, "256gb": 1, "1tb": 2})

product("STORAGE", {
    "id": "consistent-s7-nvme-ssd", "handle": "consistent-s7-m2-nvme-ssd", "title": "Consistent S7 M.2 NVMe SSD",
    "type": "ssd", "optionKind": "capacity",
    "short": "M.2 2280 PCIe Gen 3 NVMe SSD, 5-year warranty",
    "description": "Consistent's S7 M.2 2280 NVMe SSD on PCIe Gen 3 x4, with 3D NAND and an SLC cache, made in India. It fits laptops and desktops with an M.2 NVMe slot (M key); check that your slot takes NVMe drives before you order.",
    "features": ["M.2 2280, PCIe Gen 3 x4 NVMe", "3D NAND with SLC cache", "5-year Consistent warranty"],
    "specs": [
        {"label": "Capacity", "value": "128 GB or 256 GB"},
        {"label": "Form factor", "value": "M.2 2280 (M key)"},
        {"label": "Interface", "value": "PCIe Gen 3 x4, NVMe"},
        {"label": "Memory", "value": "3D NAND with SLC cache"},
        {"label": "Warranty", "value": "5 years from Consistent"},
        {"label": "Made in", "value": "India"},
    ],
    "inBox": "The SSD in its sealed Consistent box.",
}, [opt("128gb", "128 GB", "consistent-nvme-gen3-128gb"), opt("256gb", "256 GB", "consistent-nvme-gen3-256gb")],
    [("128 GB box", teal("consistent/consistent-s7-nvme-gen3/128gb-box.webp")), ("256 GB on display", shop(6, 0)),
     ("256 GB box", teal("consistent/consistent-s7-nvme-gen3/256gb-box.webp")), ("Features", shop(6, 1))],
    {"128gb": 0, "256gb": 1})


def ssd_line(pid, handle, title, short, desc, features, specs, line, caps):
    opts = [opt(s, n, f"ssd-{pn.lower()}") for s, n, pn in caps]
    gal = [(n, teal(f"ssd/{line}/{s}.webp")) for s, n, pn in caps if prices.get(f"ssd-{pn.lower()}")]
    hero = {s: i for i, (s, n, pn) in enumerate([c for c in caps if prices.get(f"ssd-{c[2].lower()}")])}
    product("STORAGE", {"id": pid, "handle": handle, "title": title, "type": "ssd", "optionKind": "capacity", "short": short,
                        "description": desc, "features": features, "specs": specs,
                        "inBox": "The SSD in its sealed retail box. Screws and cables are not included."}, opts, gal, hero)


# Owner, 7 Nov: SSDs up to 1 TB only, no Samsung SSDs.
WD_W = "5-year limited warranty"
ssd_line("wd-blue-sn5000", "wd-blue-sn5000-nvme-ssd", "WD Blue SN5000 M.2 NVMe SSD", "PCIe 4.0 NVMe, up to 5,150 MB/s read",
            "The WD Blue SN5000 is a PCIe 4.0 x4 M.2 2280 NVMe SSD for everyday laptops and desktops, reading at up to 5,000 MB/s (500 GB) or 5,150 MB/s (1 TB).",
            ["Up to 5,150 MB/s read", "PCIe 4.0 x4, M.2 2280", WD_W],
            [{"label": "Interface", "value": "PCIe 4.0 x4, NVMe"}, {"label": "Form factor", "value": "M.2 2280"},
             {"label": "Speed", "value": "Up to 5,000 MB/s read, 4,000 MB/s write (500 GB); 5,150 / 4,900 MB/s (1 TB)"},
             {"label": "Endurance", "value": "300 TBW (500 GB), 600 TBW (1 TB)"}, {"label": "Warranty", "value": WD_W}],
            "wd-blue-sn5000", [("500gb", "500 GB", "WDS500G4B0E-00CNZ0"), ("1tb", "1 TB", "WDS100T4B0E-00CNZ0")])
ssd_line("wd-blue-sn5100", "wd-blue-sn5100-nvme-ssd", "WD Blue SN5100 M.2 NVMe SSD", "PCIe 4.0 NVMe, up to 7,100 MB/s read",
            "The WD Blue SN5100 is a PCIe 4.0 M.2 2280 NVMe SSD for everyday laptops and desktops, reading at up to 6,600 MB/s (500 GB) or 7,100 MB/s (1 TB).",
            ["Up to 7,100 MB/s read", "PCIe 4.0, M.2 2280", WD_W],
            [{"label": "Interface", "value": "PCIe 4.0, NVMe"}, {"label": "Form factor", "value": "M.2 2280"},
             {"label": "Speed", "value": "Up to 6,600 MB/s read, 5,600 MB/s write (500 GB); 7,100 / 6,700 MB/s (1 TB)"},
             {"label": "Endurance", "value": "300 TBW (500 GB), 600 TBW (1 TB)"}, {"label": "Warranty", "value": WD_W}],
            "wd-blue-sn5100", [("500gb", "500 GB", "WDS500G5B0E-00CPE0"), ("1tb", "1 TB", "WDS100T5B0E-00CPE0")])
ssd_line("wd-black-sn7100", "wd-black-sn7100-nvme-ssd", "WD_BLACK SN7100 M.2 NVMe SSD", "PCIe 4.0 gaming SSD, up to 7,250 MB/s read",
            "The WD_BLACK SN7100 is a PCIe 4.0 M.2 2280 NVMe gaming SSD, reading at up to 7,250 MB/s and writing at up to 6,900 MB/s in the 1 TB size. It is DRAM-less.",
            ["Up to 7,250 MB/s read, 6,900 MB/s write", "PCIe 4.0, M.2 2280", WD_W],
            [{"label": "Interface", "value": "PCIe 4.0, NVMe"}, {"label": "Form factor", "value": "M.2 2280"},
             {"label": "Speed", "value": "Up to 7,250 MB/s read, 6,900 MB/s write"}, {"label": "Warranty", "value": WD_W}],
            "wd-black-sn7100", [("500gb", "500 GB", "WDS500G4X0E-00CJA0"), ("1tb", "1 TB", "WDS100T4X0E-00CJA0")])
ssd_line("wd-black-sn850x", "wd-black-sn850x-nvme-ssd", "WD_BLACK SN850X M.2 NVMe SSD 1TB", "PCIe 4.0 gaming SSD, up to 7,300 MB/s read",
            "The WD_BLACK SN850X is a PCIe 4.0 x4 M.2 2280 NVMe SSD made for gaming PCs, with reads up to 7,300 MB/s and writes up to 6,300 MB/s in the 1 TB size. This is the version without a heatsink.",
            ["Up to 7,300 MB/s read, 6,300 MB/s write", "1 TB, PCIe 4.0 x4", WD_W],
            [{"label": "Interface", "value": "PCIe 4.0 x4, NVMe"}, {"label": "Form factor", "value": "M.2 2280, no heatsink"},
             {"label": "Speed", "value": "Up to 7,300 MB/s read, 6,300 MB/s write"}, {"label": "Endurance", "value": "600 TBW"},
             {"label": "Warranty", "value": WD_W}],
            "wd-black-sn850x", [("1tb", "1 TB", "WDS100T2X0E-00BCA0")])
ssd_line("sandisk-optimus-5100", "sandisk-optimus-5100-nvme-ssd", "SanDisk Optimus 5100 M.2 NVMe SSD", "PCIe 4.0 NVMe, up to 7,100 MB/s read",
            "SanDisk's Optimus 5100 is a PCIe 4.0 x4 M.2 2280 NVMe SSD, reading at up to 6,600 MB/s (500 GB) or 7,100 MB/s (1 TB).",
            ["Up to 7,100 MB/s read", "PCIe 4.0 x4, M.2 2280", WD_W],
            [{"label": "Interface", "value": "PCIe 4.0 x4, NVMe"}, {"label": "Form factor", "value": "M.2 2280"},
             {"label": "Speed", "value": "Up to 6,600 MB/s read, 5,600 MB/s write (500 GB); 7,100 / 6,700 MB/s (1 TB)"},
             {"label": "Warranty", "value": WD_W}],
            "sandisk-optimus-5100", [("500gb", "500 GB", "SDSP51500GAN-000E0"), ("1tb", "1 TB", "SDSP51100TAN-000E0")])
ssd_line("sandisk-optimus-gx-7100", "sandisk-optimus-gx-7100-nvme-ssd", "SanDisk Optimus GX 7100 M.2 NVMe SSD", "PCIe 4.0 gaming SSD, up to 7,250 MB/s read",
            "SanDisk's Optimus GX 7100 is a PCIe 4.0 x4 M.2 2280 NVMe gaming SSD, reading at up to 6,800 MB/s (500 GB) or 7,250 MB/s (1 TB).",
            ["Up to 7,250 MB/s read", "PCIe 4.0 x4, M.2 2280", WD_W],
            [{"label": "Interface", "value": "PCIe 4.0 x4, NVMe"}, {"label": "Form factor", "value": "M.2 2280"},
             {"label": "Speed", "value": "Up to 6,800 MB/s read, 5,800 MB/s write (500 GB); 7,250 / 6,900 MB/s (1 TB)"},
             {"label": "Endurance", "value": "300 TBW (500 GB), 600 TBW (1 TB)"}, {"label": "Warranty", "value": WD_W}],
            "sandisk-optimus-gx-7100", [("500gb", "500 GB", "SDSP71500GAN-000E0"), ("1tb", "1 TB", "SDSP71100TAN-000E0")])
ssd_line("sandisk-520-sata", "sandisk-520-sata-ssd-500gb", "SanDisk 520 2.5-inch SATA SSD 500GB", "SATA SSD, up to 560 MB/s read",
            "SanDisk's 520 is a 2.5-inch SATA SSD for upgrading a laptop or desktop from a hard drive, reading at up to 560 MB/s and writing at up to 510 MB/s.",
            ["Up to 560 MB/s read, 510 MB/s write", "2.5-inch SATA 6 Gb/s", WD_W],
            [{"label": "Interface", "value": "SATA 6 Gb/s"}, {"label": "Form factor", "value": "2.5-inch"},
             {"label": "Speed", "value": "Up to 560 MB/s read, 510 MB/s write"}, {"label": "Endurance", "value": "300 TBW"},
             {"label": "Warranty", "value": WD_W}],
            "sandisk-520-sata", [("500gb", "500 GB", "SDSS51500GAB-000G0")])

# ---------------------------------------------------------------- RAM
RAM_NOTE = "The brand is Samsung, SK hynix or Crucial, depending on stock; message us on WhatsApp if you need a particular one. Pictured: a typical module of this type; the label on yours depends on the brand."
RAMS = [
    ("desktop-ddr3", "Desktop RAM DDR3 1600 MHz", "240-pin DIMM for DDR3 desktops", "DDR3 desktop memory: a 240-pin DIMM running at 1600 MHz (PC3-12800) on 1.5 V. It only fits DDR3 desktop slots, so check your motherboard before you order.",
     [{"label": "Type", "value": "DDR3, 240-pin DIMM (desktop)"}, {"label": "Speed", "value": "1600 MHz (PC3-12800)"}, {"label": "Voltage", "value": "1.5 V"}],
     [("4gb", "4 GB"), ("8gb", "8 GB")]),
    ("laptop-ddr3l", "Laptop RAM DDR3L 1600 MHz", "204-pin SO-DIMM for DDR3 and DDR3L laptops", "Low-voltage DDR3L laptop memory: a 204-pin SO-DIMM at 1600 MHz (PC3L-12800) on 1.35 V, which also runs at 1.5 V in older DDR3 laptops.",
     [{"label": "Type", "value": "DDR3L, 204-pin SO-DIMM (laptop)"}, {"label": "Speed", "value": "1600 MHz (PC3L-12800)"}, {"label": "Voltage", "value": "1.35 V (also runs at 1.5 V)"}],
     [("4gb", "4 GB"), ("8gb", "8 GB")]),
    ("desktop-ddr4", "Desktop RAM DDR4 3200 MHz", "288-pin DIMM for DDR4 desktops", "DDR4 desktop memory: a 288-pin DIMM rated at 3200 MHz (PC4-25600) on 1.2 V. It runs at the highest speed your motherboard supports and only fits DDR4 slots.",
     [{"label": "Type", "value": "DDR4, 288-pin DIMM (desktop)"}, {"label": "Speed", "value": "3200 MHz (PC4-25600); runs at your board's supported speed"}, {"label": "Voltage", "value": "1.2 V"}],
     [("8gb", "8 GB"), ("16gb", "16 GB"), ("32gb", "32 GB")]),
    ("laptop-ddr4", "Laptop RAM DDR4 3200 MHz", "260-pin SO-DIMM for DDR4 laptops", "DDR4 laptop memory: a 260-pin SO-DIMM rated at 3200 MHz (PC4-25600) on 1.2 V. It runs at the highest speed your laptop supports and only fits DDR4 slots.",
     [{"label": "Type", "value": "DDR4, 260-pin SO-DIMM (laptop)"}, {"label": "Speed", "value": "3200 MHz (PC4-25600); runs at your laptop's supported speed"}, {"label": "Voltage", "value": "1.2 V"}],
     [("8gb", "8 GB"), ("16gb", "16 GB"), ("32gb", "32 GB")]),
]
for kind, title, short, desc, specs, sizes in RAMS:
    product("STORAGE", {
        "id": f"ram-{kind}", "handle": f"{kind}-ram", "title": title, "type": "ram", "optionKind": "capacity",
        "short": short, "description": f"{desc} {RAM_NOTE}",
        "features": [specs[0]["value"], specs[1]["value"].split(";")[0], "Samsung, SK hynix or Crucial"],
        "specs": [*specs, {"label": "Brand", "value": "Samsung, SK hynix or Crucial, as available"}],
        "inBox": "One memory module in an anti-static pack.",
    }, [opt(s, n, f"ram-{kind}-{s}") for s, n in sizes], [("Module", ram(kind, "main")), ("Flat", ram(kind, "flat"))])

# ---------------------------------------------------------------- drive cases and adapters
product("STORAGE", {
    "id": "cablet-hd2533", "handle": "cablet-hd2533-2-5-inch-sata-drive-case", "title": "CABLET 2.5-inch SATA drive case (HD2533-U3)",
    "type": "enclosure", "optionKind": "model",
    "short": "USB 3.0 case that turns a 2.5-inch SSD or hard drive into a portable drive",
    "description": "Put a spare 2.5-inch SATA SSD or laptop hard drive in this CABLET case and use it as a portable USB drive. It is tool-free, supports UASP for faster transfers over USB 3.0 (5 Gbps), and takes drives from 7 to 9.5 mm thick, up to 6 TB. The drive is not included.",
    "features": ["USB 3.0, 5 Gbps, UASP", "Tool-free, 7–9.5 mm drives", "Up to 6 TB"],
    "specs": [
        {"label": "Fits", "value": "2.5-inch SATA SSDs and hard drives, 7–9.5 mm thick, up to 6 TB"},
        {"label": "Connection", "value": "USB 3.0, 5 Gbps, UASP"},
        {"label": "Cable", "value": "USB-A to Micro-B"},
        {"label": "Body", "value": "ABS, black and red; tool-free"},
    ],
    "inBox": "The case and its USB cable, in the CABLET box. No drive included.",
}, [opt("hd2533", "HD2533-U3", "zip-04")], [("Box", shop(4, 0)), ("On display", shop(4, 1))])

product("STORAGE", {
    "id": "cablet-ms902", "handle": "cablet-ms902-m2-nvme-ssd-case", "title": "CABLET M.2 NVMe SSD case (MS902-C3)",
    "type": "enclosure", "optionKind": "model",
    "short": "10 Gbps USB-C aluminium case for M.2 NVMe SSDs",
    "description": "An aluminium CABLET case for M.2 NVMe SSDs (M key and M+B key, 2230 to 2280, up to 8 TB) on USB 3.1 Gen 2 at 10 Gbps, with a Realtek RTL9210 bridge. It takes NVMe drives only, not M.2 SATA. The 2-in-1 cable connects to USB-C and USB-A ports. The SSD is not included.",
    "features": ["USB 3.1 Gen 2, 10 Gbps", "M.2 NVMe 2230–2280, up to 8 TB", "USB-C and USB-A cable"],
    "specs": [
        {"label": "Fits", "value": "M.2 NVMe SSDs, M key and M+B key, 2230/2242/2260/2280, up to 8 TB (not M.2 SATA)"},
        {"label": "Connection", "value": "USB 3.1 Gen 2, 10 Gbps, Realtek RTL9210"},
        {"label": "Cable", "value": "USB-C to USB-C, with USB-A (2-in-1)"},
        {"label": "Body", "value": "Aluminium, grey"},
    ],
    "inBox": "The case and its 2-in-1 cable, in the CABLET box. No SSD included.",
}, [opt("ms902", "MS902-C3", "zip-05")], [("Box", shop(5, 0)), ("On display", shop(5, 1)), ("Features", shop(5, 2)), ("Side view", shop(5, 3))])

product("STORAGE", {
    "id": "ranz-otg", "handle": "ranz-usb-c-to-usb-otg-adapter", "title": "Ranz USB-C to USB OTG adapter (RZ-UT01)",
    "type": "otg", "optionKind": "model",
    "short": "Plug a pen drive, mouse or keyboard into a USB-C phone",
    "description": "A small Ranz adapter with a USB-C plug on one end and a full-size USB-A socket on the other, so a USB-C phone, tablet or laptop can use pen drives, card readers, mice and keyboards. Plug and play at USB 2.0 speed (up to 480 Mbps). Your device must support USB OTG.",
    "features": ["USB-C to USB-A", "Up to 480 Mbps", "Plug and play"],
    "specs": [
        {"label": "Connectors", "value": "USB-C plug to USB-A socket"},
        {"label": "Speed", "value": "USB 2.0, up to 480 Mbps"},
        {"label": "Works with", "value": "Phones, tablets and laptops with USB-C that support OTG"},
    ],
    "inBox": "The adapter in its Ranz pack. The pen drive in the photos is not included.",
}, [opt("rz-ut01", "RZ-UT01", "zip-13")] if prices.get("zip-13") else [{"slug": "rz-ut01", "name": "RZ-UT01", "hex": GREY, "priceInr": 170, "regularInr": 199}],
    [("In the pack", shop(13, 0)), ("Both ends", shop(13, 1)), ("In use", shop(13, 2)), ("On display", shop(13, 3)), ("Features", shop(13, 4))])

# ---------------------------------------------------------------- cameras
product("CAMERAS", {
    "id": "cpplus-ezykam-pt", "handle": "cp-plus-ezykam-wifi-pan-tilt-camera", "title": "CP Plus ezyKam+ Wi-Fi pan-tilt camera",
    "type": "camera", "optionKind": "resolution",
    "short": "355° pan, 15 m night vision, two-way talk, in 2, 3 or 4 MP",
    "description": "CP Plus's ezyKam+ indoor Wi-Fi camera turns 355° and tilts 75°, so one camera covers a whole room or shop floor. It sees up to 15 m in the dark, follows movement, spots people and sound, and has a built-in siren and two-way talk through the ezyKam+ app. It records to a microSD card up to 256 GB and works with Alexa and Google Home. Pick 2, 3 or 4 MP.",
    "features": ["355° pan, 75° tilt, auto-tracking", "15 m night vision, two-way talk", "microSD up to 256 GB, Alexa and Google Home"],
    "specs": [
        {"label": "Resolution", "value": "2 MP 1920×1080 (CP-E28Q), 3 MP 2304×1296 (CP-E38Q), 4 MP 2560×1440 (CP-E48Q)"},
        {"label": "Lens", "value": "4 mm; 89° view (2 and 3 MP), 91.3° (4 MP)"},
        {"label": "Pan and tilt", "value": "355° pan, 75° tilt"},
        {"label": "Night vision", "value": "Infrared, up to 15 m"},
        {"label": "Smart features", "value": "Motion detection and tracking, human detection, sound detection, built-in siren"},
        {"label": "Audio", "value": "Two-way talk, built-in mic and speaker"},
        {"label": "Storage", "value": "microSD up to 256 GB (card not included)"},
        {"label": "Connectivity", "value": "Wi-Fi 2.4 GHz (802.11 b/g/n); ezyKam+ app; Alexa and Google Home"},
        {"label": "Power", "value": "DC 5 V 1 A, USB-C; indoor use"},
    ],
    "inBox": "The camera in its sealed CP Plus box.",
}, [opt("2mp", "2 MP · CP-E28Q", "cpplus-cp-e28q"), opt("3mp", "3 MP · CP-E38Q", "cpplus-cp-e38q"), opt("4mp", "4 MP · CP-E48Q", "cpplus-cp-e48q")],
    [("ezyKam+ Wi-Fi camera", teal("cpplus/ezykam-wifi-pt-camera/cp-e48q-4mp.webp"))])

# ---------------------------------------------------------------- speakers
BLACK = "#1c1d21"
product("SPEAKERS", {
    "id": "boat-stone-1200-pro", "handle": "boat-stone-1200-pro", "title": "boAt Stone 1200 Pro",
    "type": "speaker", "optionKind": "colour",
    "short": "60 W Bluetooth speaker, 7.5 h playback, IPX6, TWS",
    "description": "boAt's Stone 1200 Pro is a 60 W portable speaker with 76.2 mm drivers and boAt Signature Sound. It plays for up to 7.5 hours at half volume, pairs with a second speaker in TWS mode for stereo, plays from a USB drive, takes calls through its built-in mic and is IPX6 water resistant, with a carry strap.",
    "features": ["60 W, 76.2 mm drivers", "Up to 7.5 h playback, TWS mode", "IPX6 water resistance"],
    "specs": [
        {"label": "Output", "value": "60 W, boAt Signature Sound"},
        {"label": "Drivers", "value": "76.2 mm"},
        {"label": "Playback", "value": "Up to 7.5 h at 50% volume"},
        {"label": "Connectivity", "value": "Bluetooth, USB playback, TWS pairing"},
        {"label": "Calls", "value": "Built-in mic"},
        {"label": "Water resistance", "value": "IPX6"},
    ],
    "inBox": "Speaker, USB-C charging cable and user manual, in the sealed boAt box.",
}, [opt("twilight-black", "Twilight Black", "boat-1200-pro", BLACK)], [("Twilight Black", teal("boat/stone-1200-pro/twilight-black.webp"))])

product("SPEAKERS", {
    "id": "boat-stone-arc-pro", "handle": "boat-stone-arc-pro", "title": "boAt Stone Arc Pro",
    "type": "speaker", "optionKind": "colour",
    "short": "25 W speaker with RGB lights, 12 h playback, IPX5",
    "description": "boAt's Stone Arc Pro is a 25 W portable speaker with 58 mm drivers and RGB lights. It plays for up to 12 hours, connects over Bluetooth 5.3 or an AUX cable, takes calls through its built-in mic and is IPX5 splash resistant.",
    "features": ["25 W, 58 mm drivers", "Up to 12 h playback", "RGB lights, IPX5"],
    "specs": [
        {"label": "Output", "value": "25 W"},
        {"label": "Drivers", "value": "58 mm"},
        {"label": "Playback", "value": "Up to 12 h"},
        {"label": "Connectivity", "value": "Bluetooth 5.3, AUX"},
        {"label": "Lights", "value": "RGB LEDs"},
        {"label": "Calls", "value": "Built-in mic"},
        {"label": "Water resistance", "value": "IPX5"},
    ],
    "inBox": "Speaker, USB-C charging cable, AUX cable, user manual and warranty card, in the sealed boAt box.",
}, [opt("raging-black", "Raging Black", "boat-arc-pro", BLACK)], [("Raging Black", teal("boat/stone-arc-pro/raging-black.webp"))])

# ---------------------------------------------------------------- write
groups = {"SPEAKERS": [], "STORAGE": [], "CAMERAS": []}
for group, entry, gallery, hero in products:
    STAGE.joinpath(entry["id"]).mkdir(parents=True, exist_ok=True)
    for i, (cap, path) in enumerate(gallery):
        assert path.exists(), path
        shutil.copy(path, STAGE / entry["id"] / f"{i}-{cap.replace(' ', '-')}.webp")
    photos = {"id": entry["id"], "gallery": [c for c, _ in gallery]}
    if hero:
        photos["heroByOption"] = hero
    groups[group].append({**entry, "photos": photos})

ORDER = ["id", "handle", "title", "type", "priceInr", "regularInr", "short", "description", "features", "specs", "inBox", "optionKind", "options", "photos"]
out = ["/**",
       " * Speakers, storage and cameras added on 7 Nov 2026. GENERATED by catalog-sources/new-ranges-2026-11/tools/gen_ranges.py",
       " * from the owner's price sheet (https://claude.ai/artifact/KgVdHwVJKjPvUy5cyN2jv9): `priceInr` is the sheet's price, `regularInr`",
       " * the printed MRP where known (equal to the price otherwise). `orderIn` options are not on the shelf and ship in ORDER_IN_WINDOW.",
       " * Specs are the brands' own published figures. Photos: official brand images or the shop's photos on the teal stage.",
       " */", "", "import type { GadgetEntry } from './gadgets';", ""]
for g in ("SPEAKERS", "STORAGE", "CAMERAS"):
    items = [{k: e[k] for k in ORDER if k in e} for e in groups[g]]
    out.append(f"export const {g}: readonly GadgetEntry[] = {json.dumps(items, indent=2, ensure_ascii=False)};")
    out.append("")
(R / "apps/storefront/src/lib/catalog/gadget-ranges.ts").write_text("\n".join(out))
for g, items in groups.items():
    print(g, [(e["id"], [(o["name"], o["priceInr"], "order" if o.get("orderIn") else "shop") for o in e["options"]]) for e in items])
