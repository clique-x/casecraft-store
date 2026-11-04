/**
 * Content and layout for the home hero. Plain data, so the slides, their shopping destinations and
 * the art can change without touching the component.
 *
 * Art: the phone and the earbuds are real shop photos lifted off their backdrops; the glass guard,
 * the glass orbit and the plinths are renders with no text or branding. All are produced by
 * scripts/hero-art (see its README) into public/home/.
 */

export type LayerId = 'phone' | 'buds' | 'guard';

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
  id: 'cases' | 'audio' | 'protection';
  /** Department name: indicators, counter announcements and the mobile panel line. */
  department: string;
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
    href: '/categories',
    hotspot: { label: 'Magnetic essentials', href: '/search?q=MagSafe', x: 53, y: 53 },
    sm: {
      phone: { x: 9, y: -6, s: 1, r: 20, z: 3 },
      buds: { x: -24, y: 25, s: 0.64, r: -8, z: 4 },
      guard: { x: 31, y: 22, s: 0.58, r: 14, z: 4 },
    },
    lg: {
      phone: { x: 3, y: -1, s: 1, r: 14, z: 3 },
      buds: { x: -22, y: -20, s: 0.58, r: -8, z: 2 },
      guard: { x: 29, y: 13, s: 0.62, r: 10, z: 2 },
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
    },
    lg: {
      phone: { x: 30, y: -9, s: 0.6, r: 18, z: 2 },
      buds: { x: 1, y: 3, s: 1, r: 0, z: 3 },
      guard: { x: -27, y: 9, s: 0.6, r: -12, z: 2 },
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
    },
    lg: {
      phone: { x: -27, y: -8, s: 0.58, r: -10, z: 2 },
      buds: { x: 28, y: 17, s: 0.58, r: 6, z: 2 },
      guard: { x: 3, y: -2, s: 1, r: 9, z: 3 },
    },
    orbit: { sm: -18, lg: -7 },
  },
];

const home = (name: string, widths: readonly number[]) => widths.map((w) => `/home/${name}-${w}.webp ${w}w`).join(', ');

export const PRODUCT_ART: readonly ShowcaseArt[] = [
  {
    id: 'phone',
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
    src: '/home/guard-640.webp',
    srcSet: home('guard', [320, 640]),
    sizes: '(min-width: 64rem) 240px, 190px',
    w: 640,
    h: 1195,
    width: { sm: 37, lg: 44 },
    depth: 18,
  },
];

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
