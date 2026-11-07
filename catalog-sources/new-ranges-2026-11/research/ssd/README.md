# Internal SSD range research (GadgetsHub)

Checked 2026-11-06 against official brand sites only, with plain requests (curl / Playwright defaults). `range.json` has 22 lines and 63 variants with part numbers, official specs, sources, image records and Amazon.in / Flipkart search URLs (built locally, never fetched). The shop's own Consistent S7 stock is out of scope.

n/s = not stated on the official page (left `null` in range.json). HS = heatsink version.

## Range

| Brand | Line | Type | Capacities (India site) | Seq. read MB/s | Seq. write MB/s | TBW per capacity | Warranty | Scope |
|---|---|---|---|---|---|---|---|---|
| Samsung | Samsung 870 EVO | SATA 2.5" | 250GB, 500GB, 1TB, 2TB, 4TB | 560 | 530 | 150 / 300 / 600 / 1,200 / 2,400 | 5 years | requested |
| Samsung | Samsung 990 EVO Plus | M.2 NVMe | 1TB, 2TB, 4TB | 7,150-7,250 | 6,300 | 600 / 1,200 / 2,400 | 5 years | requested |
| Samsung | Samsung 990 PRO | M.2 NVMe | 1TB, 2TB, 4TB | 7,450 | 6,900 | 600 / 1,200 / 2,400 | 5 years | requested |
| Samsung | Samsung 990 (value NVMe, MZ-V9V) | M.2 NVMe | 1TB, 2TB | 7,150-7,250 | 6,450 | 400 / 800 | 3 years | requested |
| SanDisk | SanDisk SSD Plus SATA III | SATA 2.5" | 240GB, 480GB | 530-535 | 440-445 | n/s | 3 years | requested |
| SanDisk | SanDisk SSD Plus M.2 NVMe (PCIe Gen 3) | M.2 NVMe | 250GB, 500GB, 1TB, 2TB | 2,400-3,200 | n/s | n/s | 3 years | requested |
| SanDisk / WD | WD Blue SN5000 | M.2 NVMe | 500GB, 1TB, 2TB, 4TB | 5,000-5,500 | 4,000-5,000 | 300 / 600 / 900 / 1,200 | 5 years | requested |
| SanDisk / WD | WD Blue SN5100 | M.2 NVMe | 500GB, 1TB, 2TB, 4TB | 6,600-7,100 | 5,600-6,700 | 300 / 600 / 900 / 1,200 | 5 years | extra (current line) |
| SanDisk / WD | WD_BLACK SN7100 | M.2 NVMe | 500GB, 1TB, 2TB, 4TB | 6,800-7,250 | 5,800-6,900 | n/s / n/s / n/s / 2,400 | 5 years | requested |
| SanDisk / WD | WD_BLACK SN850X | M.2 NVMe | 1TB, 1TB (HS), 2TB, 2TB (HS), 4TB, 4TB (HS), 8TB, 8TB (HS) | 7,200-7,300 | 6,300-6,600 | 600 / 1,200 / 2,400 / 4,800 | 5 years | requested |
| SanDisk | SanDisk Optimus GX PRO 850X | M.2 NVMe | 1TB, 1TB (HS), 2TB, 2TB (HS), 4TB, 4TB (HS), 8TB, 8TB (HS) | 7,200-7,300 | 6,300-6,600 | 600 / 1,200 / 2,400 / 4,800 | 5 years | extra (current line) |
| SanDisk | SanDisk Optimus GX 7100 | M.2 NVMe | 500GB, 1TB, 2TB, 4TB | 6,800-7,250 | 5,800-6,900 | 300 / 600 / 1,200 / 2,400 | 5 years | extra (current line) |
| SanDisk | SanDisk Optimus 5100 | M.2 NVMe | 500GB, 1TB, 2TB, 4TB | 6,600-7,100 | 5,600-6,700 | n/s / n/s / n/s / 1,200 | 5 years | extra (current line) |
| SanDisk | SanDisk 520 SATA SSD | SATA 2.5" | 500GB, 1TB, 2TB, 4TB | 560 | 510-525 | 300 / 400 / 700 / 1,000 | 5 years | extra (current line) |
| SanDisk | SanDisk 320 SATA SSD | SATA 2.5" | 250GB, 500GB, 1TB, 2TB | 545 | n/s | n/s | 3 years | extra (current line) |
| Crucial | Crucial MX500 | SATA 2.5" | **blocked: needs manual images/specs** | | | | | requested |
| Crucial | Crucial BX500 | SATA 2.5" | **blocked: needs manual images/specs** | | | | | requested |
| Crucial | Crucial P3 | M.2 NVMe | **blocked: needs manual images/specs** | | | | | requested |
| Crucial | Crucial P3 Plus | M.2 NVMe | **blocked: needs manual images/specs** | | | | | requested |
| Crucial | Crucial T500 | M.2 NVMe | **blocked: needs manual images/specs** | | | | | requested |
| Kingston | Kingston A400 | SATA 2.5" | **blocked: needs manual images/specs** | | | | | requested |
| Kingston | Kingston NV3 | M.2 NVMe | **blocked: needs manual images/specs** | | | | | requested |

