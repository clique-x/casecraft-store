'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { formatInr } from '@/lib/catalog/photos';
import { useCart } from '@/lib/cart/cart-context';
import { CartLines } from './CartLines.client';
import { FreeShippingMeter } from './FreeShippingMeter';

export function CartPage() {
  const { cart, ready, enabled, error } = useCart();

  if (!ready) {
    return <div aria-busy="true" className="h-64 animate-pulse rounded-xl bg-surface-2" />;
  }

  if (!enabled || !cart || cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border px-6 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-surface-2 text-fg-muted">
          <ShoppingBag className="size-6" aria-hidden="true" />
        </span>
        <p className="text-lg font-bold text-fg">Your cart is empty</p>
        <p className="max-w-sm text-sm text-fg-muted">Pick your phone and add a cover you like. It stays in your cart for 30 days.</p>
        <Link
          href="/trending"
          className="inline-flex h-12 items-center rounded-[10px] bg-fg px-6 text-sm font-semibold text-paper hover:bg-[#2b2b2b]"
        >
          Shop trending covers
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
      <section aria-label="Items" className="lg:col-span-7">
        <CartLines lines={cart.lines} />
      </section>
      <aside className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 lg:sticky lg:top-24 lg:col-span-5">
        <FreeShippingMeter subtotal={cart.itemSubtotal - cart.discountTotal} />
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-fg-muted">Subtotal ({cart.count} {cart.count === 1 ? 'item' : 'items'})</dt>
            <dd className="font-semibold text-fg tabular-nums">{formatInr(cart.itemSubtotal)}</dd>
          </div>
          {cart.discountTotal > 0 && (
            <div className="flex justify-between">
              <dt className="text-fg-muted">Bundle saving</dt>
              <dd className="font-semibold text-success tabular-nums">−{formatInr(cart.discountTotal)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-fg-muted">Shipping</dt>
            <dd className="text-fg-muted">At checkout</dd>
          </div>
        </dl>
        {error && <p className="text-caption text-danger">{error}</p>}
        <Link
          href="/checkout"
          className="inline-flex h-13 items-center justify-center rounded-[10px] bg-fg text-[0.9375rem] font-semibold text-paper hover:bg-[#2b2b2b]"
        >
          Checkout · {formatInr(cart.itemSubtotal - cart.discountTotal)}
        </Link>
        <p className="text-center text-caption text-fg-muted">UPI, cards, netbanking or Cash on Delivery. Prices include GST.</p>
      </aside>
    </div>
  );
}
