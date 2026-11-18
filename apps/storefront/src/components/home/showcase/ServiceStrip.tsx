import Link from 'next/link';
import { BanknoteIcon, ClockIcon, RotateCcwIcon, TruckIcon, type LucideIcon } from 'lucide-react';
import { DISPATCH_WINDOW, FREE_SHIPPING_THRESHOLD_INR, REPLACEMENT_DAYS } from '@/lib/brand';

interface Fact {
  Icon: LucideIcon;
  label: string;
  href: '/pages/shipping' | '/pages/returns';
}

// Every value comes from the shop's settings in lib/brand.ts, so the strip changes with the policies.
const FACTS: readonly Fact[] = [
  { Icon: BanknoteIcon, label: 'Cash on delivery', href: '/pages/shipping' },
  { Icon: TruckIcon, label: `Free shipping over ₹${FREE_SHIPPING_THRESHOLD_INR.toLocaleString('en-IN')}`, href: '/pages/shipping' },
  { Icon: RotateCcwIcon, label: `${REPLACEMENT_DAYS}-day replacement`, href: '/pages/returns' },
  { Icon: ClockIcon, label: `Ships in ${DISPATCH_WINDOW}`, href: '/pages/shipping' },
];

/**
 * Four store facts under the hero, always in one line. On phones each is a small column, the icon over a
 * two-line label, so all four show at once with nothing to swipe. From md the icon sits beside the label on a
 * single line, and from lg the four share the width equally with hairline separators.
 */
export function ServiceStrip() {
  return (
    <section aria-label="Shopping with us" className="border-b border-gh-line bg-gh-ivory text-gh-ink">
      <ul className="mx-auto grid w-full max-w-[90rem] grid-cols-4 px-1.5 py-1.5 sm:px-6 md:flex md:justify-between md:gap-x-2 md:py-1 lg:grid lg:gap-x-0 lg:px-10 xl:px-14">
        {FACTS.map(({ Icon, label, href }, i) => (
          <li
            key={label}
            className={
              i === 0
                ? 'relative min-w-0'
                : 'relative min-w-0 lg:before:absolute lg:before:top-1/2 lg:before:left-0 lg:before:h-8 lg:before:w-px lg:before:-translate-y-1/2 lg:before:bg-gh-line'
            }
          >
            <Link
              href={href}
              className="flex h-full min-h-12 flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center text-[0.625rem] leading-tight font-medium tabular-nums transition-colors duration-(--dur-micro) hover:bg-gh-ivory-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand min-[360px]:text-[0.6875rem] min-[400px]:text-xs sm:text-[0.8125rem] md:flex-row md:gap-2.5 md:px-2 md:text-left md:text-sm md:whitespace-nowrap lg:min-h-16 lg:justify-center lg:gap-3 lg:text-[0.9375rem]"
            >
              <Icon className="size-[1.375rem] shrink-0 text-brand md:size-6 lg:size-7" strokeWidth={1.5} aria-hidden="true" />
              {/* Balanced over two lines in a phone's column; one line from md, where text-balance would still wrap it. */}
              <span className="text-balance md:text-nowrap">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ServiceStrip;
