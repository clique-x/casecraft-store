'use client'

import type { HomeProduct } from '@/lib/medusa/fixtures'
import { selectForPhone } from '@/lib/phone/select-for-phone'
import { useMyPhone } from '@/lib/phone/use-my-phone'
import { cn } from '@/lib/utils'

/** Appends " for {model}" to a row heading only when the row is actually narrowed to that phone. */
export function RowHeaderForPhone({ products, className }: { products: HomeProduct[]; className?: string }) {
  const { phone } = useMyPhone()
  const { filtered } = selectForPhone(products, phone?.slug ?? null)
  return (
    <span className={cn('text-fg-muted', className)}>{phone && filtered ? ` for ${phone.model}` : ''}</span>
  )
}
