import Link from 'next/link'
import { ArrowUpRightIcon } from 'lucide-react'
import { AccentBar } from '@/components/brand/AccentBar'
import { CaseCutout } from '@/components/home/hero/CaseCutout'
import { Reveal } from '@/components/motion/Reveal.client'
import { TiltCard } from '@/components/motion/TiltCard.client'
import { shotSrc, shotSrcSet, type PhotoEntry } from '@/lib/catalog/photos'
import type { LookWithCover } from '@/lib/catalog/looks'
import { cn } from '@/lib/utils'

const TILE_SIZES = '(max-width: 1024px) 46vw, 240px'

function LookPhoto({ cover }: { cover: PhotoEntry }) {
  if (!cover.shots) {
    return (
      <div className="absolute inset-x-[14%] top-[8%] bottom-0">
        <CaseCutout entry={cover} role="tile" sizes={TILE_SIZES} />
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer
    <img
      src={shotSrc(cover.id, 0)}
      srcSet={shotSrcSet(cover.id, 0)}
      sizes={TILE_SIZES}
      width={800}
      height={1000}
      alt=""
      decoding="async"
      loading="lazy"
      className="absolute inset-0 size-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out-expo motion-safe:group-hover/tile:scale-[1.05]"
    />
  )
}

/** Small stacked shots of the next covers in the look; nothing renders for looks with one cover. */
function LookThumbs({ others, className }: { others: PhotoEntry[]; className?: string }) {
  const shown = others.filter((e) => (e.shots ?? 0) > 0)
  if (shown.length === 0) return null
  return (
    <span aria-hidden="true" className={cn('flex -space-x-2.5', className)}>
      {shown.map((e) => (
        // eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer
        <img
          key={e.id}
          src={shotSrc(e.id, 0, 160)}
          width={160}
          height={200}
          alt=""
          decoding="async"
          loading="lazy"
          className="h-11 w-9 rounded-md object-cover shadow-md ring-2 ring-ink-2"
        />
      ))}
    </span>
  )
}

/**
 * Six looks. Phones: the look's lead cover fills a 4:5 frame with name and count below it. Desktop:
 * a studio-grey panel (name, blurb, other covers, count) beside the photo. No shade is laid over
 * the photo at any size, so the cover always reads as photographed.
 */
export function LookGrid({ looks }: { looks: LookWithCover[] }) {
  return (
    <section
      id="looks"
      aria-labelledby="looks-heading"
      className="cv-auto scroll-mt-20 bg-paper py-14 text-fg lg:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="looks-heading" className="font-display text-h2 font-extrabold text-heading text-balance">
              Shop by look
            </h2>
            <AccentBar className="mt-4" />
          </div>
          <p className="text-body text-fg-muted">Six looks. Every cover photographed in stock.</p>
        </Reveal>

        <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 lg:grid-cols-3 lg:gap-5">
          {looks.map(({ look, cover, others, count }, i) => {
            const countLabel = `${count} ${count === 1 ? 'cover' : 'covers'}`
            return (
              <Reveal as="li" key={look.handle} delay={i * 0.05}>
                <TiltCard maxDeg={0} pressScale={0.98} className="h-full">
                  <Link
                    href={`/categories/${look.handle}`}
                    className="group/tile flex h-full flex-col gap-3 rounded-card outline-none focus-visible:ring-3 focus-visible:ring-accent-2 lg:relative lg:aspect-[5/4] lg:flex-row lg:gap-0 lg:overflow-hidden lg:bg-ink-2 lg:shadow-lg lg:shadow-shadow/10"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card bg-ink-2 shadow-lg shadow-shadow/10 lg:order-2 lg:aspect-auto lg:w-auto lg:flex-1 lg:rounded-none lg:shadow-none">
                      <LookPhoto cover={cover} />
                      <div
                        aria-hidden="true"
                        className="absolute bottom-0 left-0 h-0.5 w-0 bg-brand-coral transition-[width] duration-500 ease-out-expo group-hover/tile:w-full"
                      />
                    </div>

                    <div className="relative flex min-w-0 items-center justify-between gap-2 px-0.5 lg:order-1 lg:w-[46%] lg:flex-col lg:items-start lg:justify-between lg:p-6 lg:text-fg-on-ink">
                      <div className="relative hidden items-center gap-3 lg:flex">
                        <LookThumbs others={others} />
                        <span className="text-caption font-semibold text-fg-on-ink-muted tabular-nums">{countLabel}</span>
                      </div>
                      <div className="relative min-w-0">
                        <h3 className="font-sans text-base leading-tight font-bold text-balance text-fg sm:text-lg lg:text-2xl lg:text-fg-on-ink">
                          {look.name}
                        </h3>
                        <p className="mt-0.5 text-caption text-fg-muted tabular-nums lg:hidden">{countLabel}</p>
                        <p className="mt-2 hidden text-sm text-fg-on-ink-muted lg:line-clamp-3">{look.blurb}</p>
                      </div>
                      <span className="relative flex shrink-0 items-center gap-2 text-sm font-semibold lg:text-fg-on-ink">
                        <span className="hidden lg:inline">Shop the look</span>
                        <span className="grid size-8 place-items-center rounded-pill bg-ink-2 text-fg-on-ink transition-colors duration-300 group-hover/tile:bg-accent group-hover/tile:text-on-accent lg:bg-fg-on-ink lg:text-ink lg:group-hover/tile:text-on-accent">
                          <ArrowUpRightIcon aria-hidden="true" className="size-4 transition-transform duration-300 group-hover/tile:rotate-45" />
                        </span>
                      </span>
                    </div>
                  </Link>
                </TiltCard>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
