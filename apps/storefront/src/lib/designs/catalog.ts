export type Family =
  | "marble"
  | "holo"
  | "aurora"
  | "y2k"
  | "quote"
  | "sticker"
  | "minimal"

export type Finish = "soft" | "glass"

export type ThemeHandle =
  | "marble"
  | "holographic"
  | "abstract"
  | "aesthetic"
  | "quotes"
  | "minimal"

export interface ProcDesign {
  id: string
  handle: string
  name: string
  family: Family
  theme: ThemeHandle
  seed: number
  holo: boolean
  finish: Finish
  priceFromInr: number
  // Product content: the only place hex colours are allowed.
  palette: { base: string; a: string; b: string; c: string; ink: string }
  quote?: string
  badge?: "bestseller" | "limited"
  trendingRank?: number
  isNew?: boolean
}

type Seed = Omit<ProcDesign, "handle" | "theme" | "finish" | "holo" | "priceFromInr"> & {
  holo?: boolean
}

const THEME_OF: Record<Family, ThemeHandle> = {
  marble: "marble",
  holo: "holographic",
  aurora: "abstract",
  y2k: "aesthetic",
  quote: "quotes",
  sticker: "aesthetic",
  minimal: "minimal",
}

const GLASS_FAMILIES: ReadonlySet<Family> = new Set<Family>(["marble", "holo", "aurora"])

function define(d: Seed): ProcDesign {
  return {
    ...d,
    handle: d.id,
    theme: THEME_OF[d.family],
    finish: GLASS_FAMILIES.has(d.family) ? "glass" : "soft",
    holo: d.holo ?? false,
    priceFromInr: GLASS_FAMILIES.has(d.family) ? 349 : 299,
  }
}

