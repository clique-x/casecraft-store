'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, CreditCard, Loader2, Lock } from 'lucide-react';
import { CartLines } from '@/components/cart/CartLines.client';
import { BRAND_NAME } from '@/lib/brand';
import { formatInr } from '@/lib/catalog/photos';
import { getCheckoutOptions, placeOrder, saveCheckoutDetails, startPayment } from '@/lib/cart/actions';
import { useCart } from '@/lib/cart/cart-context';
import { INDIAN_STATES, lookupPincode } from '@/lib/cart/india';
import type { CartAddress, CheckoutOptions, RazorpayLaunch } from '@/lib/cart/types';
import { cn } from '@/lib/utils';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';
const BRAND_TEAL = '#0e6b76';

interface RazorpayInstance {
  open(): void;
  on(event: 'payment.failed', cb: (res: { error?: { description?: string } }) => void): void;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const EMPTY_ADDRESS: CartAddress = {
  firstName: '',
  lastName: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  province: '',
  postalCode: '',
};

const INPUT =
  'h-12 w-full rounded-[10px] border border-border bg-paper px-3.5 text-[0.9375rem] text-fg placeholder:text-fg-muted/70 outline-none transition-colors focus:border-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand';
const LABEL = 'flex flex-col gap-1.5 text-sm font-medium text-fg';

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn(LABEL, className)}>
      {label}
      {children}
    </label>
  );
}

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b border-border pb-8 last:border-0">
      <h2 className="flex items-center gap-3 text-lg font-extrabold text-fg">
        <span className="grid size-7 place-items-center rounded-full bg-fg text-sm text-paper">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Checkout() {
  const { cart, ready, enabled } = useCart();
  if (!ready) return <div aria-busy="true" className="h-96 animate-pulse rounded-xl bg-surface-2" />;
  if (!enabled || !cart || cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border px-6 py-16 text-center">
        <p className="text-lg font-bold text-fg">Your cart is empty</p>
        <Link href="/trending" className="inline-flex h-12 items-center rounded-[10px] bg-fg px-6 text-sm font-semibold text-paper hover:bg-[#2b2b2b]">
          Shop trending covers
        </Link>
      </div>
    );
  }
  // Keyed by cart so a different cart starts a fresh form, prefilled from what that cart saved.
  return <CheckoutForm key={cart.id} initialEmail={cart.email ?? ''} initialAddress={cart.address ?? EMPTY_ADDRESS} />;
}

