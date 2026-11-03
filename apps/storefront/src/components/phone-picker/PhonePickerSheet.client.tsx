'use client'

import { useSyncExternalStore } from 'react'
import { XIcon } from 'lucide-react'
import { PhonePicker } from '@/components/phone-picker/PhonePicker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import type { PhoneModel } from '@/lib/medusa/fixtures'
import { pickerSheet, usePickerSheetOpen } from '@/lib/phone/picker-sheet-store'

const DESKTOP_QUERY = '(min-width: 1024px)'

function subscribeDesktop(onChange: () => void): () => void {
  const mq = window.matchMedia(DESKTOP_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  )
}

const TITLE = 'Which phone is yours?'
const DESCRIPTION = 'Pick once. Every list shows only covers that fit.'

/**
 * The picker inside a bottom Drawer (phones) or a Dialog (desktop), driven by `pickerSheet`.
 * Mount once from the layout, ideally via `next/dynamic(..., { ssr: false })`.
 */
export function PhonePickerSheet({ models }: { models: PhoneModel[] }) {
  const open = usePickerSheetOpen()
  const desktop = useIsDesktop()

  const onOpenChange = (next: boolean) => {
    if (next) pickerSheet.open()
    else pickerSheet.close()
  }
  const close = () => pickerSheet.close()

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85svh] grid-cols-1 overflow-y-auto rounded-card bg-surface p-6 text-fg ring-border sm:max-w-2xl sm:p-8">
          <DialogHeader>
            <DialogTitle className="font-sans text-h3 font-bold text-fg">{TITLE}</DialogTitle>
            <DialogDescription className="text-fg-muted">{DESCRIPTION}</DialogDescription>
          </DialogHeader>
          <PhonePicker models={models} variant="sheet" onNavigate={close} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-surface text-fg">
        <DrawerHeader className="relative pr-16 text-left">
          {/* Swipe and overlay taps are unreliable under TalkBack/VoiceOver; this is the accessible exit. */}
          <DrawerClose asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-pill text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
            >
              <XIcon className="size-5" aria-hidden="true" />
            </button>
          </DrawerClose>
          <DrawerTitle className="font-sans text-h3 font-bold text-fg">{TITLE}</DrawerTitle>
          <DrawerDescription className="text-fg-muted">{DESCRIPTION}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <PhonePicker models={models} variant="sheet" onNavigate={close} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
