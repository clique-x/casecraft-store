'use client'

import { useEffect, useRef, useState } from 'react'
import { ScrollRail } from '@/components/listing/ScrollRail.client'
import { PhotoCard } from '@/components/product/PhotoCard'
import { useFinePointer } from '@/lib/device/use-fine-pointer'
import type { HomeProduct, PhotoProduct } from '@/lib/medusa/fixtures'
import { selectForPhone } from '@/lib/phone/select-for-phone'
import { useMyPhone } from '@/lib/phone/use-my-phone'
import { cn } from '@/lib/utils'

const MAX_ITEMS = 8
const NEW_SIZES = '(max-width: 640px) 35vw, (max-width: 1024px) 26vw, 200px'

const WIDTH = {
  trending: 'w-[41%] sm:w-[31%] lg:w-[calc((100%-4*1.25rem)/5)]',
  // 15 % narrower: the second shelf reads as a different row.
  new: 'w-[35%] sm:w-[26%] lg:w-[calc((100%-5*1.25rem)/6)]',
} as const

interface TrendingRailProps {
  products: HomeProduct[]
  label: string
  variant?: keyof typeof WIDTH
  /** Narrow to covers that fit `my_phone` (≥ 3 matches), matching the row header. */
  filterForPhone?: boolean
  /** Show rank numerals 1–3 and the "Most ordered" badge. */
  ranked?: boolean
  surface?: 'paper' | 'tint'
}

/** Scroll-snap rail of photo cards; on touch the card nearest the rail's centre lifts and sheens. */
export function TrendingRail({
  products,
  label,
  variant = 'trending',
  filterForPhone = true,
  ranked = true,
  surface = 'paper',
}: TrendingRailProps) {
  const { phone } = useMyPhone()
  const fine = useFinePointer()
  const listRef = useRef<HTMLUListElement>(null)
  const [centreId, setCentreId] = useState<string | null>(null)

  // Photo products only: the procedural card would pull the design atlas into the home route.
  // Local guard: a value import from fixtures would drag the whole catalogue into the client graph.
  const source = filterForPhone ? selectForPhone(products, phone?.slug ?? null).items : products
  const items = source.filter((p): p is PhotoProduct => p.photo !== undefined).slice(0, MAX_ITEMS)
  const itemsKey = items.map((p) => p.id).join(',')

  useEffect(() => {
    const list = listRef.current
    if (!list || fine) {
      setCentreId(null)
      return
    }
    const ratios = new Map<Element, number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0)
        let nearest: Element | null = null
        let nearestRatio = 0
        for (const [el, ratio] of ratios) {
          if (ratio > nearestRatio) {
            nearest = el
            nearestRatio = ratio
          }
        }
        setCentreId(nearest instanceof HTMLElement ? (nearest.dataset.productId ?? null) : null)
      },
      { root: list, rootMargin: '0px -38% 0px -38%', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    for (const li of list.querySelectorAll<HTMLElement>('[data-product-id]')) io.observe(li)
    return () => io.disconnect()
  }, [fine, itemsKey])

  return (
    <ScrollRail ref={listRef} label={label}>
      {items.map((product) => (
        <li key={product.id} className={cn('shrink-0 snap-start', WIDTH[variant])}>
          <div data-product-id={product.id} className="h-full">
            <PhotoCard
              product={product}
              rank={ranked ? product.trendingRank : undefined}
              surface={surface}
              newBadge={variant === 'new'}
              centre={centreId === product.id}
              sizes={variant === 'new' ? NEW_SIZES : undefined}
            />
          </div>
        </li>
      ))}
    </ScrollRail>
  )
}
