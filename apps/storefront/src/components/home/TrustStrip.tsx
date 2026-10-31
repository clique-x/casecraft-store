import Link from 'next/link'
import { BanknoteIcon, ClockIcon, RotateCcwIcon, TruckIcon, type LucideIcon } from 'lucide-react'
import { Reveal } from '@/components/motion/Reveal.client'
import { DISPATCH_WINDOW, FREE_SHIPPING_THRESHOLD_INR, REPLACEMENT_DAYS } from '@/lib/brand'
import { cn } from '@/lib/utils'

interface TrustStripProps {
  /** `band` is the white 2×2 / four-up strip under the trust seam; `inline` is a one-line row for ink surfaces. */
  variant?: 'band' | 'inline'
  className?: string
}

interface TrustItem {
  Icon: LucideIcon
  label: string
  href: '/pages/shipping' | '/pages/returns'
}

const ITEMS: readonly TrustItem[] = [
  { Icon: BanknoteIcon, label: 'Cash on Delivery', href: '/pages/shipping' },
  { Icon: TruckIcon, label: `Free shipping over ₹${FREE_SHIPPING_THRESHOLD_INR}`, href: '/pages/shipping' },
  { Icon: RotateCcwIcon, label: `${REPLACEMENT_DAYS}-day replacement`, href: '/pages/returns' },
  { Icon: ClockIcon, label: `Ships in ${DISPATCH_WINDOW}`, href: '/pages/shipping' },
]

export function TrustStrip({ variant = 'band', className }: TrustStripProps) {
  if (variant === 'inline') {
    return (
      <ul
        aria-label="Shopping facts"
        className={cn('flex flex-wrap items-center gap-x-5 gap-y-2 text-caption text-fg-on-ink-muted tabular-nums', className)}
      >
        {ITEMS.map(({ Icon, label }) => (
          <li key={label} className="inline-flex items-center gap-1.5">
            <Icon className="size-4 text-fg-on-ink" strokeWidth={2} aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    )
  }

  // 2×2 on phones: the fears are answered without a gesture.
  return (
    <section aria-label="Shopping facts" className={cn('bg-paper', className)}>
      <Reveal className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {ITEMS.map(({ Icon, label, href }) => (
            <li key={label}>
              <Link
                href={href}
                className="flex min-h-14 items-center gap-3 rounded-card bg-surface-2 px-3 py-3 text-sm font-semibold text-fg tabular-nums transition-colors duration-(--dur-micro) outline-none hover:bg-surface-3 focus-visible:ring-3 focus-visible:ring-accent-2 sm:px-4"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-accent-text">
                  <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  )
}