function CheckoutForm({ initialEmail, initialAddress }: { initialEmail: string; initialAddress: CartAddress }) {
  const router = useRouter();
  const { cart, replace } = useCart();
  const [email, setEmail] = useState(initialEmail);
  const [address, setAddress] = useState<CartAddress>(initialAddress);
  const [options, setOptions] = useState<CheckoutOptions | null>(null);
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'idle' | 'saving' | 'paying' | 'placing'>('idle');
  const hasItems = Boolean(cart && cart.lines.length > 0);
  const itemSubtotal = cart?.itemSubtotal ?? 0;
  useEffect(() => {
    if (!hasItems) return;
    let cancelled = false;
    getCheckoutOptions().then((res) => {
      if (cancelled) return;
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOptions(res.value);
      setShippingId((cur) => cur ?? res.value.shipping[0]?.id ?? null);
      setProviderId((cur) => cur ?? res.value.payment[0]?.providerId ?? null);
    });
    return () => {
      cancelled = true;
    };
    // Re-read when the subtotal changes: free shipping depends on it.
  }, [hasItems, itemSubtotal]);

  // Pincode → city and state.
  useEffect(() => {
    const pin = address.postalCode.trim();
    if (!/^[1-9]\d{5}$/.test(pin)) return;
    const ctrl = new AbortController();
    lookupPincode(pin, ctrl.signal).then((found) => {
      if (!found) return;
      setAddress((a) => ({ ...a, city: a.city || found.city, province: found.state }));
    });
    return () => ctrl.abort();
  }, [address.postalCode]);

  const shipping = options?.shipping.find((s) => s.id === shippingId) ?? null;
  const payment = options?.payment.find((p) => p.providerId === providerId) ?? null;
  const shippingAmount = shipping?.amount ?? 0;
  const total = useMemo(() => (cart ? cart.itemSubtotal - cart.discountTotal + shippingAmount : 0), [cart, shippingAmount]);

  const set = (key: keyof CartAddress) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAddress((a) => ({ ...a, [key]: e.target.value }));

  const finish = async () => {
    setStage('placing');
    const placed = await placeOrder();
    if (!placed.ok) {
      setError(placed.error);
      setStage('idle');
      return;
    }
    // The confirmation page refreshes the cart (now empty); clearing it here would flash the empty state.
    router.push(`/order/confirmed/${placed.value.orderId}`);
  };

  const openRazorpay = async (launch: RazorpayLaunch) => {
    if (!(await loadRazorpay()) || !window.Razorpay) {
      setError('Could not load the payment window. Check your connection, or choose Cash on Delivery.');
      setStage('idle');
      return;
    }
    const rzp = new window.Razorpay({
      key: launch.keyId,
      order_id: launch.orderId,
      amount: launch.amount,
      currency: launch.currency,
      name: BRAND_NAME,
      description: `Order of ${cart?.count ?? 1} ${cart?.count === 1 ? 'cover' : 'covers'}`,
      prefill: { name: `${address.firstName} ${address.lastName}`.trim(), email, contact: `+91${address.phone}` },
      theme: { color: BRAND_TEAL },
      handler: () => void finish(),
      modal: {
        ondismiss: () => {
          setStage('idle');
          setError('Payment was not completed. You can try again or choose Cash on Delivery.');
        },
      },
    });
    rzp.on('payment.failed', (res) => {
      setError(res.error?.description ? `Payment failed: ${res.error.description}` : 'Payment failed. Please try again.');
    });
    rzp.open();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingId || !providerId || stage !== 'idle') return;
    setError(null);
    setStage('saving');
    const saved = await saveCheckoutDetails({ email, address, shippingOptionId: shippingId });
    if (!saved.ok) {
      setError(saved.error);
      setStage('idle');
      return;
    }
    replace(saved.value);
    const started = await startPayment(providerId);
    if (!started.ok) {
      setError(started.error);
      setStage('idle');
      return;
    }
    if (started.value) {
      setStage('paying');
      await openRazorpay(started.value);
    } else {
      await finish();
    }
  };

  if (!cart) return null;

  const busy = stage !== 'idle';
  const cta =
    stage === 'saving' ? 'Saving…' : stage === 'paying' ? 'Waiting for payment…' : stage === 'placing' ? 'Placing your order…'
      : payment?.kind === 'razorpay' ? `Pay ${formatInr(total)}` : `Place order · ${formatInr(total)}`;

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-12 lg:items-start" noValidate={false}>
      <div className="flex flex-col gap-8 lg:col-span-7">
        <Section step={1} title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <input className={INPUT} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Mobile number">
              <div className="flex">
                <span className="grid h-12 place-items-center rounded-l-[10px] border border-r-0 border-border bg-surface-2 px-3 text-sm text-fg-muted">+91</span>
                <input
                  className={cn(INPUT, 'rounded-l-none')}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  required
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  title="10-digit mobile number"
                  value={address.phone}
                  onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="98XXXXXXXX"
                />
              </div>
            </Field>
          </div>
          <p className="text-caption text-fg-muted">We send order updates here. The courier calls this number on delivery.</p>
        </Section>

        <Section step={2} title="Delivery address">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <input className={INPUT} autoComplete="given-name" required value={address.firstName} onChange={set('firstName')} />
            </Field>
            <Field label="Last name">
              <input className={INPUT} autoComplete="family-name" value={address.lastName} onChange={set('lastName')} />
            </Field>
            <Field label="Flat, house no., building" className="sm:col-span-2">
              <input className={INPUT} autoComplete="address-line1" required value={address.address1} onChange={set('address1')} />
            </Field>
            <Field label="Area, street, landmark (optional)" className="sm:col-span-2">
              <input className={INPUT} autoComplete="address-line2" value={address.address2} onChange={set('address2')} />
            </Field>
            <Field label="Pincode">
              <input
                className={INPUT}
                inputMode="numeric"
                autoComplete="postal-code"
                required
                pattern="[1-9][0-9]{5}"
                maxLength={6}
                title="6-digit pincode"
                value={address.postalCode}
                onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
              />
            </Field>
            <Field label="City">
              <input className={INPUT} autoComplete="address-level2" required value={address.city} onChange={set('city')} />
            </Field>
            <Field label="State" className="sm:col-span-2">
              <select className={INPUT} autoComplete="address-level1" required value={address.province} onChange={set('province')}>
                <option value="" disabled>
                  Choose your state
                </option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        <Section step={3} title="Delivery">
          {!options ? (
            <div className="h-16 animate-pulse rounded-[10px] bg-surface-2" />
          ) : options.shipping.length === 0 ? (
            <p className="text-sm text-danger">We cannot deliver to this cart right now. Please contact us on WhatsApp.</p>
          ) : (
            <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Delivery option">
              {options.shipping.map((s) => (
                <label
                  key={s.id}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 rounded-[10px] border p-4 transition-colors',
                    shippingId === s.id ? 'border-fg bg-surface-2/50' : 'border-border hover:border-fg/40',
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input type="radio" name="shipping" className="size-4 accent-[var(--color-fg)]" checked={shippingId === s.id} onChange={() => setShippingId(s.id)} />
                    <span>
                      <span className="block text-sm font-semibold text-fg">{s.name}</span>
                      {s.description && <span className="block text-caption text-fg-muted">{s.description}</span>}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-fg tabular-nums">{s.amount === 0 ? 'Free' : formatInr(s.amount)}</span>
                </label>
              ))}
            </div>
          )}
        </Section>

        <Section step={4} title="Payment">
          {!options ? (
            <div className="h-32 animate-pulse rounded-[10px] bg-surface-2" />
          ) : (
            <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Payment method">
              {options.payment.map((p) => (
                <label
                  key={p.providerId}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-[10px] border p-4 transition-colors',
                    providerId === p.providerId ? 'border-fg bg-surface-2/50' : 'border-border hover:border-fg/40',
                  )}
                >
                  <input type="radio" name="payment" className="size-4 accent-[var(--color-fg)]" checked={providerId === p.providerId} onChange={() => setProviderId(p.providerId)} />
                  <span className="grid size-9 place-items-center rounded-full bg-surface-2 text-fg">
                    {p.kind === 'razorpay' ? <CreditCard className="size-4.5" aria-hidden="true" /> : <Banknote className="size-4.5" aria-hidden="true" />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-fg">{p.label}</span>
                    <span className="block text-caption text-fg-muted">{p.description}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </Section>
      </div>

      <aside className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 lg:sticky lg:top-24 lg:col-span-5">
        <h2 className="text-lg font-extrabold text-fg">Order summary</h2>
        <div className="max-h-80 overflow-y-auto">
          <CartLines lines={cart.lines} editable={false} />
        </div>
        <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-fg-muted">Subtotal</dt>
            <dd className="font-semibold text-fg tabular-nums">{formatInr(cart.itemSubtotal)}</dd>
          </div>
          {cart.discountTotal > 0 && (
            <div className="flex justify-between">
              <dt className="text-fg-muted">Discount</dt>
              <dd className="font-semibold text-success tabular-nums">−{formatInr(cart.discountTotal)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-fg-muted">Delivery</dt>
            <dd className="font-semibold text-fg tabular-nums">{shipping ? (shippingAmount === 0 ? 'Free' : formatInr(shippingAmount)) : '—'}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base">
            <dt className="font-bold text-fg">Total</dt>
            <dd className="font-extrabold text-fg tabular-nums">{formatInr(total)}</dd>
          </div>
          <p className="text-caption text-fg-muted">Prices include GST.</p>
        </dl>
        {error && (
          <p role="alert" className="rounded-[10px] bg-danger/8 px-3 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !options || !shipping || !payment}
          className="inline-flex h-13 items-center justify-center gap-2 rounded-[10px] bg-fg text-[0.9375rem] font-semibold text-paper transition-colors hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:bg-fg/50"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {cta}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-caption text-fg-muted">
          <Lock className="size-3.5" aria-hidden="true" />
          {payment?.kind === 'razorpay' ? 'Payments are processed securely by Razorpay.' : 'Pay the courier in cash or UPI on delivery.'}
        </p>
      </aside>
    </form>
  );
}
