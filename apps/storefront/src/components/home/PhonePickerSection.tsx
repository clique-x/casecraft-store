import { Reveal } from '@/components/motion/Reveal.client'
import { PhonePicker } from '@/components/phone-picker/PhonePicker'
import type { PhoneModel } from '@/lib/medusa/fixtures'

/** Phones and tablets only: the deep-teal band continues the hero's ledge slab; at lg the hero carries the picker. */
export function PhonePickerSection({ models }: { models: PhoneModel[] }) {
  return (
    <section
      id="phone-picker"
      aria-labelledby="phone-picker-heading"
      className="scroll-mt-20 bg-ink-2 py-14 text-fg-on-ink lg:hidden"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col gap-3">
          <h2 id="phone-picker-heading" className="font-display text-h2 font-extrabold text-fg-on-ink text-balance">
            Which phone is yours?
          </h2>
          <p className="max-w-xl text-body leading-relaxed text-fg-on-ink-muted">
            Pick once. Every list below shows only covers that fit.
          </p>
        </Reveal>
        <Reveal delay={0.06} className="mt-8">
          <PhonePicker models={models} variant="section" />
        </Reveal>
      </div>
    </section>
  )
}
