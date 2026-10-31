import type { ReactNode } from 'react';
import { Crumbs, type Crumb } from '@/components/listing/Crumbs';
import { cn } from '@/lib/utils';

/** Page container used by every listing and content page; the fixed header overlaps the top. */
export const PAGE_SHELL = 'mx-auto w-full max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8 lg:pt-24 lg:pb-24';

interface ListingHeaderProps {
  trail: readonly Crumb[];
  title: ReactNode;
  intro?: ReactNode;
  /** Right-hand slot on wide screens (a count, a link). */
  aside?: ReactNode;
  className?: string;
}

export function ListingHeader({ trail, title, intro, aside, className }: ListingHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4', className)}>
      <Crumbs trail={trail} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="flex max-w-2xl flex-col gap-3">
          <h1 className="font-display text-h2 font-extrabold text-balance text-fg">{title}</h1>
          {intro && <p className="text-body text-pretty text-fg-muted">{intro}</p>}
        </div>
        {aside && <div className="shrink-0 text-caption text-fg-muted tabular-nums">{aside}</div>}
      </div>
    </header>
  );
}
