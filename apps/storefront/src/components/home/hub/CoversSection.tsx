import { AccentBar } from '@/components/brand/AccentBar';
import { Reveal } from '@/components/motion/Reveal.client';
import { PhonePicker } from '@/components/phone-picker/PhonePicker';
import type { PhoneModel } from '@/lib/medusa/fixtures';
import { EYEBROW, SHELL } from './hub-styles';

/** Covers department opener: pick a phone once, every cover list after it fits. */
export function CoversSection({ models, covers }: { models: PhoneModel[]; covers: number }) {
  return (
    <section id="phone-picker" aria-labelledby="covers-heading" className="scroll-mt-20 bg-ink-2 py-14 text-fg lg:py-20">
      <div className={SHELL}>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
          <Reveal className="flex flex-col gap-3 lg:col-span-4">
            <p className={EYEBROW}>Phone covers</p>
            <h2 id="covers-heading" className="font-display text-h2 font-extrabold text-balance">
              Covers cut for your exact phone
            </h2>
            <AccentBar className="mt-1" />
            <p className="max-w-md text-body text-fg-muted">{covers} covers. Pick your phone, see only what fits.</p>
          </Reveal>
          <Reveal delay={0.06} className="min-w-0 lg:col-span-8">
            <PhonePicker models={models} variant="section" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
