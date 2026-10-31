import { DISPATCH_WINDOW, FREE_SHIPPING_THRESHOLD_INR, REPLACEMENT_DAYS } from '@/lib/brand';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

/**
 * The thin strip above the header. It scrolls away with the page; the fixed header starts
 * below it (top-8) and moves to the top once the page scrolls (see Header).
 */
export function AnnouncementBar() {
  const items = [
    `Free shipping over ${inr.format(FREE_SHIPPING_THRESHOLD_INR)}`,
    'Cash on Delivery available',
    `${REPLACEMENT_DAYS}-day replacement`,
    `Ships in ${DISPATCH_WINDOW}`,
  ];
  return (
    <div className="relative z-50 flex h-8 items-center justify-center overflow-hidden bg-fg px-4 text-[0.75rem] font-semibold text-paper">
      <p className="truncate sm:hidden">{items.slice(0, 2).join(' · ')}</p>
      <ul className="hidden items-center gap-6 sm:flex">
        {items.map((item, i) => (
          <li key={item} className="flex items-center gap-6 whitespace-nowrap">
            {i > 0 && <span aria-hidden="true" className="size-1 rounded-full bg-paper/50" />}
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
