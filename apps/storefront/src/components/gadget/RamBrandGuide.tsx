import { CheckIcon } from 'lucide-react';
import { RAM_BRANDS, RAM_SPEED_LINE_TIP, type RamBrand } from '@/lib/catalog/ram-brands';

/**
 * "How to tell the brand": what the label, part number and chips of a Samsung, SK hynix or Crucial module look like,
 * so a buyer can check the module in hand. `brand` marks the card of the listing's own brand.
 */
export function RamBrandGuide({ brand, className = '' }: { brand?: RamBrand['name']; className?: string }) {
  return (
    <section aria-labelledby="ram-brand-guide" className={`rounded-[1.25rem] border border-border bg-paper p-5 sm:p-6 ${className}`}>
      <h2 id="ram-brand-guide" className="text-[1.25rem] leading-tight font-bold tracking-[-0.02em] text-fg">
        How to tell the brand
      </h2>
      <p className="mt-1.5 max-w-3xl text-sm text-fg-muted">{RAM_SPEED_LINE_TIP}</p>
      <ul className="mt-5 grid gap-3 md:grid-cols-3">
        {RAM_BRANDS.map((b) => {
          const own = b.name === brand;
          return (
            <li key={b.name} className={`rounded-[1rem] border p-4 ${own ? 'border-brand bg-brand/5' : 'border-border'}`}>
              <p className="flex items-center justify-between gap-2 text-[1rem] font-bold text-fg">
                {b.name}
                {own && <span className="rounded-full bg-brand px-2.5 py-0.5 text-caption font-semibold text-white">This module</span>}
              </p>
              <ul className="mt-2.5 flex flex-col gap-2">
                {b.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-fg-muted">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
