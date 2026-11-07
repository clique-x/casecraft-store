import { ArrowUpRightIcon, MessageCircleIcon } from 'lucide-react';
import { GHOST_BTN, PRIMARY_BTN } from '@/components/home/hub/hub-styles';
import { BUSINESS } from '@/lib/brand';
import { reviewOnWhatsAppHref } from '@/lib/content/reviews';
import { cn } from '@/lib/utils';

interface ReviewLinkProps {
  /** Filled (primary) or outlined. */
  tone?: 'primary' | 'ghost';
  className?: string;
}

/** "Review us on Google"; renders nothing until BUSINESS.googleReviewsUrl is set. */
export function GoogleReviewLink({ tone = 'primary', className, children = 'Review us on Google' }: ReviewLinkProps & { children?: string }) {
  const href = BUSINESS.googleReviewsUrl;
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn(tone === 'primary' ? PRIMARY_BTN : GHOST_BTN, className)}>
      {children}
      <ArrowUpRightIcon aria-hidden="true" />
      <span className="sr-only"> (opens Google in a new tab)</span>
    </a>
  );
}

/** Opens WhatsApp with a short review form prefilled, naming the product when there is one. */
export function WhatsAppReviewLink({
  product,
  tone = 'primary',
  className,
  children = 'Send a review on WhatsApp',
}: ReviewLinkProps & { product?: { name: string; handle: string }; children?: string }) {
  return (
    <a
      href={reviewOnWhatsAppHref(product)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(tone === 'primary' ? PRIMARY_BTN : GHOST_BTN, className)}
    >
      <MessageCircleIcon aria-hidden="true" />
      {children}
      <span className="sr-only"> (opens WhatsApp)</span>
    </a>
  );
}
