import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MapPin, ShieldCheck } from 'lucide-react';
import { EmailSignIn } from '@/components/account/EmailSignIn.client';
import { OrderCard } from '@/components/account/OrderCard';
import { SignOutButton } from '@/components/account/SignOutButton.client';
import { TrackOrder } from '@/components/checkout/TrackOrder.client';
import { WHATSAPP_NUMBER } from '@/lib/brand';
import { emailSignInAvailable } from '@/lib/account/actions';
import { getAccount } from '@/lib/account/session';
import type { Account } from '@/lib/account/types';

export const metadata: Metadata = {
  title: 'My orders',
  description: 'Sign in with your email to see your orders, tracking and saved addresses, or track an order with its number.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-24 pb-16 sm:px-6 lg:pt-28">
      <Suspense fallback={<div aria-busy="true" className="h-96 animate-pulse rounded-xl bg-surface-2" />}>
        <AccountView />
      </Suspense>
    </div>
  );
}

async function AccountView() {
  const [account, canSignIn] = await Promise.all([getAccount(), emailSignInAvailable()]);
  return account ? <MyOrders account={account} /> : <SignedOut canSignIn={canSignIn} />;
}

const WhatsAppHelp = () => (
  <p className="mt-8 text-sm text-fg-muted">
    Can&rsquo;t find an order?{' '}
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
);

function SignedOut({ canSignIn }: { canSignIn: boolean }) {
  if (!canSignIn) {
    // Email is not set up on the backend yet: order tracking only.
    return (
      <>
        <h1 className="font-display text-h2 font-extrabold text-fg">Track your order</h1>
        <p className="mt-3 text-body text-fg-muted">
          Your order number is on the page you saw after placing the order. Enter it with the email or phone you ordered with.
        </p>
        <div className="mt-8">
          <TrackOrder />
        </div>
        <WhatsAppHelp />
      </>
    );
  }
  return (
    <>
      <h1 className="font-display text-h2 font-extrabold text-fg">My orders</h1>
      <p className="mt-3 text-body text-fg-muted">
        Every order you place makes an account for your email. Sign in with that email to see all your orders, their tracking and
        your saved addresses.
      </p>
      <section aria-labelledby="signin-heading" className="mt-8 rounded-xl border border-border p-5">
        <h2 id="signin-heading" className="flex items-center gap-2 text-lg font-extrabold text-fg">
          <ShieldCheck className="size-5 text-brand" aria-hidden="true" />
          Sign in with a code, no password
        </h2>
        <p className="mt-1 mb-4 text-sm text-fg-muted">We email you a 6-digit code. You stay signed in on this device for 30 days.</p>
        <EmailSignIn />
      </section>

      <section aria-labelledby="track-heading" className="mt-10">
        <h2 id="track-heading" className="text-lg font-extrabold text-fg">
          Or track one order without signing in
        </h2>
        <p className="mt-1 mb-4 text-sm text-fg-muted">The order number is in your order email and on the page you saw after ordering.</p>
        <TrackOrder />
      </section>
      <WhatsAppHelp />
    </>
  );
}

function MyOrders({ account }: { account: Account }) {
  const name = account.firstName.trim();
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-h2 font-extrabold text-fg">{name ? `Hi ${name}, your orders` : 'My orders'}</h1>
        <p className="text-sm text-fg-muted">
          <span className="break-all">{account.email}</span> · <SignOutButton />
        </p>
      </div>

      {account.orders.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border px-5 py-10 text-center">
          <p className="font-bold text-fg">No orders with this email yet</p>
          <p className="mt-1 text-sm text-fg-muted">Orders you place with {account.email} show up here.</p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {account.orders.map((o) => (
            <li key={o.id}>
              <OrderCard order={o} />
            </li>
          ))}
        </ul>
      )}

      {account.addresses.length > 0 && (
        <section aria-labelledby="addresses-heading" className="mt-12">
          <h2 id="addresses-heading" className="text-lg font-extrabold text-fg">
            Saved addresses
          </h2>
          <p className="mt-1 text-sm text-fg-muted">From your orders. Checkout offers them while you are signed in.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {account.addresses.map((a) => (
              <li key={a.id} className="flex gap-3 rounded-xl border border-border p-4 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-semibold text-fg">{`${a.firstName} ${a.lastName}`.trim()}</p>
                  <p className="text-fg-muted">{[a.address1, a.address2].filter(Boolean).join(', ')}</p>
                  <p className="text-fg-muted">
                    {a.city}, {a.province} {a.postalCode}
                  </p>
                  {a.phone && <p className="text-fg-muted tabular-nums">+91 {a.phone.replace(/^\+91/, '')}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="group mt-12 rounded-xl border border-border p-5">
        <summary className="cursor-pointer text-sm font-semibold text-fg">Track an order placed with a different email</summary>
        <div className="mt-4">
          <TrackOrder />
        </div>
      </details>
      <WhatsAppHelp />
    </>
  );
}
