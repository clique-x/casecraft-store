import Link from 'next/link';
import { ArrowDownIcon, BadgeCheckIcon, BanknoteIcon, TruckIcon } from 'lucide-react';
import { Crumbs, type Crumb } from '@/components/listing/Crumbs';
import { FREE_SHIPPING_THRESHOLD_INR } from '@/lib/brand';
import { formatInr } from '@/lib/catalog/photos';

const JUMP =
  'inline-flex h-11 shrink-0 items-center gap-2 rounded-pill bg-fg px-5 text-sm font-bold text-paper transition-colors duration-(--dur-micro) hover:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2';
const PROMISE = 'inline-flex items-center gap-1.5 text-caption font-semibold text-fg-muted [&_svg]:size-4 [&_svg]:text-brand';

export interface JumpGroup {
  id: string;
  heading: string;
  count: number;
}

/**
 * Top of a department listing: crumbs, a one-word title, a button per product group that jumps to it,
 * and three one-line promises. Intro copy belongs in the page metadata, not on screen.
 */
export function DepartmentHeader({ trail, title, groups, warranty }: { trail: readonly Crumb[]; title: string; groups: readonly JumpGroup[]; warranty: string }) {
  return (
    <header className="flex flex-col gap-4">
      <Crumbs trail={trail} />
      <h1 className="font-display text-h2 font-extrabold text-fg">{title}</h1>
      {groups.length > 1 && (
        <nav aria-label={`${title} sections`} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {groups.map((g) => (
            <Link key={g.id} href={`#${g.id}`} className={JUMP}>
              {g.heading}
              <span className="rounded-pill bg-paper/15 px-2 py-0.5 text-caption tabular-nums">{g.count}</span>
              <ArrowDownIcon className="size-4" aria-hidden="true" />
            </Link>
          ))}
        </nav>
      )}
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        <li className={PROMISE}>
          <BadgeCheckIcon aria-hidden="true" /> {warranty}
        </li>
        <li className={PROMISE}>
          <BanknoteIcon aria-hidden="true" /> Cash on Delivery
        </li>
        <li className={PROMISE}>
          <TruckIcon aria-hidden="true" /> Free shipping over {formatInr(FREE_SHIPPING_THRESHOLD_INR)}
        </li>
      </ul>
    </header>
  );
}

/** One group of a department listing: a short heading with its count, then the grid passed in. */
export function DepartmentSection({ id, heading, count, first, children }: { id: string; heading: string; count: number; first?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className={first ? 'mt-8 scroll-mt-28 sm:mt-10' : 'mt-12 scroll-mt-28 sm:mt-14'}>
      <h2 id={`${id}-heading`} className="flex items-baseline gap-2 font-display text-h3 font-extrabold text-fg">
        {heading}
        <span className="font-sans text-caption font-semibold text-fg-muted tabular-nums" aria-label={`${count} products`}>
          {count}
        </span>
      </h2>
      {children}
    </section>
  );
}
