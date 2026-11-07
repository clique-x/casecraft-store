# GadgetsHub microSD range research (official brand sources)

Researched 2026-11-06. I used plain curl requests (default user agent, spaced about 2 s apart) and fetched official brand sites only. I did not fetch Amazon or Flipkart. The search links in `range.json` are built for checking prices by hand. The full data, with a source URL for every fact, is in `range.json`. The Geonix 64GB shop card is excluded, as asked.

## Range

| Line (source) | Capacity | Part number | Read / Write MB/s | Classes | Adapter | Warranty |
|---|---|---|---|---|---|---|
| SanDisk Ultra (sandisk.com/en-in) | 32GB | SDSQUA4-032G-GN6MN | 120 / not stated | UHS-I, A1 | No (card only) | 10-yr limited |
| | 64GB | SDSQUAB-064G-GN6MN | 140 / not stated | UHS-I, A1 | No | 10-yr |
| | 128GB | SDSQUAB-128G-GN6MN | 140 / not stated | UHS-I, A1 | No | 10-yr |
| | 256GB | SDSQUAC-256G-GN6MN | 150 / not stated | UHS-I, A1 | No | 10-yr |
| | 512GB | SDSQUAC-512G-GN6MN | 150 / not stated | UHS-I, A1 | No | 10-yr |
| | 1TB | SDSQUAC-1T00-GN6MN | 150 / not stated | UHS-I, A1 | No | 10-yr |
| | 1.5TB | SDSQUAC-1T50-GN6MN | 150 / not stated | UHS-I, A1 | No | 10-yr |
| SanDisk Extreme (sandisk.com/en-in) | 64GB | SDSQXAH-064G-GN6MN | 170 / 80 | U3, V30, A2 | not stated | Lifetime limited |
| | 128GB | SDSQXAA-128G-IN6MS | 190 / 90 | U3, V30, A2 | not stated | Lifetime |
| | 256GB | SDSQXAV-256G-IN6MS | 190 / 130 | U3, V30, A2 | not stated | Lifetime |
| | 512GB | SDSQXAV-512G-IN6MS | 190 / 130 | U3, V30, A2 | not stated | Lifetime |
| | 1TB | SDSQXAV-1T00-IN6MS | 190 / 130 | U3, V30, A2 | not stated | Lifetime |
| Samsung EVO Plus 2024 (samsung.com/uk*) | 64GB | MB-MC64SA/EU | 160 / lower than read | U1, V10, A1 | Yes | 10-yr limited** |
| | 128GB | MB-MC128SA/EU | 160 / lower than read | U3, V30, A2, C10 | Yes | 10-yr** |
| | 256GB | MB-MC256SA/EU | 160 / lower than read | U3, V30, A2, C10 | Yes | 10-yr** |
| | 512GB | MB-MC512SA/EU | 160 / lower than read | U3, V30, A2, C10 | Yes | 10-yr** |
| | 1TB | MB-MC1T0SA/EU | 160 / lower than read | U3, V30, A2, C10 | Yes | 10-yr** |
| Samsung EVO Plus 2021 (samsung.com/in, "Not for sale") | 64GB | MB-MC64KA/IN | 130 / lower than read | U1, V10, A1 | Yes | 10-yr** |
| | 128GB | MB-MC128KA/IN | 130 / lower than read | U3, V30, A2, C10 | Yes | 10-yr** |
| | 256GB | MB-MC256KA/IN | 130 / lower than read | U3, V30, A2, C10 | Yes | 10-yr** |
| | 512GB | MB-MC512KA/IN | 130 / lower than read | U3, V30, A2, C10 | Yes | 10-yr** |
| Samsung PRO Plus 2023 (samsung.com/uk*) | 128GB | MB-MD128SA/EU | 180 / 130 | U3, V30, A2, C10 | Yes | 10-yr** |
| | 256GB | MB-MD256SA/EU | 180 / 130 | U3, V30, A2, C10 | Yes | 10-yr** |
| | 512GB | MB-MD512SA/EU | 180 / 130 | U3, V30, A2, C10 | Yes | 10-yr** |
| | 1TB | MB-MD1T0SA/EU | 180 / 130 | U3, V30, A2, C10 | Yes | 10-yr** |
| Kingston Canvas Select Plus | - | - | - | - | - | **Needs manual images and specs** (kingston.com blocks automated requests; I did not try it) |

