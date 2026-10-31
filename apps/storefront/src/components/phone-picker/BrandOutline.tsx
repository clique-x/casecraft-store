import type { ProcDesign } from '@/lib/designs/catalog'
import { designCss } from '@/lib/designs/design-css'
import type { PhoneModel } from '@/lib/medusa/fixtures'
import { cn } from '@/lib/utils'

export type IslandStyle = PhoneModel['islandStyle']

export function brandSlug(brand: string): string {
  return brand
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function phoneHref(model: Pick<PhoneModel, 'brand' | 'slug'>): string {
  return `/phones/${brandSlug(model.brand)}/${model.slug}`
}

interface BrandOutlineProps {
  islandStyle: IslandStyle
  className?: string
  size?: number
}

/** 20 px generic phone outline; abstract camera layout, no brand likeness. */
export function BrandOutline({ islandStyle, className, size = 20 }: BrandOutlineProps) {
  return (
    <svg
      viewBox="0 0 12 22"
      width={(size * 12) / 22}
      height={size}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
    >
      <rect x="0.6" y="0.6" width="10.8" height="20.8" rx="2.2" />
      {islandStyle === 'square' && <rect x="2.2" y="2.2" width="3.8" height="3.8" rx="1.1" />}
      {islandStyle === 'pills' && <rect x="2.2" y="2.2" width="2.2" height="5.4" rx="1.1" />}
      {islandStyle === 'circle' && <circle cx="6" cy="4.8" r="2" />}
    </svg>
  )
}

const LENS = 'rounded-full bg-lens ring-1 ring-metal/50'

function Island({ style }: { style: IslandStyle }) {
  if (style === 'circle') {
    return (
      <div
        aria-hidden="true"
        className="absolute top-[4.5%] left-1/2 flex aspect-square w-[42%] -translate-x-1/2 items-center justify-center rounded-full bg-island"
      >
        <div className={cn(LENS, 'aspect-square w-[46%]')} />
      </div>
    )
  }
  if (style === 'pills') {
    return (
      <div
        aria-hidden="true"
        className="absolute top-[4.5%] left-[8%] flex aspect-[1/2.3] w-[20%] flex-col items-center justify-evenly rounded-full bg-island py-[10%]"
      >
        <div className={cn(LENS, 'aspect-square w-[62%]')} />
        <div className={cn(LENS, 'aspect-square w-[62%]')} />
      </div>
    )
  }
  return (
    <div
      aria-hidden="true"
      className="absolute top-[4.5%] left-[8%] grid aspect-square w-[36%] grid-cols-2 gap-[10%] rounded-[24%] bg-island p-[12%]"
    >
      <div className={cn(LENS, 'aspect-square')} />
      <div className="aspect-square" />
      <div className="aspect-square" />
      <div className={cn(LENS, 'aspect-square')} />
    </div>
  )
}

interface CaseArtProps {
  design: ProcDesign
  islandStyle?: IslandStyle
  /** Dark phone slab behind the case with a 6 px lip. */
  lip?: boolean
  className?: string
}

/** CSS case silhouette painted with the design's `designCss`; quote designs get a DOM span. */
export function CaseArt({ design, islandStyle = 'square', lip = false, className }: CaseArtProps) {
  return (
    <div className={cn('@container relative aspect-[74/152]', className)}>
      {lip && <div aria-hidden="true" className="absolute -inset-1.5 rounded-[16%_/_8%] bg-phone" />}
      <div
        className="absolute inset-0 overflow-hidden rounded-[14%_/_7%] shadow-[0_18px_40px_-18px_color-mix(in_srgb,var(--color-shadow)_25%,transparent)]"
        style={{ background: designCss(design) }}
      >
        {design.quote && (
          <span
            className="absolute inset-0 grid -rotate-8 place-items-center px-[8%] text-center font-display text-[18cqw] leading-none font-bold text-balance"
            style={{ color: design.palette.ink }}
          >
            {design.quote}
          </span>
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,color-mix(in_srgb,var(--color-fg-on-ink)_35%,transparent)_0%,transparent_45%)]"
        />
        <Island style={islandStyle} />
      </div>
    </div>
  )
}
