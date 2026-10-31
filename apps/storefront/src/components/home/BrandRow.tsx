import Link from 'next/link'
import { AccentBar } from '@/components/brand/AccentBar'
import { BrandOutline, brandSlug } from '@/components/phone-picker/BrandOutline'
import { Reveal } from '@/components/motion/Reveal.client'
import { WHATSAPP_NUMBER } from '@/lib/brand'
import type { PhoneModel } from '@/lib/medusa/fixtures'

interface BrandRowProps {
  brands: string[]
  models: PhoneModel[]
}

const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Hi! Do you have back covers for my phone?',
)}`

const PILL = 'inline-flex min-h-12 items-center gap-3 rounded-pill border border-border bg-surface px-4 text-sm'

export function BrandRow({ brands, models }: BrandRowProps) {
  return (
    <section
      id="brands"
      aria-labelledby="brands-heading"
      className="cv-auto scroll-mt-20 bg-paper py-14 text-fg lg:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 id="brands-heading" className="font-display text-h2 font-semibold text-heading text-balance">
            Shop by phone
          </h2>
          <AccentBar className="mt-4" />
        </Reveal>

        <ul className="mt-8 flex flex-wrap gap-3">
          {brands.map((brand, i) => {
            const list = models.filter((model) => model.brand === brand)
            const outline = list[0]?.islandStyle ?? 'square'
            return (
              <Reveal as="li" key={brand} delay={i * 0.04}>
                {list.length > 0 ? (
                  <Link
                    href={`/phones/${brandSlug(brand)}`}
                    className={`${PILL} text-fg transition-colors duration-(--dur-micro) outline-none hover:border-accent-2 hover:bg-surface-2 focus-visible:ring-3 focus-visible:ring-accent-2`}
                  >
                    <BrandOutline islandStyle={outline} className="text-accent-text" />
                    <span className="font-semibold">{brand}</span>
                    <span className="text-fg-muted tabular-nums">
                      · {list.length} {list.length === 1 ? 'model' : 'models'}
                    </span>
                  </Link>
                ) : (
                  <span className={`${PILL} text-fg-muted`} aria-disabled="true">
                    <BrandOutline islandStyle="square" />
                    <span className="font-semibold">{brand}</span>
                    <span>· coming soon</span>
                  </span>
                )}
              </Reveal>
            )
          })}
        </ul>

        <Reveal className="mt-6">
          <p className="text-body text-fg-muted">
            Don’t see your phone?{' '}
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm font-semibold text-accent-text underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-accent-2"
            >
              WhatsApp us
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
