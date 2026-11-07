# Consistent SSD range (GadgetsHub product sheet)

Checked on 2026-11-06 against **consistent.in only** (Consistent InfoSystems Pvt. Ltd.), using plain curl with default settings about 1.5 s apart. `range.json` holds **4 lines and 15 variants** (one product page per capacity), with verbatim quotes and their location on the page, 63 image records, sources, and Amazon.in / Flipkart search URLs. The search URLs were built locally and never fetched.

The site has **no portable/external SSD**. The SSD category lists 14 products over 2 pages. Site search for "ssd" found a 15th, the **2.5" 512GB**, which is filed under "Uncategorized". The Storage category (47 items) adds only HDDs, external HDDs, pen drives and microSD cards.

**Price/MRP: none.** No official page shows a price: the price element is empty on all 15. `Buy Now` goes to shop.consistent.in (not fetched; outside the allowed hosts) or, for the 2.5" 128GB/256GB/1TB, to amzn.to links (not fetched).

n/s = not stated in the page text. **Bold** = the page text states conflicting figures, so the value is `null` in range.json and every reading is kept. Speeds are in MB/s. Best drive/box = the gallery index of the cleanest drive-only or box-only image.

| Line (type) | Capacity | Model code | Interface (page text) | Seq. read | Seq. write | NAND / cache | Warranty | Best drive / box | Shop stock |
|---|---|---|---|---|---|---|---|---|---|
| 2.5" SATA | 128GB | – | SATA III 6 Gb/s | **540 vs 550** | 500 | n/s | 5 years | #2 / #1 | S7 2.5" SATA 128GB |
| 2.5" SATA | 256GB | – | SATA III 6 Gb/s | **540 vs 550** | 500 | n/s | 5 years | #1 / #2 | S7 2.5" SATA 256GB |
| 2.5" SATA | 512GB | – | SATA III 6 Gb/s | **540 vs 550** | 500 | n/s | 5 years | #5 / – | |
| 2.5" SATA | 1TB | – | SATA III 6 Gb/s | **540 vs 550** | 500 | n/s | 5 years | #3 / #2 | |
| M.2 2280, titled "M.2 SATA" | 128GB | – | **contradictory** | **520 vs 550** | n/s | n/s | 5 years | #2 / #1* | |
| M.2 2280, titled "M.2 SATA" | 256GB | – | **contradictory** | **520 vs 550 vs 560** | n/s | 3D NAND | 5 years | #2 / #1* | |
| M.2 2280, titled "M.2 SATA" | 512GB | – | **contradictory** | **540 vs 550** | **450 vs 500** | n/s | 5 years | #2 / #1* | |
| M.2 2280, titled "M.2 SATA" | 1TB | – | **contradictory** | **550 vs 1,622** | **500 vs 520** | n/s | 5 years | #2 / #1* | |
| M.2 2280 NVMe Gen 3 | 128GB | – | PCIe Gen3 x4 NVMe | 2,200 | 1,600 | 3D NAND, SLC cache | 5 years | #4 / #3 | |
| M.2 2280 NVMe Gen 3 | 256GB | – | PCIe Gen3 x4 NVMe | 2,200 | **1,600 vs 3,000** | 3D NAND, SLC cache | 5 years | #5 / #4 | S7 NVMe 256GB |
| M.2 2280 NVMe Gen 3 | 512GB | – | "NVMe PCIe" (Gen3 x4 only in images) | 2,200 | 3,200 (higher than read) | 3D NAND, SLC cache | 5 years | #5 / #4 | |
| M.2 2280 NVMe Gen 3 | 1TB | – | PCIe Gen3 x4 NVMe | **2,400 vs 3,500** | 3,400 (higher than title read) | 3D NAND, SLC cache | 5 years | #1 / #2 | |
| M.2 2280 NVMe Gen 4 | 512GB | CTNVMe5124G | PCIe Gen4 x4 NVMe | 5,000 | n/s | 1 GB DDR4 SDRAM | 5 years | #1 / – | |
| M.2 2280 NVMe Gen 4 | 1TB | CTNVMe0014G | PCIe Gen4 x4 NVMe | 7,000 | n/s | 1 GB DDR4 SDRAM | 5 years | #1 / – | |
| M.2 2280 NVMe Gen 4 | 2TB | CTNVMe0024G | PCIe Gen4 x4 NVMe | 7,300 | n/s | 1 GB DDR4 SDRAM | 5 years | #1 / – | |

