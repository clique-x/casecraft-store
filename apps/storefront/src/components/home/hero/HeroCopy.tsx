import { AccentBar } from '@/components/brand/AccentBar';
import { Magnetic } from '@/components/motion/Magnetic.client';
import { WordReveal } from '@/components/motion/WordReveal.client';
import { FREE_SHIPPING_THRESHOLD_INR, REPLACEMENT_DAYS } from '@/lib/brand';
import type { PhoneModel } from '@/lib/medusa/fixtures';
import { HeadlineFlip, HeroKicker } from './HeadlineFlip.client';
import { HeroLabel } from './HeroLabel.client';
import { HeroPicker } from './HeroPicker.client';
import { HeroPrimaryCta } from './HeroPrimaryCta.client';

interface Props {
  models: PhoneModel[];
}

const KICKER = 'Real covers, photographed in our shop';
const SUB = 'Pick your phone once and see only the covers that fit it. UPI, cards or Cash on Delivery.';

/** `COD · Free shipping over ₹499 · 7-day replacement`; phones carry it in the copy stack, lg on the slab row. */
export function HeroTrustLine({ className }: { className?: string }) {
  return (
    <p className={className}>
      COD · Free shipping over ₹{FREE_SHIPPING_THRESHOLD_INR} · {REPLACEMENT_DAYS}-day replacement
    </p>
  );
}

/**
 * Kicker, h1 (line 1 rises word by word, line 2 flips to the shopper's phone), accent bar, sub,
 * inline picker (lg) and CTA row. Phones stack it under the floor, in flow, so the section grows
 * instead of the stack covering the stage; desktop centres it in cols 1–6 over the full height.
 */
export function HeroCopy({ models }: Props) {
  return (
    <div className="pointer-events-none relative z-[4] lg:absolute lg:inset-0">
      <div className="px-4 pt-[calc(var(--floor-y)+1.25rem)] pb-[calc(1rem+env(safe-area-inset-bottom))] lg:absolute lg:inset-x-0 lg:top-0 lg:mx-auto lg:grid lg:h-(--floor-y) lg:w-full lg:max-w-7xl lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-8 lg:pt-16 lg:pb-0">
        <div className="pointer-events-auto flex flex-col gap-3 lg:col-span-6 lg:gap-5">
          <HeroLabel className="lg:hidden" />
          <p className="truncate font-sans text-[0.6875rem] leading-4 font-bold tracking-[0.2em] text-fg-on-ink-muted uppercase">
            <HeroKicker fallback={KICKER} />
          </p>
          <h1
            className="font-display text-hero leading-[1.02] font-extrabold tracking-[-0.035em] text-fg-on-ink"
            style={{ textWrap: 'balance' }}
          >
            <span className="block">
              <WordReveal text="Covers that fit" delay={0.1} />
            </span>
            <HeadlineFlip base="your phone." />
          </h1>
          <AccentBar />
          <p className="hidden max-w-[36ch] text-[0.9375rem] leading-[1.45] text-fg-on-ink-muted tall:block lg:block lg:text-body">
            {SUB}
          </p>
          <HeroPicker models={models} className="hidden lg:block" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Magnetic className="w-full sm:w-auto">
              <HeroPrimaryCta className="w-full sm:w-auto" />
            </Magnetic>
            <a
              href="#trending"
              className="inline-flex h-13 items-center justify-center rounded-pill border border-fg-on-ink/20 px-6 font-sans text-base font-semibold text-fg-on-ink transition-colors duration-(--dur-micro) hover:bg-surface-glass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
            >
              Shop trending
            </a>
          </div>
          <HeroTrustLine className="text-caption text-fg-on-ink-muted lg:hidden" />
        </div>
      </div>
    </div>
  );
}
