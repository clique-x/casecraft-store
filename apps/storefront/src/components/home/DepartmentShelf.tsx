import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRightIcon } from 'lucide-react';
import { AccessoryCard } from '@/components/accessory/AccessoryCard';
import { GadgetCard } from '@/components/gadget/GadgetCard';
import { DepartmentShelfTabs } from '@/components/home/DepartmentShelfTabs.client';
import { EYEBROW, SHELL } from '@/components/home/hub/hub-styles';
import { DEPARTMENTS, type Department } from '@/lib/catalog/gadgets';
import type { HomeProduct } from '@/lib/medusa/fixtures';

/** The gadget departments on the shelf, in tab order. Audio and cameras have their own sections on the page. */
const SHELF = ['charging', 'storage', 'laptops', 'computer'] as const satisfies readonly Department[];

const COPY: Record<(typeof SHELF)[number], { heading: string; sub: string; shortcuts: readonly { id: string; label: string }[] }> = {
  storage: {
    heading: 'Memory cards, SSDs and RAM',
    sub: 'SanDisk, Samsung, WD and Consistent, in the size you need.',
    shortcuts: [
      { id: 'cards', label: 'Memory cards' },
      { id: 'ssd', label: 'SSDs' },
      { id: 'ram', label: 'RAM' },
    ],
  },
  charging: {
    heading: 'Chargers and data cables',
    sub: 'Fast chargers and cables, sealed in the box. Each one says whether it fits your phone.',
    shortcuts: [
      { id: 'chargers', label: 'Chargers' },
      { id: 'cables', label: 'Data cables' },
    ],
  },
  laptops: {
    heading: 'Refurbished Dell Latitude laptops',
    sub: 'Core i5, 8GB RAM and a 256GB SSD, with a 6-month GadgetsHub warranty. One of each.',
    shortcuts: [],
  },
  computer: {
    heading: 'Gaming mice, keyboards and USB hubs',
    sub: 'Ant Esports and Honeywell, sealed with the brand warranty.',
    shortcuts: [
      { id: 'mice', label: 'Gaming mice' },
      { id: 'keyboards', label: 'Keyboard combos' },
      { id: 'hubs', label: 'USB hubs' },
    ],
  },
};

const PROTECTION_SHORTCUTS = [
  { id: 'screen-guard', label: 'Screen guards' },
  { id: 'back-film', label: 'Back films' },
] as const;

/** Up to `limit` products, taking from each section in turn so chargers and cables both show. */
function mixSections(department: Department, products: HomeProduct[], limit: number): HomeProduct[] {
  const groups = DEPARTMENTS[department].sections.map((s) => products.filter((p) => p.gadget && s.types.includes(p.gadget.type)));
  const out: HomeProduct[] = [];
  for (let i = 0; out.length < limit && groups.some((g) => i < g.length); i++) {
    for (const g of groups) if (i < g.length && out.length < limit) out.push(g[i]);
  }
  return out;
}

interface PanelProps {
  heading: string;
  sub: string;
  /** The department's page, and links to its sections. */
  path: string;
  shortcuts: readonly { id: string; label: string }[];
  children: ReactNode;
}

/** One department: what it is, where to see all of it, and a row of its products (a swipe rail on phones). */
function Panel({ heading, sub, path, shortcuts, children }: PanelProps) {
  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h3 className="font-display text-xl leading-tight font-extrabold tracking-[-0.02em] text-balance lg:text-2xl">{heading}</h3>
          <p className="mt-1 text-[0.9375rem] text-pretty text-fg-muted">{sub}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {shortcuts.map((s) => (
            <Link
              key={s.id}
              href={`${path}#${s.id}`}
              className="inline-flex h-9 items-center rounded-full border border-border px-3.5 text-[0.8125rem] font-semibold text-fg transition-colors hover:border-fg"
            >
              {s.label}
            </Link>
          ))}
          <Link href={path} className="inline-flex h-9 items-center gap-1 px-1 text-sm font-semibold text-brand underline-offset-4 hover:underline">
            Shop all <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <ul
        aria-label={heading}
        className="-mx-4 mt-5 flex snap-x gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>
    </>
  );
}

const ITEM = 'w-[44%] shrink-0 snap-start sm:w-auto';

interface Props {
  /** The screen guards, back films and lens protectors. */
  accessories: HomeProduct[];
  /** Each gadget department's products; a department with none gets no tab. */
  gadgets: Partial<Record<Department, HomeProduct[]>>;
}

/**
 * "More for your phone and desk": the departments that do not have a section of their own, as tabs over one
 * row of products. It stands where five separate rows stood, so the page is much shorter and only the open
 * department's photos are downloaded.
 */
export function DepartmentShelf({ accessories, gadgets }: Props) {
  const tabs: { key: string; label: string }[] = [];
  const panels: ReactNode[] = [];

  if (accessories.length > 0) {
    const shown = [...accessories].sort((a, b) => Number(Boolean(b.accessory?.photos)) - Number(Boolean(a.accessory?.photos))).slice(0, 6);
    tabs.push({ key: 'protection', label: 'Protection' });
    panels.push(
      <Panel
        key="protection"
        heading="Screen guards and films that fit"
        sub="FLAYR glass for iPhone, G-TEL glass for Galaxy S, hydrogel back films and lens protectors. ₹50 off each with any cover."
        path="/accessories"
        shortcuts={PROTECTION_SHORTCUTS}
      >
        {shown.map((p) => (
          <li key={p.id} className={ITEM}>
            <AccessoryCard product={p} />
          </li>
        ))}
      </Panel>,
    );
  }

  for (const department of SHELF) {
    const products = gadgets[department] ?? [];
    if (products.length === 0) continue;
    const info = DEPARTMENTS[department];
    const copy = COPY[department];
    tabs.push({ key: department, label: info.name });
    panels.push(
      <Panel key={department} heading={copy.heading} sub={copy.sub} path={info.path} shortcuts={copy.shortcuts}>
        {mixSections(department, products, 6).map((p) => (
          <li key={p.id} className={ITEM}>
            <GadgetCard product={p} />
          </li>
        ))}
      </Panel>,
    );
  }

  if (tabs.length === 0) return null;
  return (
    <section id="departments" aria-labelledby="departments-heading" className="cv-auto scroll-mt-20 bg-paper py-10 text-fg lg:py-16">
      <div className={SHELL}>
        <p className={EYEBROW}>More from the hub</p>
        <h2 id="departments-heading" className="mt-2 mb-5 font-display text-h2 font-extrabold text-balance">
          More for your phone and desk
        </h2>
        <DepartmentShelfTabs tabs={tabs} panels={panels} />
      </div>
    </section>
  );
}

export default DepartmentShelf;
