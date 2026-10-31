import { NetworkPattern } from '@/components/brand/NetworkPattern'
import { FanSpread } from '@/components/home/FanSpread.client'
import { CaseCutout } from '@/components/home/hero/CaseCutout'
import { Ledge } from '@/components/home/hero/Ledge'
import { GHOST_CTA_ON_INK, PhoneCta } from '@/components/home/StickyPhoneCta.client'
import { TrustStrip } from '@/components/home/TrustStrip'
import { Reveal } from '@/components/motion/Reveal.client'
import type { CSSProperties } from 'react'
import type { PhotoEntry } from '@/lib/catalog/photos'
import { cn } from '@/lib/utils'

const FAN_SIZES = '220px'
const LEDGE_PX = 56
const FAN_H = 210
const FLOAT_DUR = ['11s', '12s', '14s'] as const

// Outer two sit back and slightly faded; only the middle cover downloads on phones.
// `--spread` (FanSpread, 0 → 1 with scroll) slides the outer two out from behind the middle cover.
const FAN_SLOTS: readonly { transform: string; className: string }[] = [
  {
    transform:
      'translateX(calc(-50% - 112px * var(--spread, 1))) translateZ(-60px) rotateY(calc(-24deg * var(--spread, 1)))',
    className: 'hidden opacity-85 sm:block',
  },
  { transform: 'translateX(-50%)', className: '' },
  {
    transform:
      'translateX(calc(-50% + 112px * var(--spread, 1))) translateZ(-60px) rotateY(calc(24deg * var(--spread, 1)))',
    className: 'hidden opacity-85 sm:block',
  },
]

/** Contact band: deep-teal glow with a coral top line, the one action, and a static CSS-3D fan of three covers. */
export function FinalCta({ fan }: { fan: PhotoEntry[] }) {
  const covers = fan.slice(0, FAN_SLOTS.length)

  return (
    <section
      id="find-covers"
      aria-labelledby="final-cta-heading"
      className="stage-glow cv-auto relative overflow-hidden border-t-2 border-accent py-16 text-fg-on-ink lg:py-24"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden sm:block">
        <NetworkPattern corner="bl" opacity={0.3} />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <Reveal className="flex flex-col items-start gap-5 lg:col-span-6">
          <h2 id="final-cta-heading" className="font-display text-h2 font-semibold text-fg-on-ink text-balance">
            Find covers for your phone
          </h2>
          <p className="max-w-md text-body leading-relaxed text-fg-on-ink-muted">
            Pick your phone once. Every list shows only covers that fit.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <PhoneCta className="w-full sm:w-auto" />
            <a href="#trending" className={cn(GHOST_CTA_ON_INK, 'w-full sm:w-auto')}>
              Shop trending
            </a>
          </div>
          <TrustStrip variant="inline" />
        </Reveal>

        <Reveal delay={0.1} className="flex justify-center lg:col-span-6">
          <FanSpread className="relative h-[300px] w-[320px] [perspective:1200px]" aria-hidden="true">
            <div className="absolute inset-0 [transform-style:preserve-3d]">
              {covers.map((entry, i) => {
                const slot = FAN_SLOTS[i]
                if (!slot) return null
                return (
                  <div
                    key={entry.id}
                    className={cn('absolute left-1/2 [transform-style:preserve-3d]', slot.className)}
                    style={{
                      height: `${FAN_H}px`,
                      aspectRatio: `${entry.imageW} / ${entry.imageH}`,
                      bottom: `${entry.cut === 'full' ? LEDGE_PX + 2 : LEDGE_PX - Math.round(FAN_H * 0.07)}px`,
                      transform: slot.transform,
                    }}
                  >
                    <div
                      className="fan-float h-full w-full"
                      style={{ '--float-dur': FLOAT_DUR[i] ?? FLOAT_DUR[1] } as CSSProperties}
                    >
                      <CaseCutout entry={entry} role="fan" sizes={FAN_SIZES} />
                    </div>
                  </div>
                )
              })}
            </div>
            <Ledge top={`calc(100% - ${LEDGE_PX}px)`} height={`${LEDGE_PX}px`} className="rounded-b-card" />
          </FanSpread>
        </Reveal>
      </div>
    </section>
  )
}
