/**
 * Content and layout for the home hero. Plain data, so the slides, their shopping destinations and
 * the art can change without touching the component.
 *
 * Art: the phone, the earbuds and the laptop are real shop photos lifted off their backdrops; the glass guard,
 * the glass orbit and the plinths are renders with no text or branding. All are produced by
 * scripts/hero-art (see its README) into public/home/.
 */

export type LayerId = 'phone' | 'buds' | 'guard' | 'laptop';

/** Where one product sits in a slide: offset from the stage centre (x in cqw, y in cqh), scale, roll (deg), stacking. */
export interface Pose {
  x: number;
  y: number;
  s: number;
  r: number;
  z: number;
}

export type Poses = Record<LayerId, Pose>;

export interface ShowcaseSlide {
  id: 'cases' | 'audio' | 'protection' | 'computer';
  /** Department name: indicators, counter announcements and the mobile panel line. */
  department: string;
  /** A shorter name for the mobile panel line, where four names share one row. */
  short?: string;
  /** Mobile panel title. */
  edit: string;
  /** Department page for "Explore the collection". */
  href: string;
  /** The small shopping label next to the featured product (desktop). */
  hotspot: { label: string; href: string; x: number; y: number };
  /** Product poses on phones (sm) and from lg. */
  sm: Poses;
  lg: Poses;
  /** Roll of the glass orbit in this slide, in degrees. */
  orbit: { sm: number; lg: number };
}

export interface ShowcaseArt {
  id: LayerId;
  src: string;
  srcSet: string;
  sizes: string;
  w: number;
  h: number;
  /** Width at full scale, in cqh of the stage. */
  width: { sm: number; lg: number };
  /** Pointer parallax travel in px (desktop). */
  depth: number;
  /** The listing of everything in this product's department, opened by clicking the product. */
  href: string;
  /** Accessible name for that link. */
  label: string;
  /** What the image shows, for search engines (the art is hidden from screen readers; `label` names the link). */
  alt: string;
}

export interface SceneArt {
  src: string;
  srcSet: string;
  sizes: string;
  w: number;
  h: number;
}

export const SLIDES: readonly ShowcaseSlide[] = [
  {
    id: 'cases',
    department: 'Cases',
    edit: 'The magnetic edit',
    href: '/covers',
    hotspot: { label: 'Magnetic essentials', href: '/search?q=MagSafe', x: 53, y: 53 },
    sm: {
      phone: { x: 9, y: -6, s: 1, r: 20, z: 3 },
      buds: { x: -24, y: 25, s: 0.64, r: -8, z: 4 },
      guard: { x: 31, y: 22, s: 0.58, r: 14, z: 4 },
      laptop: { x: -26, y: -22, s: 0.46, r: -4, z: 1 },
    },
    lg: {
      phone: { x: 3, y: -1, s: 1, r: 14, z: 3 },
      buds: { x: -22, y: -20, s: 0.58, r: -8, z: 2 },
      guard: { x: 29, y: 13, s: 0.62, r: 10, z: 2 },
      laptop: { x: -27, y: 19, s: 0.5, r: -3, z: 1 },
    },
    orbit: { sm: -14, lg: -3 },
  },
  {
    id: 'audio',
    department: 'Audio',
    edit: 'The sound edit',
    href: '/audio',
    hotspot: { label: 'Hi-Res earbuds', href: '/products/boat-airdopes-prime-800-hidef', x: 50, y: 46 },
    sm: {
      phone: { x: 31, y: -17, s: 0.56, r: 24, z: 2 },
      buds: { x: 1, y: 6, s: 1, r: 0, z: 3 },
      guard: { x: -31, y: -12, s: 0.56, r: -14, z: 2 },
      laptop: { x: 25, y: 27, s: 0.42, r: 3, z: 4 },
    },
    lg: {
      phone: { x: 30, y: -9, s: 0.6, r: 18, z: 2 },
      buds: { x: 1, y: 3, s: 1, r: 0, z: 3 },
      guard: { x: -27, y: 9, s: 0.6, r: -12, z: 2 },
      laptop: { x: -27, y: -20, s: 0.44, r: -4, z: 1 },
    },
    orbit: { sm: -6, lg: 3 },
  },
  {
    id: 'protection',
    department: 'Protection',
    edit: 'The glass edit',
    href: '/accessories',
    hotspot: { label: 'Edge-to-edge glass', href: '/products/tempered-glass-screen-guard', x: 51, y: 50 },
    sm: {
      phone: { x: -30, y: 19, s: 0.5, r: -16, z: 4 },
      buds: { x: 29, y: 26, s: 0.5, r: 6, z: 4 },
      guard: { x: 6, y: -4, s: 1, r: 10, z: 3 },
      laptop: { x: 27, y: -22, s: 0.4, r: 4, z: 1 },
    },
    lg: {
      phone: { x: -27, y: -8, s: 0.58, r: -10, z: 2 },
      buds: { x: 28, y: 17, s: 0.58, r: 6, z: 2 },
      guard: { x: 3, y: -2, s: 1, r: 9, z: 3 },
      laptop: { x: 29, y: -20, s: 0.44, r: 3, z: 1 },
    },
    orbit: { sm: -18, lg: -7 },
  },
  {
    id: 'computer',
    department: 'Computer accessories',
    short: 'PC',
    edit: 'The desk edit',
    href: '/computer-accessories',
    hotspot: { label: 'Gaming mice & keyboards', href: '/computer-accessories', x: 50, y: 52 },
    sm: {
      phone: { x: 33, y: -20, s: 0.42, r: 18, z: 2 },
      buds: { x: -28, y: 25, s: 0.48, r: -6, z: 4 },
      guard: { x: -32, y: -20, s: 0.42, r: -14, z: 2 },
      laptop: { x: 2, y: 2, s: 1, r: 0, z: 3 },
    },
    lg: {
      phone: { x: 31, y: -10, s: 0.5, r: 16, z: 2 },
      buds: { x: -29, y: 15, s: 0.5, r: -6, z: 4 },
      guard: { x: -28, y: -15, s: 0.44, r: -12, z: 2 },
      laptop: { x: 2, y: 3, s: 1, r: 0, z: 3 },
    },
    orbit: { sm: -10, lg: 2 },
  },
];

