'use client'

import Link from 'next/link'
import { ArrowUpRightIcon, CheckIcon } from 'lucide-react'
import { CaseCutout } from '@/components/home/hero/CaseCutout'
import { TiltCard } from '@/components/motion/TiltCard.client'
import { Badge } from '@/components/ui/badge'
import { formatInr, photoAlt, shotSrc, shotSrcSet, type PhotoEntry } from '@/lib/catalog/photos'
import type { PhotoProduct } from '@/lib/medusa/fixtures'
import { useMyPhone } from '@/lib/phone/use-my-phone'
import { cn } from '@/lib/utils'

const FEW_LEFT_AT = 3
const MOST_ORDERED_TO = 3
const DEFAULT_STOCK = 8
export const CARD_SIZES = '(max-width: 640px) 41vw, (max-width: 1024px) 31vw, 240px'

function FitsPhoto({ entry }: { entry: PhotoEntry }) {
  const { phone } = useMyPhone()
  const mine = phone !== null && entry.modelSlugs.includes(phone.slug) ? phone : null
  return (
    <p
      className={cn(
        'flex min-h-5 items-center gap-1 text-caption tabular-nums',
        mine ? 'font-medium text-accent-text' : 'text-fg-muted',
      )}
    >
      {mine && <CheckIcon className="size-3.5 shrink-0" aria-hidden="true" />}
      <span className="truncate">{mine ? `Fits ${mine.model}` : `For ${entry.modelLabel}`}</span>
    </p>
  )
}

interface PhotoCardProps {
  product: PhotoProduct
  /** Trending rank; 1–3 render a numeral on the photo. */
  rank?: number
  priority?: boolean
  className?: string
  /** `tint` sits on a Teal Tint band; kept for callers, the photo fills the frame either way. */
  surface?: 'paper' | 'tint'
  /** Show the "New" badge (new-arrivals rail). */
  newBadge?: boolean
  /** The rail's centre card on phones: it settles, then turns to the second angle. */
  centre?: boolean
  sizes?: string
}

/**
 * Shop-shot product card: the real hand-held photo fills a 4:5 frame, a second angle fades in on
 * hover (or after the card settles in the centre of a touch rail), and the dots say which angle is
 * showing. Products without shots fall back to the cutout standing in the frame.
 */
export function PhotoCard({
  product,
  rank,
  priority = false,
  className,
  newBadge = false,
  centre = false,
  sizes = CARD_SIZES,
}: PhotoCardProps) {
  const { photo } = product
  const shots = photo.shots ?? 0
  const hasAlt = shots > 1

  const showRank = rank !== undefined && rank >= 1 && rank <= 3
  const stock = product.stock ?? photo.stock ?? DEFAULT_STOCK
  const badge =
    stock <= FEW_LEFT_AT
      ? 'Few left'
      : product.trendingRank !== undefined && product.trendingRank <= MOST_ORDERED_TO
        ? 'Most ordered'
        : newBadge && product.isNew
          ? 'New'
          : null
  const struck = photo.regularInr > photo.priceInr

  return (
    <div data-centre={centre ? '' : undefined} className={cn('group/card h-full', className)}>
      <TiltCard maxDeg={5} pressScale={0.98} className="h-full">
        <Link
          href={`/products/${photo.slug}`}
          className="flex h-full flex-col gap-3 rounded-card outline-none focus-visible:ring-3 focus-visible:ring-accent-2"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card bg-ink-2 shadow-lg shadow-shadow/10 ring-1 ring-fg/10 ring-inset">
            {shots > 0 ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer */}
                <img
                  src={shotSrc(photo.id, 0)}
                  srcSet={shotSrcSet(photo.id, 0)}
                  sizes={sizes}
                  width={800}
                  height={1000}
                  alt={photoAlt(photo)}
                  decoding="async"
                  loading={priority ? 'eager' : 'lazy'}
                  fetchPriority={priority ? 'high' : 'auto'}
                  className="absolute inset-0 size-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out-expo motion-safe:group-hover/card:scale-[1.05]"
                />
                {hasAlt && (
                  // eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer
                  <img
                    src={shotSrc(photo.id, 1)}
                    srcSet={shotSrcSet(photo.id, 1)}
                    sizes={sizes}
                    width={800}
                    height={1000}
                    alt=""
                    aria-hidden="true"
                    decoding="async"
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 ease-out-expo group-hover/card:opacity-100 in-data-centre:opacity-100 in-data-centre:delay-700"
                  />
                )}
              </>
            ) : (
              <div className="absolute inset-x-[14%] top-[8%] bottom-0">
                <CaseCutout entry={photo} role="card" sizes={sizes} priority={priority} />
              </div>
            )}

            <div
              aria-hidden="true"
              className="absolute bottom-0 left-0 h-0.5 w-0 bg-brand-coral transition-[width] duration-500 ease-out-expo group-hover/card:w-full in-data-centre:w-full"
            />

            {showRank && (
              <span className="absolute top-2.5 left-2.5 grid h-8 min-w-8 place-items-center rounded-pill bg-ink-2/85 px-2 font-sans text-lg leading-none font-extrabold text-fg-on-ink tabular-nums backdrop-blur-sm">
                <span className="sr-only">Trending rank </span>
                {rank}
              </span>
            )}
            {badge && (
              <Badge
                className={cn(
                  'absolute top-2.5 right-2.5 h-6 border-transparent px-2.5 text-caption font-semibold',
                  badge === 'New' ? 'bg-accent-2 text-on-accent' : 'bg-highlight text-fg',
                  // Narrow phone cards: the rank numeral already says it, and both won't fit.
                  badge === 'Most ordered' && showRank && 'max-sm:hidden',
                )}
              >
                {badge}
              </Badge>
            )}

            <div aria-hidden="true" className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
              {hasAlt ? (
                <span className="mb-1 flex items-center gap-1 rounded-pill bg-ink/35 px-1.5 py-1 backdrop-blur-sm">
                  <span className="h-1.5 w-4 rounded-pill bg-fg-on-ink transition-all duration-300 group-hover/card:w-1.5 group-hover/card:bg-fg-on-ink/50 in-data-centre:w-1.5 in-data-centre:bg-fg-on-ink/50 in-data-centre:delay-700" />
                  <span className="h-1.5 w-1.5 rounded-pill bg-fg-on-ink/50 transition-all duration-300 group-hover/card:w-4 group-hover/card:bg-fg-on-ink in-data-centre:w-4 in-data-centre:bg-fg-on-ink in-data-centre:delay-700" />
                </span>
              ) : (
                <span />
              )}
              <span className="grid size-9 place-items-center rounded-pill bg-fg-on-ink text-ink shadow-md transition-colors duration-300 group-hover/card:bg-accent group-hover/card:text-on-accent">
                <ArrowUpRightIcon className="size-4 transition-transform duration-300 group-hover/card:rotate-45" />
              </span>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-1 px-0.5">
            <p className="truncate text-label font-bold tracking-[0.2em] text-accent-text uppercase">
              {photo.brand} · {photo.series}
            </p>
            <h3 className="truncate font-sans text-base leading-tight font-bold text-fg">{photo.design}</h3>
            <p className="flex items-baseline gap-2 tabular-nums">
              <span className="text-lg leading-none font-bold text-fg">{formatInr(photo.priceInr)}</span>
              {struck && <s className="text-caption text-fg-muted">{formatInr(photo.regularInr)}</s>}
            </p>
            <FitsPhoto entry={photo} />
          </div>
        </Link>
      </TiltCard>
    </div>
  )
}
