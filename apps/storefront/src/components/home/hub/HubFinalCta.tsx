import Link from 'next/link';
import { MessageCircleIcon } from 'lucide-react';
import { OpenPickerButton } from '@/components/home/hero/OpenPickerButton';
import { Reveal } from '@/components/motion/Reveal.client';
import { WHATSAPP_NUMBER } from '@/lib/brand';
import { SHELL } from './hub-styles';

const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I need help choosing something for my phone.')}`;

/** Closing band: two ways forward, pick a phone or ask a person. */
export function HubFinalCta() {
  return (
    <section aria-labelledby="final-cta-heading" className="bg-paper py-14 lg:py-20">
      <div className={SHELL}>
        <Reveal className="relative overflow-hidden rounded-[28px] bg-brand px-6 py-12 text-paper sm:px-12 lg:px-16 lg:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -bottom-32 size-[26rem] rounded-full bg-white/8" />
          <div aria-hidden="true" className="pointer-events-none absolute -top-20 right-40 size-40 rounded-full bg-brand-coral/40 blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h2 id="final-cta-heading" className="font-display text-[clamp(1.9rem,1.3rem+2.2vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.035em] text-balance">
                Not sure what fits your phone?
              </h2>
              <p className="mt-3 text-body text-paper/80">Pick your phone, or ask us on WhatsApp.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <OpenPickerButton className="!bg-paper !text-fg hover:!bg-surface-2">Select your phone</OpenPickerButton>
              <Link
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-pill border border-paper/40 px-6 text-base font-semibold text-paper transition-colors hover:border-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
              >
                <MessageCircleIcon className="size-4" aria-hidden="true" />
                Ask on WhatsApp
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
