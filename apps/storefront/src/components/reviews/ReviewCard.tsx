import Link from 'next/link';
import { BadgeCheckIcon, GlobeIcon, MailIcon, MessageCircleIcon, type LucideIcon } from 'lucide-react';
import { formatReviewDate, REVIEW_SOURCE_LABEL, type Review, type ReviewSource } from '@/lib/content/reviews';
import { Stars } from './Stars';

const SOURCE_ICON: Record<ReviewSource, LucideIcon> = {
  google: GlobeIcon,
  whatsapp: MessageCircleIcon,
  store: MailIcon,
};

const TAG = 'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-caption font-semibold [&_svg]:size-3.5 [&_svg]:shrink-0';

interface ReviewCardProps {
  review: Review;
  /** The reviewed product, linked under the text; leave out on its own product page. */
  product?: { href: string; title: string } | null;
}

/** One review as the customer wrote it, with who, when and where it was written. */
export function ReviewCard({ review, product }: ReviewCardProps) {
  const SourceIcon = SOURCE_ICON[review.source];
  return (
    <article className="flex h-full min-w-0 flex-col gap-3 rounded-card border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Stars value={review.rating} />
        <time dateTime={review.date} className="text-caption text-fg-muted tabular-nums">
          {formatReviewDate(review.date)}
        </time>
      </div>

      {review.title && <h3 className="text-base leading-snug font-bold break-words text-fg">{review.title}</h3>}
      <p className="text-body break-words whitespace-pre-line text-fg">{review.body}</p>

      {product && (
        <p className="text-sm text-fg-muted">
          Review of{' '}
          <Link
            href={product.href}
            className="rounded-sm font-semibold text-accent-text underline underline-offset-4 outline-none hover:text-fg focus-visible:ring-3 focus-visible:ring-accent-2"
          >
            {product.title}
          </Link>
        </p>
      )}

      <footer className="mt-auto flex flex-col gap-2.5 border-t border-border pt-3">
        <p className="text-sm break-words">
          <span className="font-semibold text-fg">{review.displayName}</span>
          {review.city && <span className="text-fg-muted">, {review.city}</span>}
        </p>
        <ul aria-label="Where this review comes from" className="flex flex-wrap gap-2">
          <li className={`${TAG} bg-surface-2 text-fg-muted`}>
            <SourceIcon aria-hidden="true" />
            {REVIEW_SOURCE_LABEL[review.source]}
          </li>
          {review.verifiedPurchase && (
            <li className={`${TAG} bg-brand/8 text-brand`}>
              <BadgeCheckIcon aria-hidden="true" />
              Verified purchase
            </li>
          )}
        </ul>
      </footer>
    </article>
  );
}
