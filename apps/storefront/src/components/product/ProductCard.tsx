import Link from 'next/link'
import { AccessoryCard } from '@/components/accessory/AccessoryCard'
import { AudioCard } from '@/components/audio/AudioCard'
import { TiltCard } from '@/components/motion/TiltCard.client'
import { FitsLine } from '@/components/product/FitsLine.client'
import { PhotoCard } from '@/components/product/PhotoCard'
import { ProcCaseThumb } from '@/components/product/ProcCaseThumb'
import { Badge } from '@/components/ui/badge'
import { formatInr } from '@/lib/catalog/photos'
import { getDesign } from '@/lib/designs/catalog'
import { hasPhoto, type HomeProduct } from '@/lib/medusa/fixtures'
import { cn } from '@/lib/utils'

const BADGE_LABEL: Record<NonNullable<HomeProduct['badge']>, string> = {
  bestseller: 'Most ordered',
  limited: 'Few left',
}

interface ProductCardProps {
  product: HomeProduct
  /** Trending rank; 1–3 render a numeral on the thumb. */
  rank?: number
  modelCount?: number
  priority?: boolean
  className?: string
}

/** Photo products render the photographed card; procedural designs keep the CSS thumb. */
export function ProductCard({ product, rank, modelCount, priority, className }: ProductCardProps) {
  if (product.audio) {
    return <AudioCard product={product} className={className} />
  }
  if (product.accessory) {
    return <AccessoryCard product={product} className={className} />
  }
  if (hasPhoto(product)) {
    return <PhotoCard product={product} rank={rank} priority={priority} className={className} />
  }

  const design = getDesign(product.designId)
  const showRank = rank !== undefined && rank >= 1 && rank <= 3

  return (
    <TiltCard className={cn('h-full', className)}>
      <Link
        href={`/products/${product.handle}`}
        className="group/card flex h-full flex-col gap-3 rounded-card outline-none focus-visible:ring-3 focus-visible:ring-accent-2"
      >
        <div className="relative aspect-[1/2] w-full">
          {design ? (
            <ProcCaseThumb
              design={design}
              className="h-full w-full transition-transform duration-300 ease-out-expo group-hover/card:-translate-y-1"
            />
          ) : (
            <div aria-hidden="true" className="h-full w-full rounded-[14%_/_7%] bg-surface-2" />
          )}
          {showRank && (
            <span className="absolute bottom-2 left-2 grid h-8 min-w-8 place-items-center rounded-pill bg-ink-2 px-2 font-sans text-lg leading-none font-extrabold text-fg-on-ink tabular-nums">
              <span className="sr-only">Trending rank </span>
              {rank}
            </span>
          )}
          {product.badge && (
            <Badge className="absolute top-2 right-2 h-6 border-transparent bg-highlight px-2.5 text-caption font-semibold text-fg">
              {BADGE_LABEL[product.badge]}
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-1 px-0.5">
          <h3 className="truncate font-sans text-base leading-tight font-bold text-fg">{product.title}</h3>
          <p className="text-body text-fg-muted tabular-nums">
            from <span className="font-bold text-fg">{formatInr(product.priceFromInr)}</span>
          </p>
          <FitsLine fitsModels={product.fitsModels} modelCount={modelCount} />
        </div>
      </Link>
    </TiltCard>
  )
}
