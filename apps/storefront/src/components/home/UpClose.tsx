import { AccentBar } from '@/components/brand/AccentBar'
import { UpCloseStage } from '@/components/home/UpCloseStage.client'
import { Reveal } from '@/components/motion/Reveal.client'
import { SHOP_CITY } from '@/lib/brand'
import type { PhotoEntry } from '@/lib/catalog/photos'

/** Proof band: the hero's featured cover, large, with its callouts; synced to `featuredStore` on the client. */
export function UpClose({ initial }: { initial: PhotoEntry }) {
  return (
    <section id="up-close" aria-labelledby="up-close-heading" className="scroll-mt-20 bg-paper py-14 text-fg lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <UpCloseStage
          initial={initial}
          header={
            <Reveal className="flex flex-col items-start">
              <p className="text-label font-bold tracking-[0.2em] text-accent-text uppercase">
                Shot in our {SHOP_CITY} shop
              </p>
              <h2 id="up-close-heading" className="mt-3 font-display text-h2 font-extrabold text-heading text-balance">
                What you see is what ships.
              </h2>
              <AccentBar className="mt-4" />
              <p className="mt-5 max-w-xl text-body leading-relaxed text-fg">
                Every cover here is one we hold in stock, photographed in {SHOP_CITY}. No renders, no catalogue art.
              </p>
            </Reveal>
          }
        />
      </div>
    </section>
  )
}
