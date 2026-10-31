import type { Metadata } from 'next';
import { CartPage } from '@/components/cart/CartPage.client';

export const metadata: Metadata = {
  title: 'Your cart',
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-24 pb-16 sm:px-6 lg:px-8 lg:pt-28">
      <h1 className="font-display text-h2 font-extrabold text-fg">Your cart</h1>
      <div className="mt-6">
        <CartPage />
      </div>
    </div>
  );
}