Part numbers per capacity are in range.json (Samsung India `MZ-...BW`, SanDisk/WD SKU and model numbers).

## Images

- **SanDisk / WD: 23 official images saved** (PNG, transparent background, 1680x1680 px; Optimus 5100 is 3000x3000) under `raw/<line>/img/`. Source URLs, sizes and SHA-256 hashes are in range.json. The site shows drive front/angle shots only, no box shots.
- **Samsung: none downloaded.** All product images are on `images.samsung.com`, which is blocked here. For every variant range.json records the official front, angle (r-perspective) and pack-front URLs from the India page: a transparent PNG preset (`$1164_776_PNG$`) and the largest JPG preset (`$Q90_2052_1641_JPG$`). Download them by hand.
- **Crucial, Kingston: none** (sites blocked).

## Unknowns and caveats

- **Official India prices: unknown for every variant.**
  - Samsung India pages have no price in the HTML. Price and stock are filled in by JavaScript from `resources.samsung.com`, which is blocked here.
  - SanDisk en-in pages mark the catalogue non-purchasable (`data-purchasable-catalog="false"`). The WD-branded SKUs (SN850X, SN7100, SN5000, SN5100) are also flagged `hidePricing`.
- **Crucial (MX500, BX500, P3, P3 Plus, T500): no data.** www.crucial.in returned a WAF "Request Rejected" page to every request. Context to verify by hand, not confirmed from an official page in this run: Micron announced in Dec 2025 that it was exiting the Crucial consumer business. Check availability before stocking.
- **Kingston (A400, NV3): no data.** www.kingston.com returned a 403 Cloudflare challenge, which was not bypassed. Needs manual images and specs.
- **Samsung:**
  - The India site lists 990 EVO Plus and 990 PRO only in 1/2/4TB: no 500GB and no heatsink SKUs.
  - The 870 EVO is listed in 250GB-4TB. The new value line "990" (MZ-V9V) is listed in 1TB and 2TB only, with a 3-year warranty.
  - The 990 2TB page `<title>` wrongly says 1TB.
  - Also on the India site but not researched: 9100 PRO (PCIe 5.0) in 1/2/4/8TB (MZ-VAP1T0BW, MZ-VAP2T0BW, MZ-VAP4T0BW, MZ-VAP8T0BW).
- **SanDisk / WD:**
  - Not listed on the India site: WD Blue SN580 and WD_BLACK SN770. SN7100 and SN5000/SN5100 are covered instead.
  - The WD Blue SN5000 page opens a pop-up: "This product is no longer available on Sandisk.com".
  - SanDisk SSD Plus SATA is listed only in 240GB and 480GB. The 2.5" SATA range continues as the new SanDisk 320 and 520 lines (included as extras).
  - Optimus GX PRO 850X, GX 7100 and 5100 are SanDisk-branded lines. Their listed speeds and TBW match SN850X, SN7100 and SN5100, but the site does not say they are the same drives.
- **Gaps in official specs (null in range.json):**
  - Not stated on the official India pages: TBW for SSD Plus SATA/NVMe and SanDisk 320; write speed for SSD Plus NVMe and SanDisk 320; DRAM/HMB for all SanDisk/WD lines except SN7100 ("DRAM-less").
  - SN7100 and Optimus 5100 state TBW for the 4TB model only.
  - NAND type for SanDisk/WD comes from page body text, not the spec table.
- **Discrepancies:**
  - SSD Plus SATA: the spec table says 530/440 MB/s (240GB) and 535/445 MB/s (480GB), but the body text says "up to 545 / 350 MB/s". range.json uses the table values.
  - SN850X: TBW is printed as e.g. "600units" on the site.
- **Other SanDisk internal lines on the India site, not researched:** WD Blue SA510, WD Green (SN3000, SN350, SATA M.2), WD Red, WD_BLACK SN770M / SN850P / SN8100, Optimus GX PRO 8100, OEM PC-series.

## Blocked or unreachable hosts

- `www.crucial.in`: WAF "Request Rejected" page for all requests (curl and Playwright defaults)
- `www.kingston.com`: HTTP 403 Cloudflare challenge
- `images.samsung.com`: not on allowlist; proxy refused CONNECT (403). Hosts all Samsung India product images
- `resources.samsung.com`: not on allowlist; page scripts failed to load in Playwright, so Samsung India price/stock never rendered
- `api.sandisk.com`: not on allowlist (not requested); SanDisk commerce/price API referenced by the pages
- `image.semiconductor.samsung.com / download.semiconductor.samsung.com`: not on allowlist (not requested); host Samsung semiconductor-site images and datasheets

## Files

- `range.json`: the data, one entry per line, `variants[]` per capacity/SKU, `sources[]` with fetch date per fact.
- `raw/<line>/`: saved official pages (untrusted data) and downloaded images; `raw/_probe`, `raw/crucial`, `raw/kingston` hold the refusal pages.
- `tools/`: fetch/parse/build scripts (`fetch.log` lists the 62 page/image requests made through fetch.sh; a few initial reachability probes and 2 Playwright page loads (Samsung 990 PRO, crucial.in) are not in it).
