import { Manrope, Unbounded } from 'next/font/google';

// Only the procedural "quote" cover artwork draws with Unbounded (lib/designs/painters/quote.ts); the UI uses Manrope.
export const unbounded = Unbounded({
  weight: ['600'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  adjustFontFallback: true,
  variable: '--font-unbounded',
});

// Variable 200–800: body, labels, buttons, wordmark, card titles and prices.
export const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  variable: '--font-manrope',
});

// next/font renames the family; this is the value canvas `ctx.font` and
// `document.fonts.load()` must use for the display face.
export const DISPLAY_FAMILY = unbounded.style.fontFamily;
