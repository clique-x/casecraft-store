import Link from 'next/link';
import { formatInr } from '@/lib/catalog/photos';

export interface RailCategory {
  label: string;
  href: string;
  /** A product photo on the teal stage (square or 4:5; it is cropped to a square). */
  image: string;
  /** Lowest price in the category, from the live catalogue. */
  fromInr: number;
  /** A transparent cutout: shown whole, on the teal glow, instead of cropped to fill. */
  cutout?: boolean;
}

/**
 * "More to explore": one small card per range under the editorial tiles, so every department is a tap away.
 * A swipeable row on phones, one row of up to eight on desktops.
 */
export function CategoryRail({ categories }: { categories: RailCategory[] }) {
  if (categories.length === 0) return null;
  return (
    <div className="mt-8 lg:mt-10">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-[1.25rem] leading-tight font-bold tracking-[-0.02em] text-gh-ink lg:text-[1.5rem]">More to explore</h3>
        <p className="hidden text-sm text-gh-ink/60 sm:block">Sealed brands, Cash on Delivery</p>
      </div>
      <ul
        aria-label="Shop by category"
        className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-8 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((c) => (
          <li key={c.href + c.label} className="w-[38%] shrink-0 snap-start sm:w-[24%] lg:w-auto">
            <Link
              href={c.href}
              className="group/cat flex flex-col gap-2 rounded-[1rem] outline-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-brand"
            >
              <span className="relative block aspect-square overflow-hidden rounded-[1rem] bg-[radial-gradient(90%_90%_at_50%_45%,#11565a_0%,#08252e_70%)] shadow-[0_14px_30px_-24px_rgba(0,22,25,.7)]">
                {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static variants, no optimizer */}
                <img
                  src={c.image}
                  alt=""
                  width={480}
                  height={480}
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 size-full ${c.cutout ? 'object-contain p-[14%] drop-shadow-[0_14px_18px_rgba(0,0,0,.45)]' : 'object-cover'} transition-transform duration-500 ease-out-expo group-hover/cat:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover/cat:transform-none`}
                />
              </span>
              <span className="px-0.5">
                <span className="block text-[0.9375rem] leading-tight font-bold text-gh-ink">{c.label}</span>
                <span className="mt-0.5 block text-caption text-gh-ink/65 tabular-nums">from {formatInr(c.fromInr)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