export const DESIGNS: readonly ProcDesign[] = [
  define({
    id: "midnight-marble",
    name: "Midnight Marble",
    family: "marble",
    seed: 1101,
    badge: "bestseller",
    trendingRank: 2,
    palette: { base: "#14121F", a: "#EDE8F7", b: "#7A74A3", c: "#C9A86A", ink: "#050410" },
  }),
  define({
    id: "rose-quartz",
    name: "Rose Quartz",
    family: "marble",
    seed: 1102,
    trendingRank: 8,
    palette: { base: "#F6DDE3", a: "#C4718C", b: "#FFFFFF", c: "#F0B7C5", ink: "#8A4B5E" },
  }),
  define({
    id: "ink-and-gold",
    name: "Ink & Gold",
    family: "marble",
    seed: 1103,
    isNew: true,
    palette: { base: "#0E0E12", a: "#D4AF37", b: "#3B3A45", c: "#F2E6C8", ink: "#000000" },
  }),
  define({
    id: "sage-stone",
    name: "Sage Stone",
    family: "marble",
    seed: 1104,
    palette: { base: "#D9DED3", a: "#5F7A5C", b: "#FFFFFF", c: "#B8C2B0", ink: "#4C5A4A" },
  }),
  define({
    id: "holo-shift",
    name: "Holo Shift",
    family: "holo",
    seed: 2201,
    holo: true,
    badge: "bestseller",
    trendingRank: 1,
    palette: { base: "#C9CBD6", a: "#F5F6FA", b: "#B9BCD0", c: "#FFFFFF", ink: "#7A7E96" },
  }),
  define({
    id: "chrome-candy",
    name: "Chrome Candy",
    family: "holo",
    seed: 2202,
    holo: true,
    isNew: true,
    palette: { base: "#E6D5E8", a: "#FFFFFF", b: "#F2B8E0", c: "#FFF0F7", ink: "#8B6F9E" },
  }),
  define({
    id: "prism-pop",
    name: "Prism Pop",
    family: "holo",
    seed: 2203,
    holo: true,
    palette: { base: "#D7DBE8", a: "#FFFFFF", b: "#CFD6F2", c: "#FFFFFF", ink: "#6D74A0" },
  }),
  define({
    id: "oil-slick",
    name: "Oil Slick",
    family: "holo",
    seed: 2204,
    holo: true,
    badge: "limited",
    palette: { base: "#16181F", a: "#3A3F57", b: "#0F1016", c: "#5A6080", ink: "#05060A" },
  }),
  define({
    id: "aurora-night",
    name: "Aurora Night",
    family: "aurora",
    seed: 3301,
    trendingRank: 4,
    palette: { base: "#060814", a: "#7B3FE4", b: "#19B5A7", c: "#FF5FA2", ink: "#2A2B8F" },
  }),
  define({
    id: "northern-haze",
    name: "Northern Haze",
    family: "aurora",
    seed: 3302,
    isNew: true,
    palette: { base: "#070B16", a: "#3FBF9A", b: "#2E8BC0", c: "#A8E6CF", ink: "#233A8C" },
  }),
  define({
    id: "deep-nebula",
    name: "Deep Nebula",
    family: "aurora",
    seed: 3303,
    palette: { base: "#08040F", a: "#B23FE4", b: "#FF4F79", c: "#4F7CFF", ink: "#3A1F7A" },
  }),
  define({
    id: "checker-wave",
    name: "Checker Wave",
    family: "y2k",
    seed: 4401,
    trendingRank: 5,
    palette: { base: "#FFFFFF", a: "#141320", b: "#FFFFFF", c: "#8B7CFF", ink: "#141320" },
  }),
  define({
    id: "candy-grid",
    name: "Candy Grid",
    family: "y2k",
    seed: 4402,
    isNew: true,
    palette: { base: "#FFF0F6", a: "#FF9ED2", b: "#FFF4FA", c: "#9FD8FF", ink: "#B4467F" },
  }),
  define({
    id: "retro-tiles",
    name: "Retro Tiles",
    family: "y2k",
    seed: 4403,
    palette: { base: "#F3E3C9", a: "#E07A2F", b: "#F7E7CF", c: "#6B3F1F", ink: "#4A2A12" },
  }),
  define({
    id: "main-character",
    name: "Main Character",
    family: "quote",
    seed: 5501,
    quote: "main character",
    badge: "bestseller",
    trendingRank: 3,
    palette: { base: "#FFD6A5", a: "#FF6B3D", b: "#FFF1E0", c: "#8B7CFF", ink: "#1B1230" },
  }),
  define({
    id: "soft-launch",
    name: "Soft Launch",
    family: "quote",
    seed: 5502,
    quote: "soft launch",
    palette: { base: "#FCE1EC", a: "#F58FB6", b: "#FFF7FA", c: "#FFD66B", ink: "#3A1F33" },
  }),
  define({
    id: "no-thoughts",
    name: "No Thoughts",
    family: "quote",
    seed: 5503,
    quote: "no thoughts",
    isNew: true,
    palette: { base: "#DDEBFF", a: "#7FA7FF", b: "#FFFFFF", c: "#FF8FAB", ink: "#142247" },
  }),
  define({
    id: "chai-first",
    name: "Chai First",
    family: "quote",
    seed: 5504,
    quote: "chai first",
    trendingRank: 7,
    palette: { base: "#F1E3CF", a: "#B8743A", b: "#FFF8EC", c: "#4F8A5B", ink: "#3B2314" },
  }),
  define({
    id: "sticker-bomb",
    name: "Sticker Bomb",
    family: "sticker",
    seed: 6601,
    trendingRank: 6,
    palette: { base: "#BFE3FF", a: "#FF6B6B", b: "#FFD93D", c: "#6BCB77", ink: "#1A1A2E" },
  }),
  define({
    id: "smiley-days",
    name: "Smiley Days",
    family: "sticker",
    seed: 6602,
    palette: { base: "#FFF3B0", a: "#FFB800", b: "#FF7A59", c: "#7AC7FF", ink: "#2B2118" },
  }),
  define({
    id: "star-sign",
    name: "Star Sign",
    family: "sticker",
    seed: 6603,
    isNew: true,
    palette: { base: "#E6DAFF", a: "#8B7CFF", b: "#FFD66B", c: "#FFFFFF", ink: "#2A1F4F" },
  }),
  define({
    id: "less-is-more",
    name: "Less Is More",
    family: "minimal",
    seed: 7701,
    palette: { base: "#F6F1E8", a: "#E07A5F", b: "#D9D2C5", c: "#FFFFFF", ink: "#23201C" },
  }),
  define({
    id: "one-arc",
    name: "One Arc",
    family: "minimal",
    seed: 7702,
    badge: "limited",
    palette: { base: "#F3EEE6", a: "#2F4858", b: "#DCD5C9", c: "#FFFFFF", ink: "#1F1D1A" },
  }),
  define({
    id: "quiet-dot",
    name: "Quiet Dot",
    family: "minimal",
    seed: 7703,
    palette: { base: "#EFE9DF", a: "#4C6A92", b: "#D8D0C2", c: "#FFFFFF", ink: "#26231F" },
  }),
]

const BY_ID: ReadonlyMap<string, ProcDesign> = new Map(DESIGNS.map((d) => [d.id, d]))

export function getDesign(id: string): ProcDesign | undefined {
  return BY_ID.get(id)
}

export const CYCLE_ORDER: readonly string[] = [
  ...DESIGNS.filter((d) => d.trendingRank !== undefined).sort(
    (x, y) => (x.trendingRank ?? 0) - (y.trendingRank ?? 0)
  ),
  ...DESIGNS.filter((d) => d.trendingRank === undefined),
].map((d) => d.id)
