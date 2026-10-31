import { Marquee } from '@/components/motion/Marquee'
import { CASE_BRANDS, SHOP_CITY } from '@/lib/brand'

const FACTS: readonly string[] = [`Shot in our ${SHOP_CITY} shop`, 'UPI · cards · Cash on Delivery', 'Real stock, real photos']

/**
 * Two counter-running marquees: the case brands we stock and three shop facts, as plain text with
 * coral dot separators; no logos, no links. Server-rendered, pauses on hover.
 */
export function BrandStrip() {
  return (
    <section aria-labelledby="brand-strip-heading" className="overflow-hidden border-y border-border bg-paper py-5 text-fg">
      <h2 id="brand-strip-heading" className="sr-only">
        Brands we stock
      </h2>
      <Marquee duration={36} gap="2.5rem" label="Brands we stock">
        {CASE_BRANDS.map((brand) => (
          <span key={brand} className="inline-flex items-center gap-10 font-sans text-xl font-extrabold tracking-[-0.02em] whitespace-nowrap text-heading sm:text-2xl">
            {brand}
            <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
          </span>
        ))}
      </Marquee>
      <Marquee duration={48} gap="2.5rem" reverse className="mt-3" label="Shop facts">
        {FACTS.map((fact) => (
          <span key={fact} className="inline-flex items-center gap-10 font-sans text-sm font-semibold tracking-[0.12em] whitespace-nowrap text-fg-muted uppercase">
            {fact}
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent-2" />
          </span>
        ))}
      </Marquee>
    </section>
  )
}
