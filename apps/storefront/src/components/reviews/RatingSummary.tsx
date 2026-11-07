import { StarIcon } from 'lucide-react';
import { reviewCountLabel, type ReviewSummary } from '@/lib/content/reviews';
import { cn } from '@/lib/utils';
import { Stars } from './Stars';

/** Average and the 5-to-1 star breakdown, worked out from the reviews themselves; nothing without reviews. */
export function RatingSummary({ summary, className }: { summary: ReviewSummary; className?: string }) {
  const { count, average, distribution } = summary;
  if (count === 0 || average === null) return null;
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <div className="flex items-center gap-4">
        <p className="font-display text-[3.25rem] leading-none font-extrabold tracking-[-0.03em] text-fg tabular-nums">
          {average.toFixed(1)}
          <span className="sr-only"> out of 5 stars</span>
        </p>
        <div className="flex min-w-0 flex-col gap-1.5">
          <Stars value={average} size="md" decorative />
          <p className="text-sm text-fg-muted">Based on {reviewCountLabel(count)}</p>
        </div>
      </div>

      <ul aria-label="Reviews by star rating" className="flex flex-col gap-2">
        {distribution.map(({ stars, count: n }) => (
          <li key={stars} className="grid grid-cols-[2.25rem_minmax(0,1fr)_2rem] items-center gap-3 text-sm">
            <span className="sr-only">
              {stars} {stars === 1 ? 'star' : 'stars'}: {reviewCountLabel(n)}
            </span>
            <span aria-hidden="true" className="flex items-center gap-1 font-semibold text-fg tabular-nums">
              {stars}
              <StarIcon className="size-3.5 fill-current text-brand-coral" strokeWidth={1.75} />
            </span>
            <span aria-hidden="true" className="h-2 overflow-hidden rounded-pill bg-surface-3">
              <span className="block h-full rounded-pill bg-brand-coral" style={{ width: `${(n / count) * 100}%` }} />
            </span>
            <span aria-hidden="true" className="text-right text-fg-muted tabular-nums">
              {n}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
