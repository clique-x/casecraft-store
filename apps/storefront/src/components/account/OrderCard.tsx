import Link from 'next/link';
import { Check, Truck } from 'lucide-react';
import { formatInr } from '@/lib/catalog/photos';
import { ORDER_STEPS, orderStep, type AccountOrder } from '@/lib/account/types';
import { cn } from '@/lib/utils';

export const orderDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** One order in My orders: its progress, what is in it, the total and the courier's tracking. */
export function OrderCard({ order }: { order: AccountOrder }) {
  const canceled = order.status === 'canceled';
  const step = orderStep(order);
  const tracking = order.shipments.filter((s) => s.trackingNumber || s.trackingUrl);
  const shown = order.items.slice(0, 4);

  return (
    <article className="rounded-xl border border-border p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-base font-extrabold text-fg">Order #{order.displayId}</h3>
        <p className="text-sm text-fg-muted tabular-nums">
          {orderDate(order.createdAt)} · {formatInr(order.total)}
        </p>
      </div>

      {canceled ? (
        <p className="mt-4 rounded-[10px] bg-danger/8 px-3 py-2.5 text-sm text-danger">This order was cancelled.</p>
      ) : (
        <ol className="mt-4 grid grid-cols-4 gap-2" aria-label={`Status: ${ORDER_STEPS[step]}`}>
          {ORDER_STEPS.map((label, i) => (
            <li key={label} className="flex flex-col gap-1.5">
              <span className={cn('h-1.5 rounded-full', i <= step ? 'bg-brand' : 'bg-surface-2')} />
              <span className={cn('flex items-center gap-1 text-[0.6875rem] font-semibold sm:text-caption', i <= step ? 'text-fg' : 'text-fg-muted')}>
                {i <= step && <Check className="size-3.5 shrink-0 text-brand" aria-hidden="true" />}
                {label}
              </span>
            </li>
          ))}
        </ol>
      )}

      <ul className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
        {shown.map((item) => (
          <li key={item.id} className="flex items-center gap-3 text-sm">
            <div className="h-14 w-11 shrink-0 overflow-hidden rounded-md bg-surface-2">
              {item.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element -- Medusa thumbnail URL, small fixed size
                <img src={item.thumbnail} alt="" width={44} height={56} loading="lazy" className="size-full object-contain" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-fg">{item.title}</p>
              <p className="truncate text-caption text-fg-muted">
                {item.variantTitle ? `${item.variantTitle} · ` : ''}Qty {item.quantity}
              </p>
            </div>
          </li>
        ))}
        {order.items.length > shown.length && (
          <li className="text-caption text-fg-muted">and {order.items.length - shown.length} more</li>
        )}
      </ul>

      {tracking.length > 0 && (
        <div className="mt-4 flex flex-col gap-1.5 rounded-[10px] bg-surface-2 px-3.5 py-3 text-sm">
          {tracking.map((t) => (
            <p key={t.fulfillmentId} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-fg">
              <Truck className="size-4 text-brand" aria-hidden="true" />
              {t.trackingNumber && (
                <span>
                  Tracking <strong className="tabular-nums">{t.trackingNumber}</strong>
                </span>
              )}
              {t.trackingUrl && (
                <a href={t.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline-offset-4 hover:underline">
                  Track with the courier
                </a>
              )}
            </p>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
        <span className="text-fg-muted">
          {order.paidOnline ? 'Paid online' : canceled ? 'Cash on Delivery' : `Cash on Delivery · ${formatInr(order.total)} to pay`}
        </span>
        <Link href={`/account/orders/${order.id}`} className="font-semibold text-brand underline-offset-4 hover:underline">
          View receipt
        </Link>
      </div>
    </article>
  );
}