const home = (name: string, widths: readonly number[]) => widths.map((w) => `/home/${name}-${w}.webp ${w}w`).join(', ');

export const PRODUCT_ART: readonly ShowcaseArt[] = [
  {
    id: 'phone',
    href: '/covers',
    label: 'Shop all covers',
    alt: 'Phone in a black MagSafe back cover from GadgetsHub',
    // CaseCraft Silicone MagSafe, black, on an iPhone 15 Pro (photo 50113, "On the phone").
    src: '/home/phone-magsafe-560.webp',
    srcSet: home('phone-magsafe', [320, 560]),
    sizes: '(min-width: 64rem) 250px, 190px',
    w: 560,
    h: 1042,
    width: { sm: 37, lg: 46 },
    depth: 22,
  },
  {
    id: 'buds',
    href: '/audio',
    label: 'Shop all earbuds and neckbands',
    alt: 'boAt Airdopes Prime 800 HiDef wireless earbuds and charging case',
    // boAt Airdopes Prime 800 HiDef, the shop's own cutout (public/products/photos/gadgets).
    src: '/products/photos/gadgets/boat-800-hidef/cut-960.webp',
    srcSet: '/products/photos/gadgets/boat-800-hidef/cut-480.webp 480w, /products/photos/gadgets/boat-800-hidef/cut-960.webp 960w',
    sizes: '(min-width: 64rem) 340px, 290px',
    w: 960,
    h: 933,
    width: { sm: 58, lg: 62 },
    depth: 14,
  },
  {
    id: 'guard',
    href: '/accessories',
    label: 'Shop all screen guards',
    alt: 'Tempered glass screen guard for a phone',
    src: '/home/guard-640.webp',
    srcSet: home('guard', [320, 640]),
    sizes: '(min-width: 64rem) 240px, 190px',
    w: 640,
    h: 1195,
    width: { sm: 37, lg: 44 },
    depth: 18,
  },
];

/** Laptops are not listed yet: the laptop opens the computer accessories until they are. */
export const LAPTOP_ART: ShowcaseArt = {
  id: 'laptop',
  href: '/computer-accessories',
  label: 'Shop computer accessories',
  alt: 'Dell Latitude 5400 laptop, open, seen from the front left',
  // The shop's Dell Latitude 5400, from the owner's three-quarter creative, lifted off its backdrop (catalog-sources/batch-2026-11-17).
  src: '/home/laptop-latitude-1034.webp',
  srcSet: home('laptop-latitude', [520, 1034]),
  sizes: '(min-width: 64rem) 380px, 300px',
  w: 1034,
  h: 831,
  width: { sm: 74, lg: 76 },
  depth: 10,
};

/** Every product in the scene; the laptop first, so at equal stacking it sits behind the others. */
export const SCENE_ART: readonly ShowcaseArt[] = [LAPTOP_ART, ...PRODUCT_ART];

export const ORBIT: SceneArt = {
  src: '/home/orbit-1500.webp',
  srcSet: home('orbit', [760, 1500]),
  sizes: '(min-width: 64rem) 62vw, 150vw',
  w: 1500,
  h: 807,
};

export const PLINTH: SceneArt = {
  src: '/home/plinth-1000.webp',
  srcSet: home('plinth', [560, 1000]),
  sizes: '(min-width: 64rem) 44vw, 110vw',
  w: 1000,
  h: 390,
};
