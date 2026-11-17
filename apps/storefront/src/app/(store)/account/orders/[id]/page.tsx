import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PrintButton } from '@/components/account/PrintButton.client';
import { orderDate } from '@/components/account/OrderCard';
import { BRAND_NAME, BUSINESS, BUSINESS_ADDRESS, SITE_URL } from '@/lib/brand';
import { formatInr } from '@/lib/catalog/photos';
import { getAccountOrder, sessionToken } from '@/lib/account/session';

export const metadata: Metadata = {
  title: 'Order receipt',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: Props) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-24 pb-16 sm:px-6 lg:pt-28 print:p-0">
      <Suspense fallback={<div aria-busy="true" className="h-96 animate-pulse rounded-xl bg-surface-2" />}>
        <Receipt params={params} />
      </Suspense>
    </div>
  );
}

async function Receipt({ params }: Props) {
  const { id } = await params;
  if (!(await sessionToken())) redirect('/account');
  const order = await getAccountOrder(id);
  if (!order) notFound();
  const a = order.address;

  return (
    <>
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg underline-offset-4 hover:underline print:hidden">
        <ArrowLeft className="size-4" aria-hidden="true" />
        My orders
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-h2 font-extrabold text-fg">Order receipt</h1>
          <p className="mt-1 text-body text-fg-muted">
            Order <strong className="text-fg">#{order.displayId}</strong> · {orderDate(order.createdAt)}
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="mt-8 grid gap-6 rounded-xl border border-border p-5 text-sm sm:grid-cols-2">
        <div>
          <p className="font-bold text-fg">Sold by</p>
          <p className="mt-1 text-fg">
            {BUSINESS.name} ({BRAND_NAME})
          </p>
          <p className="text-fg-muted">{BUSINESS_ADDRESS}</p>
          <p className="text-fg-muted">
            {BUSINESS.phone.label} · {SITE_URL.replace('https://', '')}
          </p>
          {BUSINESS.gstin && <p className="mt-1 text-fg">GSTIN {BUSINESS.gstin}</p>}
        </div>
        {a && (
          <div>
            <p className="font-bold text-fg">Delivered to</p>
            <p className="mt-1 text-fg">{`${a.firstName} ${a.lastName}`.trim()}</p>
            <p className="text-fg-muted">{[a.address1, a.address2].filter(Boolean).join(', ')}</p>
            <p className="text-fg-muted">
              {a.city}, {a.province} {a.postalCode}
            </p>
            {a.phone && <p className="text-fg-muted tabular-nums">+91 {a.phone.replace(/^\+91/, '')}</p>}
            {order.email && <p className="break-all text-fg-muted">{order.email}</p>}
          </div>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-caption text-fg-muted">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-semibold">
                Item
              </th>
              <th scope="col" className="px-2 py-2.5 text-right font-semibold">
                Qty
              </th>
              <th scope="col" className="hidden px-2 py-2.5 text-right font-semibold sm:table-cell">
                Price
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {order.items.map((i) => (
              <tr key={i.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-fg">{i.title}</p>
                  {i.variantTitle && <p className="text-caption text-fg-muted">{i.variantTitle}</p>}
                </td>
                <td className="px-2 py-3 text-right tabular-nums">{i.quantity}</td>
                <td className="hidden px-2 py-3 text-right tabular-nums sm:table-cell">{formatInr(i.unitPrice)}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatInr(i.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="flex flex-col gap-2 border-t border-border px-4 py-4 text-sm">
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
            <dt>{order.status === 'canceled' ? 'Total (cancelled)' : order.paidOnline ? 'Paid online' : 'Cash on Delivery'}</dt>
            <dd className="tabular-nums">{formatInr(order.total)}</dd>
          </div>
        </dl>
      </div>

      <p className="mt-4 text-caption text-fg-muted">Order receipt for your records. Questions about it? WhatsApp us with the order number.</p>
    </>
  );
}
