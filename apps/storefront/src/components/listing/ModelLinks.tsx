import Link from 'next/link';
import { ChevronRightIcon } from 'lucide-react';
import { BrandOutline, phoneHref } from '@/components/phone-picker/BrandOutline';
import { coversLabel } from '@/lib/catalog/listing';
import type { PhoneModel } from '@/lib/medusa/fixtures';
import { cn } from '@/lib/utils';

interface ModelLinksProps {
  models: readonly PhoneModel[];
  counts: ReadonlyMap<string, number>;
  /** `grid` for a brand page, `compact` inside the all-brands list. */
  layout?: 'grid' | 'compact';
  className?: string;
}

/** One row per phone model, linking to its covers, with the number of covers that fit. */
export function ModelLinks({ models, counts, layout = 'grid', className }: ModelLinksProps) {
  return (
    <ul
      className={cn(
        'grid gap-2',
        layout === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 lg:gap-3' : 'sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {models.map((model) => {
        const count = counts.get(model.slug) ?? 0;
        return (
          <li key={model.slug}>
            <Link
              href={phoneHref(model)}
              className={cn(
                'group/model flex items-center gap-3 rounded-[10px] border border-border bg-paper px-4 text-fg transition-colors duration-(--dur-micro) outline-none hover:bg-surface-2 focus-visible:ring-3 focus-visible:ring-accent-2',
                layout === 'grid' ? 'min-h-16' : 'min-h-12',
              )}
            >
              <BrandOutline islandStyle={model.islandStyle} size={layout === 'grid' ? 24 : 20} className="text-fg-muted" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{model.model}</span>
                <span className="text-caption text-fg-muted tabular-nums">
                  {count > 0 ? coversLabel(count) : 'No covers listed yet'}
                </span>
              </span>
              <ChevronRightIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-fg-muted transition-transform duration-(--dur-micro) group-hover/model:translate-x-0.5"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
