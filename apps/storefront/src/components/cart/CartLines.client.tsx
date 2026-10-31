'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatInr } from '@/lib/catalog/photos';
import { useCart } from '@/lib/cart/cart-context';
import type { CartLine } from '@/lib/cart/types';
import { cn } from '@/lib/utils';

const QTY_BTN =
  'grid size-8 place-items-center rounded-md text-fg transition-colors outline-none hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40';

function Thumb({ line }: { line: CartLine }) {
  return (
    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
      {line.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element -- Medusa thumbnail URL, small fixed size
        <img src={line.thumbnail} alt="" width={64} height={80} className="size-full object-contain" />
      ) : null}
    </div>
  );
}

/** Line items with quantity steppers; shared by the drawer, /cart and the checkout summary. */
export function CartLines({ lines, editable = true, onNavigate }: { lines: CartLine[]; editable?: boolean; onNavigate?: () => void }) {
  const { setQuantity, pending } = useCart();
  return (
    <ul className="divide-y divide-border">
      {lines.map((line) => (
        <li key={line.id} className="flex gap-3 py-4">
          <Thumb line={line} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {line.productHandle ? (
                  <Link
                    href={`/products/${line.productHandle}`}
                    onClick={onNavigate}
                    className="line-clamp-2 text-sm font-bold text-fg hover:underline"
                  >
                    {line.productTitle}
                  </Link>
                ) : (
                  <p className="line-clamp-2 text-sm font-bold text-fg">{line.productTitle}</p>
                )}
                {line.variantTitle && <p className="text-caption text-fg-muted">{line.variantTitle}</p>}
              </div>
              <p className="shrink-0 text-sm font-bold text-fg tabular-nums">{formatInr(line.total)}</p>
            </div>
            {editable ? (
              <div className="mt-auto flex items-center justify-between">
                <div className={cn('inline-flex items-center rounded-lg border border-border', pending && 'opacity-60')}>
                  <button
                    type="button"
                    aria-label={`One fewer ${line.productTitle}`}
                    className={QTY_BTN}
                    onClick={() => setQuantity(line.id, line.quantity - 1)}
                    disabled={line.quantity <= 1}
                  >
                    <Minus className="size-3.5" aria-hidden="true" />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`One more ${line.productTitle}`}
                    className={QTY_BTN}
                    onClick={() => setQuantity(line.id, line.quantity + 1)}
                    disabled={line.quantity >= 10}
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity(line.id, 0)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-caption font-medium text-fg-muted transition-colors outline-none hover:text-danger focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Remove
                </button>
              </div>
            ) : (
              <p className="mt-auto text-caption text-fg-muted tabular-nums">
                Qty {line.quantity} · {formatInr(line.unitPrice)} each
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
