import Link from 'next/link'
import { ArrowRightIcon } from 'lucide-react'
import { AccentBar } from '@/components/brand/AccentBar'
import { RowHeaderForPhone } from '@/components/home/RowHeaderForPhone.client'
import { TrendingRail } from '@/components/home/TrendingRail.client'
import { Reveal } from '@/components/motion/Reveal.client'
import type { HomeProduct } from '@/lib/medusa/fixtures'

interface TrendingRowProps {
  products: HomeProduct[]
}

export function TrendingRow({ products }: TrendingRowProps) {
  return (
    <section id="trending" aria-labelledby="trending-heading" className="scroll-mt-20 bg-paper py-14 text-fg lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="flex items-end justify-between gap-4">
          <div>
            <h2 id="trending-heading" className="font-display text-h2 font-semibold text-heading text-balance">
              Trending this week
              <RowHeaderForPhone products={products} />
            </h2>
            <AccentBar className="mt-4" />
          </div>
          <Link
            href="/trending"
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-pill px-2 text-sm font-semibold text-accent-text underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-accent-2"
          >
            View all
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </Reveal>

        <TrendingRail products={products} label="Trending covers" />
      </div>
    </section>
  )
}
