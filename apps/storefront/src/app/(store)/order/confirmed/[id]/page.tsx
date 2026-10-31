import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { ClearCart } from '@/components/checkout/ClearCart.client';
import { DISPATCH_WINDOW, WHATSAPP_NUMBER } from '@/lib/brand';
import { formatInr } from '@/lib/catalog/photos';
import { getOrder } from '@/lib/cart/orders';

export const metadata: Metadata = {
  title: 'Order confirmed',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: Props) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-24 pb-16 sm:px-6 lg:pt-28">
      <Suspense fallback={<div aria-busy="true" className="h-96 animate-pulse rounded-xl bg-surface-2" />}>
        <Confirmation params={params} />
      </Suspense>
    </div>
  );
}

async function Confirmation({ params }: Props) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! A question about my order #${order.displayId}.`)}`;
  return (
    <>
      <ClearCart />
      <div className="flex flex-col items-start gap-3">
        <CheckCircle2 className="size-10 text-success" aria-hidden="true" />
        <h1 className="font-display text-h2 font-extrabold text-fg">Thank you, your order is placed</h1>
        <p className="text-body text-fg-muted">
          Order <strong className="text-fg">#{order.displayId}</strong>
          {order.email ? <> · placed with {order.email}</> : null}. We dispatch in {DISPATCH_WINDOW}. Keep your order
          number to track it.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-border">
        <ul className="divide-y divide-border px-5">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              <div className="h-16 w-13 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                {item.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element -- Medusa thumbnail URL, small fixed size
                  <img src={item.thumbnail} alt="" width={52} height={64} className="size-full object-contain" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-fg">{item.title}</p>
                <p className="text-caption text-fg-muted">
                  {item.variantTitle ? `${item.variantTitle} · ` : ''}Qty {item.quantity}
                </p>
              </div>
              <p className="text-sm font-bold text-fg tabular-nums">{formatInr(item.total)}</p>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-2 border-t border-border px-5 py-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-fg-muted">Subtotal</dt>
            <dd className="tabular-nums">{formatInr(order.itemSubtotal)}</dd>
          </div>
          {order.discountTotal > 0 && (
            <div className="flex justify-between">
              <dt className="text-fg-muted">Discount</dt>
              <dd className="text-success tabular-nums">−{formatInr(order.discountTotal)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-fg-muted">Delivery</dt>
            <dd className="tabular-nums">{order.shippingTotal === 0 ? 'Free' : formatInr(order.shippingTotal)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base font-extrabold">
            <dt>{order.paid ? 'Paid' : 'To pay on delivery'}</dt>
            <dd className="tabular-nums">{formatInr(order.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {order.address && (
          <div className="rounded-xl border border-border p-5 text-sm">
            <p className="font-bold text-fg">Delivering to</p>
            <p className="mt-2 text-fg">{order.address.name}</p>
            {order.address.lines.map((l) => (
              <p key={l} className="text-fg-muted">
                {l}
              </p>
            ))}
            {order.address.phone && <p className="mt-1 text-fg-muted">{order.address.phone}</p>}
          </div>
        )}
        <div className="rounded-xl border border-border p-5 text-sm">
          <p className="font-bold text-fg">Payment</p>
          <p className="mt-2 text-fg-muted">{order.paymentLabel}</p>
          <p className="mt-4 font-bold text-fg">Track it any time</p>
          <p className="mt-1 text-fg-muted">
            Use your order number and email on the{' '}
            <Link href="/account" className="font-semibold text-brand underline-offset-4 hover:underline">
              order tracking page
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/trending" className="inline-flex h-12 items-center justify-center rounded-[10px] bg-fg px-6 text-sm font-semibold text-paper hover:bg-[#2b2b2b]">
          Continue shopping
        </Link>
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-border px-6 text-sm font-semibold text-fg hover:bg-surface-2"
        >
          <MessageCircle className="size-4 text-whatsapp" aria-hidden="true" />
          Questions? WhatsApp us
        </a>
      </div>
    </>
  );
}