\* Samsung India does not list the 2024 EVO Plus or the PRO Plus. The consumer pages on semiconductor.samsung.com now redirect to samsung.com/us, and that site loads its specs client-side. So I took the spec tables from the official UK pages. No reachable official page shows the India part-number suffix (/IN) for these models.
\*\* Samsung warranty: it does not cover dashcam, CCTV, surveillance or other write-intensive use. The SD adapter has a 1-year warranty.

Operating temperature is -25 to 85 °C on every page that states it. For durability: Samsung claims water, temperature, X-ray, magnet, 5 m drop and 10,000-swipe protection. SanDisk Extreme claims shock, temperature, water and X-ray proofing. Both claims apply to the card only.

## Images saved (6, all from www.sandisk.com, 1680x1680)

- `raw/sandisk-ultra/img/`: card fronts for 64GB, 128GB and 256GB (transparent PNG)
- `raw/sandisk-extreme/img/`: card fronts for 128GB and 256GB (transparent PNG), plus a card with SD adapter (white-background JPG; no capacity printed on the card)

The source URL of every image is in `range.json`. The other SanDisk capacity images are on www.sandisk.com and their URLs are recorded, but I did not download them.

I downloaded no Samsung images, because they are all on `images.samsung.com`, which is blocked. `range.json` lists the card front, card + adapter and pack (where it exists) image URLs for every Samsung capacity.

## Unknown or needs checking

- **Official INR prices: all unknown.**
  - SanDisk's India product pages load prices client-side from `api.sandisk.com` and `indiastore.sandisk.com` (seller "STPL"), and both hosts are blocked.
  - Samsung India shows the EVO Plus 2021 as "Not for sale" / "Out of Stock" with no price.
  - The other Samsung lines are not on the India site.
- **Write speed is not quantified for some lines.** For SanDisk Ultra the page says "Write speeds lower". For both Samsung EVO Plus models it says "Lower than Read Speed".
- **SanDisk Ultra speed classes:** the page text does not state a U-class, V-class or Class 10. The official card image shows U1 and Class 10 marks, so check them on the pack.
- **SanDisk Extreme India page conflict:** its spec table lists 100/60 MB/s for every capacity. That looks like the 32GB row copied across. The same page's speed disclosure and the global page both give 170/80 (64GB), 190/90 (128GB) and 190/130 (256GB-1TB), and those are the figures recorded. Whether an SD adapter is in the box for the India SKUs is not stated.
- **SanDisk Extreme 32GB (SDSQXAF-032G-GN6MA) and 2TB (SDSQXAV-2T00-GN6MA)** are on the global page only, not the India page. They are recorded separately, and the 2TB speeds are left null because its spec row is malformed.
- **Samsung EVO Plus 2021 India:** this is probably legacy stock. Check what is actually available before listing it.
- **Kingston:** everything is unknown.

## Blocked hosts (allow these for the missing data)

| Host | Needed for |
|---|---|
| `images.samsung.com` | All Samsung product photos |
| `api.sandisk.com` | SanDisk India live prices and stock |
| `indiastore.sandisk.com` | SanDisk India store (INR prices) |
| `documents.sandisk.com` | SanDisk data sheets (PDF) |
| `static.sandisk.com` | SanDisk site scripts and fonts (not needed for images) |
| `www.kingston.com` | I did not try it; it is known to block automated requests |

The raw pages are in `raw/<line>/`. The scripts are in `tools/`, and the request log is `tools/fetch.log`.
