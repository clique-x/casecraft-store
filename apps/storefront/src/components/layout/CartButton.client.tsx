'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart/cart-context';

/** Header bag: opens the drawer (the link to /cart is the no-JS fallback) and shows the item count. */
export function CartButton({ className }: { className: string }) {
  const { cart, enabled, setDrawerOpen } = useCart();
  const count = cart?.count ?? 0;
  return (
    <Link
      href="/cart"
      className={`relative ${className}`}
      aria-label={count > 0 ? `Cart, ${count} ${count === 1 ? 'item' : 'items'}` : 'Cart'}
      onClick={(e) => {
        if (!enabled) return;
        e.preventDefault();
        setDrawerOpen(true);
      }}
    >
      <ShoppingBag className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-brand-coral px-1 text-[0.625rem] font-bold text-fg tabular-nums">
          {count}
        </span>
      )}
    </Link>
  );
}
