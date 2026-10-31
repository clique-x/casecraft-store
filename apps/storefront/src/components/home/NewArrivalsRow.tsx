import Link from 'next/link'
import { ArrowRightIcon } from 'lucide-react'
import { AccentBar } from '@/components/brand/AccentBar'
import { TrendingRail } from '@/components/home/TrendingRail.client'
import { Reveal } from '@/components/motion/Reveal.client'
import type { HomeProduct, PhoneModel } from '@/lib/medusa/fixtures'

interface NewArrivalsRowProps {
  products: HomeProduct[]
  models: PhoneModel[]
}

/** Second shelf on a Teal Tint band; same cards, 15 % narrower. */
export function NewArrivalsRow({ products }: NewArrivalsRowProps) {
  const items = products.filter((p) => p.isNew).slice(0, 6)
  if (items.length === 0) return null

  return (
    <section
      id="new"
      aria-labelledby="new-heading"
      className="cv-auto scroll-mt-20 bg-surface-2 py-14 text-fg lg:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="flex items-end justify-between gap-4">
          <div>
            <h2 id="new-heading" className="font-display text-h2 font-extrabold text-heading text-balance">
              New this week
            </h2>
            <AccentBar className="mt-4" />
          </div>
          <Link
            href="/collections/new"
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-pill px-2 text-sm font-semibold text-accent-text underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-accent-2"
          >
            View all
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </Reveal>

        <TrendingRail products={items} label="New covers" variant="new" filterForPhone={false} ranked={false} surface="tint" />
      </div>
    </section>
  )
}
