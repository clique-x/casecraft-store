'use client'

import { useEffect, type ComponentProps } from 'react'
import Link from 'next/link'
import { AnimatePresence, m } from 'motion/react'
import { ArrowRightIcon, SmartphoneIcon } from 'lucide-react'
import { phoneHref } from '@/components/phone-picker/BrandOutline'
import { Button } from '@/components/ui/button'
import { useInView } from '@/lib/device/use-in-view'
import { chromeStore } from '@/lib/layout/chrome-store'
import type { PhoneModel } from '@/lib/medusa/fixtures'
import { DUR, EASE_OUT_EXPO, SPRING_UI } from '@/lib/motion/tokens'
import { pickerSheet, usePickerSheetOpen } from '@/lib/phone/picker-sheet-store'
import { useMyPhone } from '@/lib/phone/use-my-phone'
import { cn } from '@/lib/utils'

/** Primary button: coral, 48 px, 19 px / 700 white label (large bold text, AA on coral). */
export const PRIMARY_CTA =
  'inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-pill bg-accent px-6 text-cta font-bold text-on-accent transition-colors duration-(--dur-micro) hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2 [&_svg]:size-5 [&_svg]:shrink-0'

/** Ghost button for ink surfaces, paired with the primary button. */
export const GHOST_CTA_ON_INK =
  'inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-pill border border-fg-on-ink/25 bg-paper px-6 text-base font-semibold text-fg-on-ink transition-colors duration-(--dur-micro) hover:border-fg-on-ink/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2'

const EASE: [number, number, number, number] = [...EASE_OUT_EXPO]

function prefetchSheet() {
  void import('@/components/phone-picker/PhonePickerSheet.client')
}

/** Primary-styled button that opens the phone picker sheet and warms its chunk on hover/focus. */
export function OpenSheetButton({
  className,
  children,
  onClick,
  onPointerEnter,
  onFocus,
  ...rest
}: ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      size="lg"
      {...rest}
      className={cn(PRIMARY_CTA, 'border-0 bg-clip-border', className)}
      onPointerEnter={(e) => {
        prefetchSheet()
        onPointerEnter?.(e)
      }}
      onFocus={(e) => {
        prefetchSheet()
        onFocus?.(e)
      }}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) pickerSheet.open()
      }}
    >
      {children ?? 'Select your phone'}
    </Button>
  )
}

interface PhoneCtaProps {
  className?: string
  selectLabel?: string
}

/** "Select your phone" that morphs, with one spring pulse, into "Covers for {model} →" once `my_phone` exists. */
export function PhoneCta({ className, selectLabel = 'Select your phone' }: PhoneCtaProps) {
  const { phone } = useMyPhone()
  return (
    <AnimatePresence mode="wait" initial={false}>
      {phone ? (
        <m.div
          key={phone.slug}
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: [1, 1.04, 1] }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.ui, ease: EASE }}
          className={className}
        >
          <Link href={phoneHref(phone)} className={cn(PRIMARY_CTA, 'w-full')}>
            Covers for {phone.model}
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </m.div>
      ) : (
        <m.div
          key="select"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.micro }}
          className={className}
        >
          <OpenSheetButton className="w-full">{selectLabel}</OpenSheetButton>
        </m.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Phone-only bottom bar; appears once the hero has scrolled away and hides over the footer.
 * While the sheet is open it only slides away: it stays mounted and focusable so the modal
 * (which already hides and traps everything behind it) can return focus to its opener.
 * `inert` would blur the opener before the dialog records it.
 */
export function StickyPhoneCta({ models }: { models: PhoneModel[] }) {
  const { phone } = useMyPhone()
  const sheetOpen = usePickerSheetOpen()
  const heroInView = useInView('#hero')
  const footerInView = useInView('footer')
  const shown = heroInView === false && footerInView === false
  const visible = shown && !sheetOpen

  useEffect(() => {
    chromeStore.setStickyCtaVisible(visible)
  }, [visible])
  useEffect(() => () => chromeStore.setStickyCtaVisible(false), [])

  return (
    <AnimatePresence>
      {shown && (
        <m.div
          key="sticky-phone-cta"
          initial={{ y: 96 }}
          animate={{ y: sheetOpen ? 96 : 0 }}
          exit={{ y: 96 }}
          transition={{ type: 'spring', ...SPRING_UI }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] supports-backdrop-filter:bg-surface/85 supports-backdrop-filter:backdrop-blur lg:hidden"
        >
          {phone ? (
            <Link href={phoneHref(phone)} className={cn(PRIMARY_CTA, 'w-full')}>
              Covers for {phone.model}
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          ) : (
            <OpenSheetButton className="w-full">
              <SmartphoneIcon aria-hidden="true" />
              Select your phone
              <span className="sr-only">, {models.length} models</span>
            </OpenSheetButton>
          )}
        </m.div>
      )}
    </AnimatePresence>
  )
}
