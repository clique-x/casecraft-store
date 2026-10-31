'use client';

import { CheckIcon, CircleSlashIcon, TriangleAlertIcon, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** At or below this many units the line switches to "Only N left". */
export const LOW_STOCK_MAX = 3;

interface StockLineProps {
  /** Units for the selected variant; `null` while no model is chosen (the slot stays empty). */
  stock: number | null;
  className?: string;
}

interface StockState {
  label: string;
  /** Icon colour only: success/warn do not meet AA for text on the light surface. */
  tone: string;
  Icon: LucideIcon;
}

function stockState(stock: number): StockState {
  if (stock <= 0) return { label: 'Sold out', tone: 'text-fg-muted', Icon: CircleSlashIcon };
  if (stock <= LOW_STOCK_MAX) return { label: `Only ${stock} left`, tone: 'text-warn', Icon: TriangleAlertIcon };
  return { label: 'In stock', tone: 'text-success', Icon: CheckIcon };
}

export function StockLine({ stock, className }: StockLineProps) {
  const state = stock === null ? null : stockState(stock);
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn('flex min-h-5 items-center gap-1.5 text-sm font-medium text-fg tabular-nums', className)}
    >
      {state && (
        <>
          <state.Icon className={cn('size-4 shrink-0', state.tone)} aria-hidden="true" />
          {state.label}
        </>
      )}
    </p>
  );
}

export default StockLine;
