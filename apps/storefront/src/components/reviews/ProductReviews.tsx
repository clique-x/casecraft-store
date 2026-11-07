import { MessageSquareQuoteIcon } from 'lucide-react';
import { AccentBar } from '@/components/brand/AccentBar';
import { reviewsForProduct, summarizeReviews } from '@/lib/content/reviews';
import type { HomeProduct } from '@/lib/medusa/fixtures';
import { cn } from '@/lib/utils';
import { RatingSummary } from './RatingSummary';
import { WhatsAppReviewLink } from './ReviewLinks';
import { ReviewList } from './ReviewList';
import { reviewProductName } from './product-name';

interface ProductReviewsProps {
  /** Its handle is matched against `productHandle` in lib/content/reviews.ts. */
  product: Pick<HomeProduct, 'handle' | 'title' | 'photo'>;
  className?: string;
}

/** Reviews of one product with their summary; a one-line "No reviews yet" and a button when there are none. */
export function ProductReviews({ product, className }: ProductReviewsProps) {
  const reviews = reviewsForProduct(product.handle);
  const named = { name: reviewProductName(product), handle: product.handle };

  if (reviews.length === 0) {
    return (
      <section
        id="reviews"
        aria-labelledby="product-reviews-heading"
        className={cn(
          'flex scroll-mt-24 flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5',
          className,
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-accent-text">
            <MessageSquareQuoteIcon className="size-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="product-reviews-heading" className="text-caption font-semibold tracking-wide text-fg-muted uppercase">
              Customer reviews
            </h2>
            <p className="mt-1 text-sm font-medium text-fg">No reviews yet. Bought this? Tell other buyers how it went.</p>
          </div>
        </div>
        <WhatsAppReviewLink product={named} tone="ghost" className="h-11 w-full px-5 text-sm sm:w-auto">
          Write a review
        </WhatsAppReviewLink>
      </section>
    );
  }

  return (
    <section id="reviews" aria-labelledby="product-reviews-heading" className={cn('scroll-mt-24 text-fg', className)}>
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-10">
        <div className="lg:sticky lg:top-24 lg:col-span-4">
          <h2 id="product-reviews-heading" className="font-display text-h2 text-balance">
            Customer reviews
          </h2>
          <AccentBar className="mt-4" />
          <div className="mt-6 rounded-card bg-surface-2 p-5 sm:p-6">
            <RatingSummary summary={summarizeReviews(reviews)} />
            <WhatsAppReviewLink product={named} tone="ghost" className="mt-5 w-full">
              Write a review
            </WhatsAppReviewLink>
          </div>
        </div>
        <ReviewList reviews={reviews} label={`Reviews of the ${named.name}`} initial={4} className="lg:col-span-8" />
      </div>
    </section>
  );
}
