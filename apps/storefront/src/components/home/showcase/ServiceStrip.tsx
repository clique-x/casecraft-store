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

/** Four store facts under the hero: a 2×2 grid on phones, four columns with hairline separators from lg. */
export function ServiceStrip() {
  return (
    <section aria-label="Shopping with us" className="border-b border-gh-line bg-gh-ivory text-gh-ink">
      <ul className="mx-auto grid w-full max-w-[90rem] grid-cols-2 gap-x-2 px-3 py-2 sm:px-6 lg:grid-cols-4 lg:gap-x-0 lg:px-10 lg:py-1 xl:px-14">
        {FACTS.map(({ Icon, label, href }, i) => (
          <li
            key={label}
            className={
              i === 0
                ? 'relative'
                : 'relative lg:before:absolute lg:before:top-1/2 lg:before:left-0 lg:before:h-8 lg:before:w-px lg:before:-translate-y-1/2 lg:before:bg-gh-line'
            }
          >
            <Link
              href={href}
              className="flex min-h-12 items-center gap-2.5 rounded-xl px-2 py-2 text-[0.8125rem] font-medium tabular-nums transition-colors duration-(--dur-micro) hover:bg-gh-ivory-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand sm:gap-3 sm:text-sm lg:min-h-16 lg:justify-center lg:text-[0.9375rem]"
            >
              <Icon className="size-6 shrink-0 text-brand lg:size-7" strokeWidth={1.5} aria-hidden="true" />
              <span className="leading-snug">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ServiceStrip;
