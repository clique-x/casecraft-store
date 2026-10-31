import type { Metadata } from 'next';
import { TrackOrder } from '@/components/checkout/TrackOrder.client';
import { WHATSAPP_NUMBER } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Track your order',
  description: 'Check where your order is with your order number and the email or phone you ordered with.',
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-24 pb-16 sm:px-6 lg:pt-28">
      <h1 className="font-display text-h2 font-extrabold text-fg">Track your order</h1>
      <p className="mt-3 text-body text-fg-muted">
        Your order number is in the confirmation email and on the page you saw after paying. No account needed.
      </p>
      <div className="mt-8">
        <TrackOrder />
      </div>
      <p className="mt-8 text-sm text-fg-muted">
        Can&rsquo;t find your order number?{' '}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand underline-offset-4 hover:underline"
        >
          WhatsApp us
        </a>{' '}
        with the phone number you ordered from.
      </p>
    </div>
  );
}
