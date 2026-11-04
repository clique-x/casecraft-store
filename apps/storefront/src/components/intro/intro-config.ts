/**
 * The home page brand intro, in one place: timings, easing, colours, copy and asset paths.
 * The controller (intro-boot.ts) runs from the root layout's <head> before first paint; the overlay markup
 * (BrandIntro.client.tsx) and its stylesheet (intro.css) read the same values, so retiming the intro or
 * swapping the logo happens here and nowhere else.
 */

/** All times in milliseconds, measured from the moment the page starts loading. */
export const INTRO_TIMING = {
  /** Arrival: the light behind the composition fades up. */
  glowIn: 900,
  /** The orbital arc sweeps into view. */
  arcDelay: 100,
  arcDuration: 1050,
  /** "GadgetsHub" rises out of its mask; "Hub" follows a beat later. */
  wordDelay: 260,
  wordDuration: 760,
  hubLag: 80,
  /** The creator line and the logo. */
  creditDelay: 720,
  creditDuration: 560,
  logoDelay: 820,
  logoDuration: 620,
  /** Earliest moment the overlay may leave, once the hero image is ready: the choreography has finished. */
  minimum: 1450,
  /** With prefers-reduced-motion: a still composition that leaves as soon as the page is ready. */
  minimumReduced: 450,
  /** Overlay fade and lift on the way out. */
  exit: 560,
  /** The same exit after Skip intro or Escape. */
  exitSkip: 300,
  /** Hero headline, artwork and CTA after the overlay starts to leave. */
  revealDelays: [130, 220, 310] as const,
  revealDuration: 820,
  revealDelaysSkip: [40, 90, 140] as const,
  revealDurationSkip: 480,
  /** Still waiting for the hero image: show "Loading the store…" from here. */
  slowNotice: 2300,
  /** Never later than this, whatever has or has not loaded. */
  hardMaximum: 4000,
} as const;

/** Decelerating curves with no overshoot. */
export const INTRO_EASE = {
  /** Reveals: a long, gentle settle. */
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** The arc sweep. */
  sweep: 'cubic-bezier(0.33, 0, 0.12, 1)',
  /** The overlay leaving. */
  exit: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/** The hero's own palette (components/home/showcase/showcase.css). */
export const INTRO_COLOR = {
  night: '#001619',
  teal: '#00282c',
  ivory: '#f6f1e8',
  mint: '#a6f0dc',
  aqua: '38, 196, 178',
} as const;

export const INTRO_COPY = {
  /** A quiet credit: "by" beside the logo, which carries the name; the name shows in text only if the logo fails. */
  credit: 'by',
  creditName: 'EarthClique',
  slow: 'Loading the store…',
  skip: 'Skip intro',
} as const;

/** The supplied logo, trimmed of its empty black frame and lifted off its black to transparency by scripts/intro-logo/build.mjs. */
export const INTRO_LOGO = {
  src: '/brand/intro/earthclique-logo-alpha-736.webp',
  srcSet: '/brand/intro/earthclique-logo-alpha-368.webp 368w, /brand/intro/earthclique-logo-alpha-736.webp 736w',
  /** Matches the widest the logo is drawn in intro.css (9.75rem, never past 368 px). */
  sizes: '(min-width: 48rem) 156px, 120px',
  width: 736,
  height: 209,
} as const;

/** DOM hooks shared by the controller, the overlay and the hero. */
export const INTRO_DOM = {
  /** On <html> while the intro runs: "play", then "leave" (or "skip") while it fades out. */
  stateAttr: 'data-gh-intro',
  /** On <html> once the hero image is late, and when the logo could not load. */
  slowAttr: 'data-gh-intro-slow',
  noLogoAttr: 'data-gh-intro-nologo',
  overlayId: 'gh-intro',
  skipAttr: 'data-gh-intro-skip',
  statusAttr: 'data-gh-intro-status',
  logoAttr: 'data-gh-intro-logo',
  /** Images the intro waits for (bounded by hardMaximum): the hero's main product. */
  critical: 'img[data-intro-critical]',
  /** Hero elements that rise in as the overlay leaves: 1 headline, 2 artwork, 3 call to action. */
  revealAttr: 'data-intro-reveal',
} as const;

/** Played once per browser-tab session, on the home page only. */
export const INTRO_SESSION_KEY = 'gh:intro-seen';
export const INTRO_PATH = '/';
/** Highest z-index on the site is 100 (skip link); the curtain and overlay sit above everything. */
export const INTRO_Z = 200;
