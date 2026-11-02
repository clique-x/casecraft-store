import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { GadgetCard } from '@/components/gadget/GadgetCard';
import { Reveal } from '@/components/motion/Reveal.client';
import { DEPARTMENTS, type Department } from '@/lib/catalog/gadgets';
import type { HomeProduct } from '@/lib/medusa/fixtures';

const COPY: Record<Department, { eyebrow: string; heading: string; sub: string; shortcuts: readonly { id: string; label: string }[] }> = {
  audio: {
    eyebrow: 'Wireless audio',
    heading: 'Earbuds, neckbands and speakers',
    sub: 'Work with every phone. Same Cash on Delivery and free shipping over ₹499.',
    shortcuts: [
      { id: 'earbuds', label: 'Earbuds' },
      { id: 'neckband', label: 'Neckbands' },
      { id: 'speaker', label: 'Speakers' },
    ],
  },
  charging: {
    eyebrow: 'Charging',
    heading: 'Chargers and original cables',
    sub: 'Fast chargers and sealed brand cables. Each one says whether it fits your phone.',
    shortcuts: [
      { id: 'chargers', label: 'Chargers' },
      { id: 'cables', label: 'Data cables' },
    ],
  },
};

/** Up to `limit` products, taking from each section in turn so chargers and cables both show. */
function mixSections(department: Department, products: HomeProduct[], limit: number): HomeProduct[] {
  const groups = DEPARTMENTS[department].sections.map((s) => products.filter((p) => p.gadget && s.types.includes(p.gadget.type)));
  const out: HomeProduct[] = [];
  for (let i = 0; out.length < limit && groups.some((g) => i < g.length); i++) {
    for (const g of groups) if (i < g.length && out.length < limit) out.push(g[i]);
  }
  return out;
}

/** Home page row for one gadget department: audio, or chargers and cables. */
export function GadgetRow({ department, products }: { department: Department; products: HomeProduct[] }) {
  if (products.length === 0) return null;
  const { path } = DEPARTMENTS[department];
  const copy = COPY[department];
  const shown = mixSections(department, products, 6);
  return (
    <section
      id={department}
      aria-labelledby={`${department}-heading`}
      className="cv-auto scroll-mt-20 bg-paper py-14 text-fg lg:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-label font-bold tracking-[0.16em] text-brand uppercase">{copy.eyebrow}</p>
            <h2 id={`${department}-heading`} className="mt-2 font-display text-h2 font-extrabold text-balance">
              {copy.heading}
            </h2>
            <p className="mt-2 text-body text-fg-muted">{copy.sub}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {copy.shortcuts.map((s) => (
              <Link
                key={s.id}
                href={`${path}#${s.id}`}
                className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-semibold text-fg transition-colors hover:border-fg"
              >
                {s.label}
              </Link>
            ))}
            <Link href={path} className="inline-flex h-10 items-center gap-1 px-2 text-sm font-semibold text-brand underline-offset-4 hover:underline">
              Shop all <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        <ul
          aria-label={copy.eyebrow}
          className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden"
        >
          {shown.map((p) => (
            <li key={p.id} className="w-[44%] shrink-0 snap-start sm:w-auto">
              <GadgetCard product={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
