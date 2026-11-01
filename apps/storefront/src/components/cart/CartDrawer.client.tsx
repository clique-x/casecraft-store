'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatInr } from '@/lib/catalog/photos';
import { useCart } from '@/lib/cart/cart-context';
import { CartLines } from './CartLines.client';
import { FreeShippingMeter } from './FreeShippingMeter';

/** Slide-out cart, opened by Add to cart and the header bag. */
export function CartDrawer() {
  const { cart, drawerOpen, setDrawerOpen, error } = useCart();
  const close = () => setDrawerOpen(false);
  const empty = !cart || cart.lines.length === 0;

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent side="right" className="w-full gap-0 bg-paper p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="text-lg font-extrabold text-fg">
            Your cart{cart && cart.count > 0 ? ` (${cart.count})` : ''}
          </SheetTitle>
          <SheetDescription className="sr-only">Covers in your cart</SheetDescription>
        </SheetHeader>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-surface-2 text-fg-muted">
              <ShoppingBag className="size-6" aria-hidden="true" />
            </span>
            <p className="text-base font-semibold text-fg">Your cart is empty</p>
            <Link
              href="/trending"
              onClick={close}
              className="inline-flex h-11 items-center rounded-[10px] bg-fg px-5 text-sm font-semibold text-paper hover:bg-[#2b2b2b]"
            >
              Shop trending covers
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-border px-5 py-3">
              <FreeShippingMeter subtotal={cart.itemSubtotal - cart.discountTotal} />
            </div>
            <div className="flex-1 overflow-y-auto px-5">
              <CartLines lines={cart.lines} onNavigate={close} />
            </div>
            <div className="flex flex-col gap-3 border-t border-border px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {error && <p className="text-caption text-danger">{error}</p>}
              {cart.discountTotal > 0 && (
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-fg-muted">Bundle saving</span>
                  <span className="font-semibold text-success tabular-nums">−{formatInr(cart.discountTotal)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-fg-muted">Subtotal</span>
                <span className="text-lg font-extrabold text-fg tabular-nums">{formatInr(cart.itemSubtotal - cart.discountTotal)}</span>
              </div>
              <p className="text-caption text-fg-muted">Shipping is calculated at checkout. Prices include GST.</p>
              <Link
                href="/checkout"
                onClick={close}
                className="inline-flex h-13 items-center justify-center rounded-[10px] bg-fg text-[0.9375rem] font-semibold text-paper hover:bg-[#2b2b2b]"
              >
                Checkout
              </Link>
              <Link href="/cart" onClick={close} className="text-center text-sm font-semibold text-fg underline-offset-4 hover:underline">
                View cart
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
