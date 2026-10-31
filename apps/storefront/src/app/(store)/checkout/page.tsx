import type { Metadata } from 'next';
import Link from 'next/link';
import { Checkout } from '@/components/checkout/Checkout.client';

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-24 pb-16 sm:px-6 lg:px-8 lg:pt-28">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-h2 font-extrabold text-fg">Checkout</h1>
        <Link href="/cart" className="text-sm font-semibold text-fg underline-offset-4 hover:underline">
          Back to cart
        </Link>
      </div>
      <div className="mt-8">
        <Checkout />
      </div>
    </div>
  );
}