\* The M.2 "SATA" box image is the same file on all 4 pages and prints "128GB".

Other text stated on the pages:
- Gen 3 NVMe 128GB, 256GB and 1TB: "MTBF is Expressed in 2 Million Hours".
- Gen 3 NVMe 256GB and 1TB: "Supports NVMe 1.3, Host Memory Buffer (HMB)".
- 2.5" SATA: "SSD write cache is enabled".

Text found only in the images:
- The 2.5" banners say "3D NAND", "Power 60MW" and "Reliability 1.75M Hrs".
- The Gen 4 banners say "CHEETAH Gen 4 – High Performance Gaming SSD".

## Shop stock matched (S7)

- **S7 2.5" SATA 128GB** (MRP ₹5,550): official 2.5" 128GB page (post 2014).
- **S7 2.5" SATA 256GB** (MRP ₹9,450): official 2.5" 256GB page (post 2033).
- **S7 NVMe 256GB** (MRP ₹10,050): official Gen 3 NVMe 256GB page (post 2150).

These are matched by form factor and capacity only. **"S7" never appears in the page text**, and a site search for "S7" returns no products. "S7" appears only in the official images:
- printed on the 2.5" drive label and box
- printed on the M.2 "SATA" and Gen 3 NVMe boxes as well, so it does not identify one line
- on the Gen 3 NVMe lifestyle images, whose drive label reads "MODEL:-CTNVMe002S7"; the same image is used for several capacities

No S7 part codes (e.g. CTSSD256S7) appear anywhere on the site. The MRPs above are the shop's own figures.

## Images

All 63 images are saved under `raw/img/<variant>/NN-<file>.webp` (NN = gallery position). They are the product's own WooCommerce gallery (`pg-main-<post_id>`), not the related-products strip, downloaded at full size: WebP, 800–810 px wide, a few 541–558 px. None is larger than 1016 px.
- **Clean drive shots (white background):** 15 are drive-only images, one per page.
  - 2.5" drives: about 810x1016 px, drive about 80% of the width. The 128GB background is #F7F7F7 rather than pure white.
  - M.2 "SATA" and Gen 3 NVMe: one generic photo per line, reused across capacities. It has a placeholder label ("MODEL:- XXXXXXXXXX") and no capacity marking, and the drive is only about 186–202 px wide in an 800 px frame.
  - Gen 4: the drive is small in the frame (about 405x112 px of 810x810). The label shows the correct model code.
