"""Copy this session's catalogue work into the repo so it survives the session.

python3 -I tools/persist.py <scratchpad> <repo>/catalog-sources/new-ranges-2026-11
"""
import json
import re
import shutil
import sys
from pathlib import Path

from PIL import Image

S = Path(sys.argv[1])
D = Path(sys.argv[2])
Q = 88
W = 1440


def to_webp(src: Path, dst: Path, size=W, q=Q):
    dst.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(src)
    alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    im = im.convert("RGBA" if alpha else "RGB")
    if max(im.size) > size:
        im.thumbnail((size, size), Image.LANCZOS)
    im.save(dst, "WEBP", quality=q, method=6)


# 1. Teal-set listing images (official photos on the stage) + manifest
man = json.load(open(S / "creatives/manifest.json"))
for img in man["images"]:
    to_webp(S / "creatives" / img["file"], D / "teal" / img["file"].replace(".png", ".webp"))
    img["file"] = img["file"].replace(".png", ".webp")
    img["source_file"] = Path(img.get("source_file", "")).name
    img["master_note"] = "Saved here at 1440 px WebP; the 2048 px PNG master was in the session scratchpad."
for k in ("no_matching_image", "skipped"):
    for e in man.get(k, []):
        if "source" in e:
            e["source"] = Path(e["source"]).name
man.pop("sheets", None)
(D / "teal").mkdir(parents=True, exist_ok=True)
json.dump(man, open(D / "teal/manifest.json", "w"), indent=1, ensure_ascii=False)
for r in ("memory-cards", "ssd", "consistent", "boat", "cpplus"):
    im = Image.open(S / f"creatives/{r}/sheet.jpg").convert("RGB")
    im.thumbnail((1600, 4000), Image.LANCZOS)
    im.save(D / f"teal/{r}/contact-sheet.jpg", quality=80)

# 2. RAM renders (our own, unbranded) + the empty stage plates used for compositing
for p in sorted((S / "ram-renders").glob("*.png")):
    to_webp(p, D / "ram" / (p.stem + ".webp"), size=2048 if p.stem.startswith("plate") else W, q=92 if p.stem.startswith("plate") else Q)
shutil.copy(S / "ram-renders/render-meta.json", D / "ram/render-meta.json")
shutil.copy(S / "ram-renders/README.md", D / "ram/README.md")

