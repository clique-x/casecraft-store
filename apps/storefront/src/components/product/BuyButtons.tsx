import { cn } from '@/lib/utils';

const BASE =
  'inline-flex h-13 min-w-0 items-center justify-center gap-2 rounded-[10px] px-4 text-[0.9375rem] font-semibold tracking-[-0.005em] whitespace-nowrap transition-colors duration-(--dur-micro) outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

interface BuyButtonsProps {
  /** wa.me link that orders the selected variant (or asks to be notified when it is sold out). */
  orderHref: string;
  soldOut: boolean;
  /** Shown inside Buy now, e.g. "₹1,149"; the sticky bar uses it on phones where there is no price column. */
  priceLabel?: string;
  className?: string;
}

/**
 * Add to cart + Buy now, shared by the buy box and the sticky bar. Until the Medusa cart and
 * checkout exist, Buy now places the order on WhatsApp and Add to cart is visibly unavailable.
 */
export function BuyButtons({ orderHref, soldOut, priceLabel, className }: BuyButtonsProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-2.5', className)}>
      <button
        type="button"
        aria-disabled="true"
        title="Cart is coming soon. Use Buy now to order."
        onClick={(e) => e.preventDefault()}
        className={cn(BASE, 'cursor-not-allowed border border-border bg-paper text-fg-muted')}
      >
        Add to cart
        <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[0.625rem] font-bold tracking-wide text-fg-muted uppercase">
          Soon
        </span>
      </button>
      <a
        href={orderHref}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          BASE,
          soldOut
            ? 'border border-fg bg-paper text-fg hover:bg-surface-2'
            : 'bg-fg text-paper shadow-[0_1px_2px_color-mix(in_srgb,var(--color-shadow)_20%,transparent)] hover:bg-[#2b2b2b]',
        )}
      >
        {soldOut ? 'Notify me' : 'Buy now'}
        {!soldOut && priceLabel && <span className="font-medium text-paper/70 tabular-nums">· {priceLabel}</span>}
      </a>
    </div>
  );
}
