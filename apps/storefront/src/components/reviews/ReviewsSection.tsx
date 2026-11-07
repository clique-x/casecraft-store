import { ArrowUpRightIcon } from 'lucide-react';
import { AccentBar } from '@/components/brand/AccentBar';
import { EYEBROW, SHELL, TEXT_LINK } from '@/components/home/hub/hub-styles';
import { Reveal } from '@/components/motion/Reveal.client';
import { BUSINESS } from '@/lib/brand';
import { allReviews, summarizeReviews, type Review } from '@/lib/content/reviews';
import { getProduct } from '@/lib/medusa/products';
import { cn } from '@/lib/utils';
import { RatingSummary } from './RatingSummary';
import { GoogleReviewLink, WhatsAppReviewLink } from './ReviewLinks';
import { ReviewList } from './ReviewList';
import { reviewProductName } from './product-name';

export interface ReviewsSectionProps {
  /** Review cards shown before "Show more"; the rest open in place. Default 4. */
  initial?: number;
  /** Classes on the outer <section>, e.g. to change the band colour or spacing. */
  className?: string;
}

/** Names of the products reviews point at; a handle that no longer resolves just loses its link. */
async function productTitles(reviews: readonly Review[]): Promise<Map<string, string>> {
  const handles = [...new Set(reviews.flatMap((r) => (r.productHandle ? [r.productHandle] : [])))];
  const products = await Promise.all(handles.map((handle) => getProduct(handle)));
  return new Map(products.flatMap((p) => (p ? [[p.handle, reviewProductName(p)] as const] : [])));
}

/**
 * Home page reviews: shop and product reviews with their average and star breakdown. With no reviews yet
 * it is a small invitation to write one, with no stars or counts.
 */
export async function ReviewsSection({ initial = 4, className }: ReviewsSectionProps) {
  const reviews = allReviews();
  if (reviews.length === 0) return <ReviewInvite className={className} />;

  const titles = await productTitles(reviews);
  return (
    <section id="reviews" aria-labelledby="reviews-heading" className={cn('scroll-mt-20 bg-paper py-14 text-fg lg:py-20', className)}>
      <div className={SHELL}>
        <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={EYEBROW}>Reviews</p>
            <h2 id="reviews-heading" className="mt-2 font-display text-h2 font-extrabold text-balance">
              What customers say
            </h2>
            <AccentBar className="mt-4" />
          </div>
          {BUSINESS.googleReviewsUrl && (
            <a href={BUSINESS.googleReviewsUrl} target="_blank" rel="noopener noreferrer" className={cn(TEXT_LINK, 'min-h-11 self-start sm:self-auto')}>
              Read our Google reviews <ArrowUpRightIcon aria-hidden="true" />
              <span className="sr-only"> (opens Google in a new tab)</span>
            </a>
          )}
        </Reveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-10">
          <Reveal className="rounded-card bg-surface-2 p-5 sm:p-6 lg:sticky lg:top-24 lg:col-span-4">
            <RatingSummary summary={summarizeReviews(reviews)} />
            <p className="mt-5 text-caption text-fg-muted">
              Newest first, in the customers&rsquo; own words. Each card says where the review was written.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <WhatsAppReviewLink tone="primary" className="w-full" />
              <GoogleReviewLink tone="ghost" className="w-full" />
            </div>
          </Reveal>
          <ReviewList reviews={reviews} label="Customer reviews" initial={initial} productTitles={titles} className="lg:col-span-8" />
        </div>
      </div>
    </section>
  );
}

/** The empty state: a compact band asking past buyers for a review. */
function ReviewInvite({ className }: { className?: string }) {
  const hasGoogle = BUSINESS.googleReviewsUrl !== null;
  return (
    <section id="reviews" aria-labelledby="reviews-heading" className={cn('scroll-mt-20 bg-paper py-10 text-fg lg:py-14', className)}>
      <div className={SHELL}>
        <Reveal className="flex flex-col gap-6 rounded-card border border-border bg-surface-2 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-xl">
            <p className={EYEBROW}>Reviews</p>
            <h2 id="reviews-heading" className="mt-2 font-display text-[clamp(1.5rem,1.2rem+1vw,2rem)] leading-[1.1] font-extrabold tracking-[-0.03em] text-balance">
              Bought from us? Tell others how it went
            </h2>
            <p className="mt-3 text-body text-fg-muted">
              A few honest lines help the next buyer choose. We only post a review here with your permission.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <GoogleReviewLink tone="primary" className="w-full sm:w-auto" />
            <WhatsAppReviewLink tone={hasGoogle ? 'ghost' : 'primary'} className="w-full sm:w-auto" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