- **Boxes:** 11 box-only images.
  - Only one is transparent: the 2.5" 256GB box.
  - 2.5" 128GB and 1TB boxes are on white, as is the Gen 3 NVMe 256GB box (small: about 234x388 px).
  - The Gen 3 NVMe 128GB box photo is on light grey (#CACCD0).
  - 6 renders fill the frame with no margin.
  - **No box image exists** for the 2.5" 512GB (only in scenes) or for any Gen 4 variant.
- **The rest:** 15 marketing banners, 21 lifestyle/infographic images and 1 infographic without the drive (dark or scene backgrounds; not suitable for cut-outs).
- **Fetch notes:**
  - Python urllib image requests got HTTP 403 from Cloudflare.
  - With curl, 4 images first returned a bot-verification page ("One moment, please..."). One later plain retry got all 4.
  - All 63 files are checked as valid WebP.

## Contradictions on the official pages (not resolved)

1. **M.2 "SATA" (all 4): the interface conflicts.**
   - Titles say "M.2 SATA 2280" and also "PCIe Gen 3.0".
   - 128GB/512GB bullets say "PCIe Gen 3.0 x4 NVMe". The 128GB page also says "M.2 NVME, SSD M.2, 128 m.2 nvme SSD", and the 512GB page says "m.2 512gb nvme" and "M.2 NVME SATA 2280".
   - The 256GB page says "Support interface m.2 and SATA 3 Protocol".
   - The banner and box images print both "M.2 SATA" and "M.2 PCIe Gen3 X4".
   - The 1TB Buy Now slug says "m-2-nvme-2280-with-1622mb-s".
2. **M.2 "SATA" speeds:**
   - 128GB/256GB titles: "550MB/500Mbps Read Speed"; bullets: "520MB/s Read Speed". The 256GB page also says "read speed in upto 560MB/s".
   - 512GB: title 550/500; bullet and paragraph 540/450.
   - 1TB: title 550/500; bullet "550MBps Read and Write speeds up to 520MBps"; paragraph "1622MB/s Read Speed".
3. **M.2 "SATA" 256/512/1TB:** the box image shows "128GB".
4. **2.5" SATA (all 4):** read 550 in the title vs 540 in the bullet (write 500 in both). The images say 560/530 ("R/W 560/530mbps", "Sequential Reads: 560 MB/S", "READ UP TO 560 MB/S / WRITE UP TO 530 MB/S").
5. **Gen 3 NVMe 256GB:** the title says write 3000 MB/s, higher than read 2200. The bullet says write 1,600 MB/s.
6. **Gen 3 NVMe 512GB:** the title says write 3200 MB/s, higher than read 2200. The page text never states the PCIe generation; only the images say Gen3 x4.
7. **Gen 3 NVMe 1TB:** read 2400 (title) vs 3500 "(1TB models)" (bullet) vs "Up to 3000MB/s" (paragraph). The title's write of 3400 is higher than its read of 2400.
8. **Gen 4 (all 3):**
   - Page text says "PCIe Gen 4.0 x 4", but the banners say "M.2PICe Gen3x4".
   - The bullet copies another brand's text: "To maximize the performance of the 980 PRO, please check whether your system supports PCIe 4.0."
   - The 1TB banner says "70000 MB/S" vs 7,000 in the text.
   - The 512GB Buy Now link points to the 1TB CTNVMe0014G store slug, and its title ends with an extra "(512)".
9. **Minor:**
   - The 2.5" 512GB page's drive image file is named "128GB-Photoroom" (the image itself shows 512GB).
   - The 1TB and 2TB Gen 4 drive photos show the same label serial line, CNV4002RAEY00021.
   - The 2.5" 128GB bullet reads "equential 128KB Read…" (kept verbatim).
   - Several Buy Now slugs carry other figures (520, 552-500, 2200, 3000 MB/s).

## Gaps

- **No model or part codes** for the 2.5" SATA, M.2 "SATA" or Gen 3 NVMe lines. Only the Gen 4 drives have codes: CTNVMe5124G, CTNVMe0014G, CTNVMe0024G.
- **No price or MRP** on any official page. The official store (shop.consistent.in) was not checked.
- **Not stated anywhere:**
  - TBW for every variant.
  - Write speed for all Gen 4 drives and for the M.2 "SATA" 128GB/256GB (only "500Mbps" inside a read-speed phrase).
  - NAND type in the text for the 2.5" SATA, Gen 4 and three of the M.2 "SATA" pages (the images say "3D NAND").
  - Controller for every line, and DRAM for every line except Gen 4.
- **Unresolved:** the M.2 "SATA" interface (SATA vs PCIe NVMe) and the conflicting speeds above. Confirm with Consistent or from the physical drive/box before listing.
- **Missing images:**
  - No capacity-specific drive photo for the M.2 "SATA" and Gen 3 NVMe lines.
  - No correct box image for the M.2 "SATA" 256GB/512GB/1TB.
  - No box image for the 2.5" 512GB or the Gen 4 drives.
  - No transparent cut-outs except the 2.5" 256GB box.

## Files

- `range.json`: lines → variants. Each variant has the official name, URL, capacity, modelCode, formFactor, interface, sequential (read/write with every stated value and quote), nand / slcCache / dramCache, warranty, description bullets and paragraphs, price (null), buyNow, contradictions, images[], bestImages, search (Amazon/Flipkart URLs), sources[] and shopStock where matched.
- `raw/`: category, search and product pages fetched in this run, and `img/`. The 12 product pages from the caller remain in `../../dl-consistent/p/`.
- `tools/`: fetch.sh, list_loop.py, parse_product.py, get_images.py, imginfo.py, bbox.py, annotations.py (manual readings), build_range.py (verifies every quote against the page HTML), fetch.log, and contact sheets in `tools/sheets/`.
