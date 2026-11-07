import { ChevronDownIcon } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal.client';
import type { Review } from '@/lib/content/reviews';
import { cn } from '@/lib/utils';
import { ReviewCard } from './ReviewCard';

const GRID = 'grid gap-4 sm:grid-cols-2';

interface ReviewListProps {
  /** Already in display order (newest first). */
  reviews: readonly Review[];
  /** Accessible name of the list. */
  label: string;
  /** Cards shown before "Show more"; the rest stay one tap away, never dropped. */
  initial?: number;
  /** Product titles by handle, to link each review to its product; leave out on a product page. */
  productTitles?: ReadonlyMap<string, string>;
  className?: string;
}

function productOf(review: Review, titles?: ReadonlyMap<string, string>) {
  const title = review.productHandle ? titles?.get(review.productHandle) : undefined;
  return review.productHandle && title ? { href: `/products/${review.productHandle}`, title } : null;
}

/** Review cards in a one- or two-column grid; past `initial`, the rest open under a native disclosure. */
export function ReviewList({ reviews, label, initial = 4, productTitles, className }: ReviewListProps) {
  const first = reviews.slice(0, initial);
  const rest = reviews.slice(initial);
  const cards = (list: readonly Review[], delayed: boolean) =>
    list.map((review, i) => (
      <Reveal as="li" key={review.id} delay={delayed ? i * 0.05 : 0} className="min-w-0">
        <ReviewCard review={review} product={productOf(review, productTitles)} />
      </Reveal>
    ));

  return (
    <div className={cn('flex min-w-0 flex-col gap-4', className)}>
      <ul aria-label={label} className={GRID}>
        {cards(first, true)}
      </ul>
      {rest.length > 0 && (
        <details className="group flex flex-col gap-4">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 self-start rounded-pill px-1 text-sm font-semibold text-fg underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-accent-2 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">
              Show {rest.length} more {rest.length === 1 ? 'review' : 'reviews'}
            </span>
            <span className="hidden group-open:inline">Show fewer reviews</span>
            <ChevronDownIcon className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <ul aria-label={`${label}, older`} className={cn(GRID, 'mt-4')}>
            {cards(rest, false)}
          </ul>
        </details>
      )}
    </div>
  );
}
