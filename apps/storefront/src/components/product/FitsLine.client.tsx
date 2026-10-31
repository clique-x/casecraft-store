'use client'

import { CheckIcon } from 'lucide-react'
import { useMyPhone } from '@/lib/phone/use-my-phone'
import { cn } from '@/lib/utils'

interface FitsLineProps {
  fitsModels: readonly string[]
  /** Total launch models; when every model fits the copy says so. */
  modelCount?: number
  className?: string
}

export function FitsLine({ fitsModels, modelCount, className }: FitsLineProps) {
  const { phone } = useMyPhone()
  const mine = phone !== null && fitsModels.includes(phone.slug) ? phone : null
  const fitsAll = modelCount !== undefined && fitsModels.length >= modelCount

  return (
    <p
      className={cn(
        'flex h-5 items-center gap-1 text-caption tabular-nums',
        mine ? 'font-medium text-accent-text' : 'text-fg-muted',
        className,
      )}
    >
      {mine ? (
        <>
          <CheckIcon className="size-3.5" aria-hidden="true" />
          Fits {mine.model}
        </>
      ) : fitsAll ? (
        `Fits all ${fitsModels.length} phones`
      ) : (
        `Fits ${fitsModels.length} models`
      )}
    </p>
  )
}
