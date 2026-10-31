import { EARTHCLIQUE_MARK_DARK, PARENT_BRAND } from '@/lib/brand';

/**
 * The EarthClique mark exactly as supplied: 32×32, no filter, transform or opacity, used once
 * in the footer line "An EarthClique product". A plain <img> keeps the SVG untouched.
 */
export function EarthCliqueMark() {
  // eslint-disable-next-line @next/next/no-img-element -- the brand SVG must ship as supplied, not through the image optimizer
  return <img src={EARTHCLIQUE_MARK_DARK} width={32} height={32} alt={PARENT_BRAND} decoding="async" loading="lazy" />;
}

export default EarthCliqueMark;
