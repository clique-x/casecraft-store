"""Build the price-sheet rows + thumbnails.

Run: python3 -I tools/build_pricesheet.py <scratchpad>
Writes <scratchpad>/pricesheet/rows.json and pricesheet/thumbs/*.webp,
then fills pricesheet/template.html -> pricesheet/index.html.
"""
import json
import sys
from pathlib import Path

from PIL import Image

S = Path(sys.argv[1])
OUT = S / "pricesheet"
TH = OUT / "thumbs"
TH.mkdir(parents=True, exist_ok=True)
manifest = json.load(open(S / "creatives/manifest.json"))
by_file = {i["file"]: i for i in manifest["images"]}

TEAL = (8, 37, 46)


def thumb_from(path: Path, name: str, box=None) -> str:
    im = Image.open(path).convert("RGB")
    if box:
        im = im.crop(box)
    w, h = im.size
    side = min(w, h)
    if w != h:
        im = im.crop(((w - side) // 2, (h - side) // 2, (w - side) // 2 + side, (h - side) // 2 + side))
    im = im.resize((144, 144), Image.LANCZOS)
    dst = TH / f"{name}.webp"
    im.save(dst, "WEBP", quality=78, method=6)
    return f"thumbs/{name}.webp"


def creative_thumb(rel: str) -> str:
    info = by_file[rel]
    x0, y0, x1, y1 = info["placement"]["bbox_xyxy"]
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    side = max(x1 - x0, y1 - y0) * 1.12
    box = (int(cx - side / 2), int(cy - side / 2), int(cx + side / 2), int(cy + side / 2))
    name = rel.replace("/", "--").removesuffix(".png")
    return thumb_from(S / "creatives" / rel, name, box)


def zip_thumb(n: str):
    if not (S / f"review-page/thumbs/{n}.jpg").exists():
        return None
    return thumb_from(S / f"review-page/thumbs/{n}.jpg", f"zip-{n}")


def ram_thumb(kind: str) -> str:
    return thumb_from(S / f"ram-renders/{kind}-main.png", f"ram-{kind}", (224, 380, 1824, 1680))


rows = []
sections = []


def section(sid, title, blurb):
    sections.append({"id": sid, "title": title, "blurb": blurb})


def row(sec, line, variant, q, *, rid, thumb=None, mrp=None, rule="std", stock="order",
        ref=None, ref_label=None, part=None, badge=None, note=None, spec=None):
    rows.append({k: v for k, v in dict(
        id=rid, sec=sec, line=line, variant=variant, q=q, thumb=thumb, mrp=mrp, rule=rule,
        stock=stock, ref=ref, refLabel=ref_label, part=part, badge=badge, note=note, spec=spec,
    ).items() if v is not None})


# ---------- 1. Shop stock from the Drive photos ----------
section("shop", "Your shop stock", "Products from your Drive photos. Cases and screen guards included.")
row("shop", "Geonix microSDXC card", "64GB · A2 V30 U3", "Geonix 64GB microSD card", rid="zip-01",
    thumb=zip_thumb("01"), mrp=1499, stock="shop", badge="ready", part="GXNSD64GB",
    spec="Up to 150 MB/s read, 70 MB/s write · 5-year warranty")
for n, size in (("09", "16GB"), ("10", "32GB"), ("11", "64GB")):
    row("shop", "SanDisk Cruzer Blade pen drive", f"{size} · USB 2.0", f"SanDisk Cruzer Blade {size}",
        rid=f"zip-{n}", thumb=zip_thumb(n), stock="shop", badge="ready")
row("shop", "SanDisk Ultra Flair pen drive", "128GB · USB 3.0", "SanDisk Ultra Flair 128GB", rid="zip-12",
    thumb=zip_thumb("12"), mrp=1700, stock="shop", badge="ready", part="SDCZ73-128G-I35",
    spec="Up to 150 MB/s read")
row("shop", "Ranz USB-C to USB OTG adapter", "RZ-UT01", "Ranz RZ-UT01 OTG adapter", rid="zip-13",
    thumb=zip_thumb("13"), mrp=199, rule="fixed170", stock="shop", badge="ready",
    note="You set this at ₹170.")
row("shop", "CABLET 2.5\" SATA hard drive case", "HD2533-U3 · USB 3.0", "Cablet HD2533 2.5 inch enclosure",
    rid="zip-04", thumb=zip_thumb("04"), mrp=925, stock="shop", badge="box",
    spec="UASP, tool-free, up to 6 TB")
row("shop", "CABLET M.2 NVMe SSD case", "MS902-C3 · USB 3.1 Gen 2, 10 Gbps", "Cablet MS902 M.2 NVMe enclosure",
    rid="zip-05", thumb=zip_thumb("05"), mrp=2650, stock="shop", badge="box",
    spec="M and M+B key, 2230–2280, up to 8 TB")
row("shop", "Hydrogel film (Diamonds Quality)", "iPhone 15, 15 Pro, 16, 16 Pro, 17, 17 Pro",
    "hydrogel film iPhone 17 Pro", rid="zip-14", thumb=zip_thumb("14"), stock="shop", badge="ask",
    note="Front screen or back film? Tell me before it goes live.")
row("shop", "FLAYR Borderless tempered glass", "iPhone 13 to 18 Pro", "FLAYR tempered glass iPhone 17 Pro",
    rid="zip-15", thumb=zip_thumb("15"), stock="shop", badge="ask",
    note="Box prints 8K. Can the box go to buyers?")
row("shop", "G-TEL Fantacy 3D fingerprint glass", "Samsung S22 to S26 range", "G-TEL tempered glass Samsung S24 Ultra",
    rid="zip-16", thumb=zip_thumb("16"), stock="shop", badge="ready")
row("shop", "FLAYR Super Large Arc glass", "Phone model?", "FLAYR arc tempered glass", rid="zip-17",
    thumb=zip_thumb("17"), stock="shop", badge="ask", note="Which phone is it for?")
row("shop", "G-TEL Super X edge-to-edge glass", "Many models (Realme, OPPO, Vivo, Samsung, Redmi…)",
    "G-TEL Super X tempered glass", rid="zip-18", thumb=zip_thumb("18"), stock="shop", badge="ready")
cases = [
    ("19", "Hello Kitty 3D soft silicone case", "Realme 16 5G · black", "Hello Kitty silicone case Realme 16", "ready",
     "Character print: your call to list it."),
    ("20", "Tom & Jerry 3D soft silicone case", "Redmi A2 (2022) · black", "Tom and Jerry silicone case Redmi A2", "ask",
     "Is it the Redmi A1 or A2?"),
    ("21", "Tom & Jerry 3D soft silicone case", "Redmi 9C · maroon", "Tom and Jerry silicone case Redmi 9C", "ready", None),
    ("22", "Tom & Jerry 3D soft silicone case", "OPPO A17 · black", "Tom and Jerry silicone case OPPO A17", "ready", None),
    ("23", "Clear bumper case", "Motorola Edge 40 Neo", "clear bumper case Motorola Edge 40 Neo", "ready", None),
    ("24", "Clear bumper case", "Motorola Edge 60 Pro 5G", "clear bumper case Motorola Edge 60 Pro", "ask",
     "Is the frame black or navy?"),
    (None, "Butterfly liquid-glitter case", "Realme 13+ 5G", "butterfly glitter case Realme 13 Plus", "hold",
     "Photos unusable. Needs new photos first."),
    ("26", "Floral liquid-glitter case", "Redmi 13C 5G", "glitter case Redmi 13C 5G", "ready", None),
    ("27", "Purple twin-hearts glitter case", "Redmi 13C 5G", "glitter heart case Redmi 13C 5G", "ready", None),
    ("28", "NEZA clear magnetic case", "Motorola Edge 50 Fusion", "magnetic clear case Motorola Edge 50 Fusion", "ready", None),
    ("29", "NEZA clear magnetic case", "Motorola Edge 70", "magnetic clear case Motorola Edge 70", "ready", None),
    ("30", "Metal Pure Frame case", "iPhone 16 Pro · wine", "metal frame case iPhone 16 Pro", "ask",
     "Does the Apple logo show through the back?"),
]
for n, line, variant, q, badge, note in cases:
    rid = f"zip-{n}" if n else "zip-25"
    row("shop", line, variant, q, rid=rid, thumb=zip_thumb(n) if n else None, stock="shop", badge=badge, note=note)
row("shop", "Detachable aluminium phone frame", "NO.2 · model and colour?", "detachable aluminium phone frame case",
    rid="zip-31", stock="shop", badge="hold", note="Which phone, which colour? Needs photos.")

# ---------- 2. boAt speakers ----------
section("boat", "boAt speakers", "Black only. Online price minus ₹400 (1200 Pro) or ₹300 (Arc Pro).")
row("boat", "boAt Stone 1200 Pro", "Twilight Black · 60W", "boAt Stone 1200 Pro", rid="boat-1200-pro",
    thumb=creative_thumb("boat/stone-1200-pro/twilight-black.png"), mrp=14990, rule="minus400", stock="shop",
    ref=4499, ref_label="boAt store, 6 Nov", spec="76.2 mm drivers · up to 7.5 h · IPX6 · TWS")
row("boat", "boAt Stone Arc Pro", "Raging Black · 25W", "boAt Stone Arc Pro", rid="boat-arc-pro",
    thumb=creative_thumb("boat/stone-arc-pro/raging-black.png"), mrp=6990, rule="minus300", stock="shop",
    ref=2499, ref_label="boAt store, 6 Nov", spec="58 mm drivers · up to 12 h · RGB · IPX5")

# ---------- 3. CP Plus ----------
section("cam", "CP Plus Wi-Fi cameras", "ezyKam+ pan-tilt camera, one product with a 2, 3 or 4 MP choice.")
for mp, model, stock, mrp in (("2MP", "CP-E28Q", "order", None), ("3MP", "CP-E38Q", "order", None), ("4MP", "CP-E48Q", "shop", 5700)):
    row("cam", "CP Plus ezyKam+ Wi-Fi PT camera", f"{mp} · {model}", f"CP Plus {model}", rid=f"cpplus-{model.lower()}",
        thumb=creative_thumb(f"cpplus/ezykam-wifi-pt-camera/{model.lower()}-{mp.lower()}.png"), mrp=mrp, stock=stock,
        part=model, spec="355° pan · 15 m night vision · two-way talk · microSD up to 256 GB")

# ---------- 4. Consistent ----------
section("consistent", "Consistent SSDs", "Made in India, 5-year warranty. Your S7 drives are marked In shop.")
cons = json.load(open(S / "catalog-research/consistent/range.json"))
CONS = {
    "2-5-sata": ("Consistent S7 2.5\" SATA SSD", "consistent-s7-2-5-sata", "Consistent SSD {c} SATA 2.5", None),
    "nvme-gen3": ("Consistent S7 M.2 NVMe Gen 3 SSD", "consistent-s7-nvme-gen3", "Consistent SSD {c} NVMe M.2", None),
    "nvme-gen4": ("Consistent Cheetah M.2 NVMe Gen 4 SSD", "consistent-nvme-gen4-cheetah", "Consistent {c} NVMe Gen4 SSD", None),
    "m2-sata": ("Consistent M.2 2280 SSD (\"M.2 SATA\")", "consistent-m2-2280-sata-titled", "Consistent M.2 SATA SSD {c}",
                "Consistent's own pages say both SATA and NVMe. Check your box before we list it."),
}
shop_cons = {("2-5-sata", "128GB"): 5550, ("2-5-sata", "256GB"): 9450, ("nvme-gen3", "256GB"): 10050}
for l in sorted(cons["lines"], key=lambda l: list(CONS).index(l["id"])):
    title, slug, q, note = CONS[l["id"]]
    for v in l["variants"]:
        c = v["capacity"]
        if c.upper().endswith("TB") and float(c[:-2]) > 1:  # owner, 7 Nov: SSDs up to 1 TB only
            continue
        rel = f"consistent/{slug}/{c.lower()}.png"
        mrp = shop_cons.get((l["id"], c))
        code = next((x.get("value") for x in (v.get("modelCode"), v.get("model")) if isinstance(x, dict)), None)
        row("consistent", title, c, q.format(c=c), rid=f"consistent-{l['id']}-{c.lower()}",
            thumb=creative_thumb(rel) if rel in by_file else None, mrp=mrp,
            stock="shop" if mrp else "order", part=code, badge="ask" if note else None, note=note)

# ---------- 5. RAM ----------
section("ram", "RAM", "Brand as available: Samsung, SK hynix or Crucial. Sticks you don't have ship in 3–5 days.")
RAM = [
    ("desktop-ddr3", "Desktop RAM DDR3", "1600 MHz · 240-pin · 1.5 V", ["4GB", "8GB"], "desktop"),
    ("laptop-ddr3l", "Laptop RAM DDR3L", "1600 MHz · 204-pin · 1.35 V", ["4GB", "8GB"], "laptop"),
    ("desktop-ddr4", "Desktop RAM DDR4", "3200 MHz · 288-pin · 1.2 V", ["8GB", "16GB", "32GB"], "desktop"),
    ("laptop-ddr4", "Laptop RAM DDR4", "3200 MHz · 260-pin · 1.2 V", ["8GB", "16GB", "32GB"], "laptop"),
    ("desktop-ddr5", "Desktop RAM DDR5", "4800/5600 MHz · 288-pin · 1.1 V", ["8GB", "16GB", "32GB"], "desktop"),
    ("laptop-ddr5", "Laptop RAM DDR5", "4800/5600 MHz · 262-pin · 1.1 V", ["8GB", "16GB", "32GB"], "laptop"),
]
for kind, title, spec, sizes, form in RAM:
    t = ram_thumb(kind)
    gen = title.split()[-1]
    speed = spec.split(" ")[0].split("/")[-1]
    for s in sizes:
        stock, note = "order", None
        if kind == "laptop-ddr4" and s == "8GB":
            stock, note = "shop", "Your SK hynix stick."
        if kind == "desktop-ddr3" and s == "8GB":
            stock, note = "shop", "Your Samsung stick: check its size on the label."
        row("ram", title, s, f"{s} {gen} {speed}MHz {form} RAM", rid=f"ram-{kind}-{s.lower()}", thumb=t,
            stock=stock, spec=spec, note=note)

# ---------- 6. Memory cards ----------
section("cards", "Memory cards", "microSD cards up to 512GB. Samsung's EVO Plus 2021 cards are not sold in India any more, so they are left out.")
mc = json.load(open(S / "catalog-research/memory-cards/range.json"))
MC = {
    "SanDisk Ultra microSD": ("SanDisk Ultra microSD", "sandisk-ultra-microsd", "SanDisk Ultra microSD {c}", "A1 · up to 150 MB/s read · 10-year warranty"),
    "SanDisk Extreme microSD": ("SanDisk Extreme microSD", "sandisk-extreme-microsd", "SanDisk Extreme microSD {c}", "A2 V30 U3 · up to 190 MB/s read · lifetime limited warranty"),
    "Samsung EVO Plus microSD (2024 model, MB-MCxxxSA)": ("Samsung EVO Plus microSD (2024)", "samsung-evo-plus-microsd-2024", "Samsung EVO Plus microSD {c}", "up to 160 MB/s read · with adapter · 10-year warranty"),
    "Samsung PRO Plus microSD (2023 model, MB-MDxxxSA)": ("Samsung PRO Plus microSD", "samsung-pro-plus-microsd-2023", "Samsung PRO Plus microSD {c}", "up to 180 MB/s read · 130 MB/s write"),
}
for l in mc["lines"]:
    if l["line"] not in MC:
        continue
    title, slug, q, spec = MC[l["line"]]
    for v in l["variants"]:
        c = v["capacity"]
        if c.upper().endswith("TB"):  # owner, 7 Nov: memory cards up to 512GB only
            continue
        rel = f"memory-cards/{slug}/{c.lower().replace('.', '-')}.png"
        row("cards", title, c, q.format(c=c), rid=f"card-{slug}-{c.lower().replace('.', '-')}",
            thumb=creative_thumb(rel) if rel in by_file else None, part=v["partNumber"].split("/")[0], spec=spec)

# ---------- 7. SSDs ----------
section("ssd", "SSDs: SanDisk and WD", "Sizes up to 1 TB. Samsung SSDs are not listed (owner, 7 Nov).")
ssd = json.load(open(S / "catalog-research/ssd/range.json"))
by_part = {i.get("part_number"): i["file"] for i in manifest["images"] if i["range"] == "ssd"}
def over_1tb(c):  # owner, 7 Nov: SSDs up to 1 TB only
    return c.upper().endswith("TB") and float(c[:-2]) > 1


for l in ssd["lines"]:
    if not l["variants"] or l["brand"] == "Samsung":  # owner, 7 Nov: no Samsung SSDs
        continue
    for v in l["variants"]:
        c, pn = v["capacity"], v["partNumber"]
        if over_1tb(c):
            continue
        hs = "XHE" in pn or "TAH" in pn
        variant = f"{c}{' · with heatsink' if hs else ''}"
        name = l["line"].replace("SanDisk / WD ", "")
        qname = name.split(" (")[0]
        warranty = (v.get("warranty") or "").split(" or ")[0].replace("Limited Warranty", "warranty").replace("Limited warranty", "warranty")
        rid = "ssd-" + pn.lower().replace("/", "-")
        row("ssd", name, variant, f"{qname} {c}{' heatsink' if hs else ''}", rid=rid,
            thumb=creative_thumb(by_part[pn]) if pn in by_part else None, part=pn,
            spec=f"{l['type']} · {warranty.strip()}")

json.dump({"sections": sections, "rows": rows}, open(OUT / "rows.json", "w"), indent=1, ensure_ascii=False)
import base64
thumbs = {}
for r in rows:
    t = r.get("thumb")
    if t and t not in thumbs:
        thumbs[t] = "data:image/webp;base64," + base64.b64encode((OUT / t).read_bytes()).decode()
tpl = (OUT / "template.html").read_text()
data = json.dumps({"sections": sections, "rows": rows, "thumbs": thumbs}, ensure_ascii=False, separators=(",", ":"))
(OUT / "index.html").write_text(tpl.replace("/*__DATA__*/null", data))
print(len(rows), "rows;", len(list(TH.iterdir())), "thumbs")
from collections import Counter
print(Counter(r["sec"] for r in rows))
print("no thumb:", [r["id"] for r in rows if "thumb" not in r])
