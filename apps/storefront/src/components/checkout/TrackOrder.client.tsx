'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { formatInr } from '@/lib/catalog/photos';
import { trackOrder, type TrackedOrder } from '@/lib/cart/track';
import { cn } from '@/lib/utils';

const INPUT =
  'h-12 w-full rounded-[10px] border border-border bg-paper px-3.5 text-base text-fg outline-none transition-colors focus:border-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand';

const STEPS = ['Order placed', 'Packed', 'Shipped', 'Delivered'] as const;

/** How far along the four customer-facing steps the order is, from Medusa's statuses. */
function stepOf(order: TrackedOrder): number {
  const f = order.fulfillmentStatus;
  if (f === 'delivered' || f === 'partially_delivered') return 3;
  if (f === 'shipped' || f === 'partially_shipped') return 2;
  if (f === 'fulfilled' || f === 'partially_fulfilled') return 1;
  return 0;
}

export function TrackOrder() {
  const [orderNo, setOrderNo] = useState('');
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await trackOrder(orderNo, contact);
    setBusy(false);
    if (res.ok) setOrder(res.value);
    else {
      setOrder(null);
      setError(res.error);
    }
  };

  const canceled = order?.status === 'canceled';
  const step = order ? stepOf(order) : 0;

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={submit} className="grid gap-4 rounded-xl border border-border p-5 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
          Order number
          <input className={INPUT} required inputMode="numeric" placeholder="e.g. 1042" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-fg">
          Email or mobile number
          <input className={INPUT} required placeholder="you@example.com or 98XXXXXXXX" value={contact} onChange={(e) => setContact(e.target.value)} />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-fg px-6 text-sm font-semibold text-paper hover:bg-[#2b2b2b] disabled:bg-fg/50"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Track order
        </button>
        {error && (
          <p role="alert" className="text-sm text-danger sm:col-span-3">
            {error}
          </p>
        )}
      </form>

      {order && (
        <section aria-live="polite" className="rounded-xl border border-border p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-extrabold text-fg">Order #{order.displayId}</h2>
            <p className="text-sm text-fg-muted">
              Placed {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {order.city ? ` · to ${order.city}` : ''} · {formatInr(order.total)}
            </p>
          </div>

          {canceled ? (
            <p className="mt-5 rounded-[10px] bg-danger/8 px-3 py-2.5 text-sm text-danger">This order was cancelled.</p>
          ) : (
            <ol className="mt-6 grid grid-cols-4 gap-2">
              {STEPS.map((label, i) => (
                <li key={label} className="flex flex-col gap-2">
                  <span className={cn('h-1.5 rounded-full', i <= step ? 'bg-brand' : 'bg-surface-2')} />
                  <span className={cn('flex items-center gap-1 text-caption font-semibold', i <= step ? 'text-fg' : 'text-fg-muted')}>
                    {i <= step && <Check className="size-3.5 text-brand" aria-hidden="true" />}
                    {label}
                  </span>
                </li>
              ))}
            </ol>
          )}

          {order.tracking.some((t) => t.number) && (
            <div className="mt-5 text-sm">
              {order.tracking
                .filter((t) => t.number)
                .map((t) => (
                  <p key={t.number} className="text-fg">
                    Tracking number <strong>{t.number}</strong>
                    {t.url && (
                      <>
                        {' · '}
                        <a href={t.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline-offset-4 hover:underline">
                          Track with the courier
                        </a>
                      </>
                    )}
                  </p>
                ))}
            </div>
          )}

          <ul className="mt-5 divide-y divide-border border-t border-border">
            {order.items.map((item, i) => (
              <li key={`${item.title}-${i}`} className="flex items-center gap-3 py-3 text-sm">
                <div className="h-14 w-11 shrink-0 overflow-hidden rounded-md bg-surface-2">
                  {item.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element -- Medusa thumbnail URL, small fixed size
                    <img src={item.thumbnail} alt="" width={44} height={56} className="size-full object-contain" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-fg">{item.title}</p>
                  {item.variantTitle && <p className="text-caption text-fg-muted">{item.variantTitle}</p>}
                </div>
                <span className="text-fg-muted tabular-nums">× {item.quantity}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