# 3. Shop photos from the Drive ZIP: only the views the audit kept, in listing order
ZIP = {
    1: ("geonix-microsd-64gb", "01_Storage/Memory-Cards/Geonix-MicroSD-64GB", [2, 8, 7, 5]),
    3: ("samsung-ram-hold", "01_Storage/RAM/Samsung-RAM-Desktop-DDR", [2, 8, 3, 5]),
    4: ("cablet-hd2533-sata-enclosure", "01_Storage/SSD-Enclosures/Gecoblet-2.5in-SATA-Enclosure", [2, 8, 7]),
    5: ("cablet-ms902-nvme-enclosure", "01_Storage/SSD-Enclosures/Gecoblet-M2-NVMe-Enclosure", [2, 8, 7, 3]),
    6: ("consistent-s7-nvme-256gb", "01_Storage/SSD-Internal/Consistent-S7-NVMe-M2-256GB", [8, 7]),
    7: ("consistent-s7-sata-128gb", "01_Storage/SSD-Internal/Consistent-S7-SATA-2.5in-128GB", [2, 8, 7, 9]),
    8: ("consistent-s7-sata-256gb", "01_Storage/SSD-Internal/Consistent-S7-SATA-2.5in-256GB", [2, 8, 7, 5, 9]),
    9: ("sandisk-cruzer-blade-16gb", "01_Storage/USB-Flash-Drives/SanDisk-Cruzer-Blade-16GB", [8, 2, 7]),
    10: ("sandisk-cruzer-blade-32gb", "01_Storage/USB-Flash-Drives/SanDisk-Cruzer-Blade-32GB", [8, 2, 3, 7]),
    11: ("sandisk-cruzer-blade-64gb", "01_Storage/USB-Flash-Drives/SanDisk-Cruzer-Blade-64GB", [8, 2, 3, 7]),
    12: ("sandisk-ultra-flair-128gb", "01_Storage/USB-Flash-Drives/SanDisk-Ultra-Flair-128GB", [2, 5, 7]),
    13: ("ranz-otg-rz-ut01", "02_Connectivity/OTG-Adapters/Ranz-USB-C-to-USB-OTG", [2, 3, 5, 8, 7]),
    14: ("hydrogel-iphone", "03_Screen-Protectors/Hydrogel-Film/Unbreakable-Membrane-iPhone", [8, 2, 3]),
    15: ("flayr-borderless-iphone", "03_Screen-Protectors/Tempered-Glass/FLAYR-8K-Borderless-iPhone", [3, 5, 9, 2]),
    16: ("gtel-fantacy-samsung", "03_Screen-Protectors/Tempered-Glass/Fantacy-3D-Fingerprint-Samsung", [2, 9, 5]),
    17: ("flayr-super-large-arc", "03_Screen-Protectors/Tempered-Glass/Super-Large-Arc", [2, 8, 7]),
    18: ("gtel-super-x", "03_Screen-Protectors/Tempered-Glass/SuperX-Curved-Glass", [2]),
    19: ("hello-kitty-realme-16", "04_Phone-Cases/Character-HelloKitty/Realme", [2, 7]),
    20: ("tom-jerry-redmi-a2-black", "04_Phone-Cases/Character-TomAndJerry/Black", [2, 9, 7]),
    21: ("tom-jerry-redmi-9c-maroon", "04_Phone-Cases/Character-TomAndJerry/Redmi-9C-Maroon", [2, 9, 7, 8]),
    22: ("tom-jerry-oppo-a17-black", "04_Phone-Cases/Character-TomAndJerry/Redmi-A1", [2, 7, 8]),
    23: ("clear-bumper-edge-40-neo", "04_Phone-Cases/Clear-Bumper/Motorola-Edge-40-Neo", [2, 9, 8, 7]),
    24: ("clear-bumper-edge-60-pro", "04_Phone-Cases/Clear-Bumper/Motorola-Edge-60-Pro-5G", [8, 5, 7]),
    26: ("floral-glitter-redmi-13c", "04_Phone-Cases/Glitter-Fashion/Floral-Glitter-Redmi-13C-5G", [3, 5]),
    27: ("purple-hearts-glitter-redmi-13c", "04_Phone-Cases/Glitter-Fashion/Purple-Glitter-Redmi-13C-5G", [9, 5, 2, 7]),
    28: ("neza-magnetic-edge-50-fusion", "04_Phone-Cases/MagSafe-Clear/NEZA-Motorola-Edge-60-Pro", [2, 9, 5, 7]),
    29: ("neza-magnetic-edge-70", "04_Phone-Cases/MagSafe-Clear/NEZA-Motorola-Edge-70", [5, 2, 9, 3, 7]),
    30: ("metal-frame-iphone-16-pro", "04_Phone-Cases/Metal-Frame/Metal-Pure-Frame-Case-iPhone", [9, 5, 3]),
    31: ("detachable-frame-hold", "05_Grips-Stands/Detachable-MagSafe-Grip", [2]),
}
index = []
for n, (slug, rel, povs) in ZIP.items():
    folder = S / "dl-creatives" / rel
    files = {int(m.group(1)): f for f in folder.iterdir() if (m := re.match(r"POV(\d+)-", f.name))}
    kept = []
    for order, pov in enumerate(povs):
        src = files[pov]
        name = f"{order}-{src.stem}.webp"
        to_webp(src, D / "shop-photos" / f"{n:02d}-{slug}" / name)
        kept.append(name)
    index.append({"n": n, "folder": f"{n:02d}-{slug}", "zipFolder": rel, "kept": kept})
json.dump(index, open(D / "shop-photos/index.json", "w"), indent=1)

# 4. Research data and audit notes (no raw downloads)
for r in ("ssd", "memory-cards", "consistent"):
    for f in ("range.json", "README.md"):
        (D / "research" / r).mkdir(parents=True, exist_ok=True)
        shutil.copy(S / f"catalog-research/{r}/{f}", D / f"research/{r}/{f}")
for f in sorted((S / "audit").glob("*.md")):
    (D / "audit").mkdir(exist_ok=True)
    shutil.copy(f, D / "audit" / f.name)

# 5. Tools that rebuild the above
for src, sub in ((S / "cx-tools", "teal-composite"), (S / "ram-renders/src", "ram-render")):
    for f in sorted(src.iterdir()):
        if f.is_file() and f.suffix in (".py", ".sh", ".js", ".mjs", ".cjs"):
            (D / "tools" / sub).mkdir(parents=True, exist_ok=True)
            shutil.copy(f, D / "tools" / sub / f.name)
(D / "tools/price-sheet").mkdir(parents=True, exist_ok=True)
for f in ("tools/build_pricesheet.py", "pricesheet/template.html", "tools/persist.py"):
    shutil.copy(S / f, D / "tools/price-sheet" / Path(f).name)
print("done")
