'use client';

import { formatInr } from '@/lib/catalog/photos';
import { cn } from '@/lib/utils';

interface PriceTagProps {
  priceInr: number;
  /** "from ₹X": shown only while no model is chosen. */
  from?: boolean;
  /** Struck through beside the price, only when higher. */
  regularInr?: number;
  size?: 'lg' | 'md';
  className?: string;
}

export function PriceTag({ priceInr, from = false, regularInr, size = 'lg', className }: PriceTagProps) {
  const struck = regularInr !== undefined && regularInr > priceInr;
  return (
    <p className={cn('flex items-baseline gap-1.5 text-fg tabular-nums', className)}>
      {from && <span className={cn('text-fg-muted', size === 'lg' ? 'text-sm' : 'text-caption')}>from</span>}
      <span
        className={cn('font-sans font-bold tracking-[-0.01em]', size === 'lg' ? 'text-3xl leading-none' : 'text-xl leading-none')}
      >
        {formatInr(priceInr)}
      </span>
      {struck && (
        <s className={cn('text-fg-muted', size === 'lg' ? 'text-sm' : 'text-caption')}>{formatInr(regularInr)}</s>
      )}
    </p>
  );
}

export default PriceTag;
