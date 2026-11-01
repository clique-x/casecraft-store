'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, Check, ChevronDown, CreditCard, Loader2, Lock, ShoppingBag, Truck } from 'lucide-react';
import { CartLines } from '@/components/cart/CartLines.client';
import { BRAND_NAME } from '@/lib/brand';
import { formatInr } from '@/lib/catalog/photos';
import { getCheckoutOptions, placeOrder, saveCheckoutDetails, startPayment } from '@/lib/cart/actions';
import { useCart } from '@/lib/cart/cart-context';
import { clearSavedDetails, forgetAddress, readSavedDetails, rememberAddress } from '@/lib/cart/saved-details';
import { AddressFields, INPUT } from './AddressFields.client';
import { PhoneLogin } from './PhoneLogin.client';
import { SavedAddresses } from './SavedAddresses.client';
import type { CartAddress, CheckoutOptions, RazorpayLaunch } from '@/lib/cart/types';
import { cn } from '@/lib/utils';

const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PINCODE_RE = /^[1-9]\d{5}$/;

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

const LABEL = 'flex flex-col gap-1.5 text-sm font-medium text-fg';

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn(LABEL, className)}>
      {label}
      {children}
    </label>
  );
}

export function Checkout() {
  const { cart, ready, enabled } = useCart();
  // Arriving from a product page keeps its scroll position; checkout always starts at the top.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);
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
  // Keyed by cart so a different cart starts a fresh form. Prefill: what this cart saved, else the
  // details from this browser's last checkout. This only renders on the client (ready is false on the server).
  const saved = readSavedDetails();
  return (
    <CheckoutForm
      key={cart.id}
      initialEmail={cart.email ?? saved?.email ?? ''}
      cartAddress={cart.address}
      savedAddresses={saved?.addresses ?? []}
    />
  );
}

function sameAddress(a: CartAddress, b: CartAddress): boolean {
  return a.address1 === b.address1 && a.postalCode === b.postalCode && a.phone === b.phone;
}

function CheckoutForm({
  initialEmail,
  cartAddress,
  savedAddresses,
}: {
  initialEmail: string;
  cartAddress: CartAddress | null;
  savedAddresses: CartAddress[];
}) {
  const router = useRouter();
  const { cart, replace } = useCart();
  const [email, setEmail] = useState(initialEmail);
  // Start on the saved-address cards when there are any, with this cart's address (or the last used) selected.
  const [saved, setSaved] = useState<CartAddress[]>(savedAddresses);
  const cartMatch = cartAddress ? savedAddresses.findIndex((a) => sameAddress(a, cartAddress)) : -1;
  const [selected, setSelected] = useState(cartMatch >= 0 ? cartMatch : 0);
  const [mode, setMode] = useState<'saved' | 'new'>(savedAddresses.length > 0 && (!cartAddress || cartMatch >= 0) ? 'saved' : 'new');
  const [address, setAddress] = useState<CartAddress>(cartAddress ?? savedAddresses[0] ?? EMPTY_ADDRESS);
  const [showSavedNote, setShowSavedNote] = useState(savedAddresses.length > 0 && !cartAddress);
  const [verifiedNote, setVerifiedNote] = useState<string | null>(null);
  // Remounts the address block (its local name and pincode state) after "Clear".
  const [formKey, setFormKey] = useState(0);
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

  const shipping = options?.shipping.find((s) => s.id === shippingId) ?? null;
  const payment = options?.payment.find((p) => p.providerId === providerId) ?? null;
  const shippingAmount = shipping?.amount ?? 0;
  const total = useMemo(() => (cart ? cart.itemSubtotal - cart.discountTotal + shippingAmount : 0), [cart, shippingAmount]);

  // Returning visitors with everything filled start on the last step.
  const contactOk = (phone: string, mail: string) => PHONE_RE.test(phone) && EMAIL_RE.test(mail.trim());
  const addressOk = (a: CartAddress) =>
    Boolean(a.firstName.trim() && a.address1.trim() && a.city.trim() && a.province.trim()) && PINCODE_RE.test(a.postalCode);
  const [step, setStep] = useState<1 | 2 | 3>(() =>
    contactOk(address.phone, email) ? (addressOk(address) ? 3 : 2) : 1,
  );
  const goTo = (n: 1 | 2 | 3) => {
    setError(null);
    setStep(n);
  };

  // Bring the step that just opened into view (it can start below the fold on phones).
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelector('section[aria-current=step]')?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }, [step]);

  /** Enter or the main button: advance a step, or place the order on the last one. */
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (step === 1) {
      if (!PHONE_RE.test(address.phone)) return setError('Enter a 10-digit Indian mobile number.');
      if (!EMAIL_RE.test(email.trim())) return setError('Enter a valid email address.');
      setStep(addressOk(address) ? 3 : 2);
      return;
    }
    if (step === 2) {
      if (!address.firstName.trim()) return setError('Enter the name for delivery.');
      if (!PINCODE_RE.test(address.postalCode)) return setError('Enter a valid 6-digit pincode.');
      if (!address.address1.trim()) return setError('Enter your flat or house number and building.');
      if (!address.city.trim() || !address.province.trim()) return setError('Add your city and state.');
      setStep(3);
      return;
    }
    void submit(e);
  };

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
    rememberAddress(email, address);
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
  const placeLabel = payment?.kind === 'razorpay' ? `Pay ${formatInr(total)}` : `Place order · ${formatInr(total)}`;
  const busyLabel = stage === 'saving' ? 'Saving…' : stage === 'paying' ? 'Waiting for payment…' : 'Placing your order…';
  // Until delivery is priced the total is not final: show the subtotal and hold the order button.
  const priced = Boolean(options && shipping);
  const cta = busy ? busyLabel : step < 3 ? 'Continue' : priced && payment ? placeLabel : 'Loading…';
  const name = [address.firstName, address.lastName].filter(Boolean).join(' ');

  return (
    <form id="checkout-form" onSubmit={onSubmit} noValidate className="grid gap-6 pb-32 lg:grid-cols-12 lg:items-start lg:gap-10 lg:pb-0">
      {/* Phones: the order summary folds into one line above the steps. */}
      <details className="group rounded-xl border border-border bg-surface lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2 text-sm font-semibold text-fg">
            <ShoppingBag className="size-4" aria-hidden="true" />
            Order summary · {cart.count} {cart.count === 1 ? 'item' : 'items'}
            <ChevronDown className="size-4 text-fg-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </span>
          <span className="text-base font-extrabold text-fg tabular-nums">{formatInr(priced ? total : cart.itemSubtotal)}</span>
        </summary>
        <div className="border-t border-border px-4 pb-4">
          <CartLines lines={cart.lines} editable={false} />
          <Totals cart={cart} shipping={shipping} shippingAmount={shippingAmount} total={total} />
        </div>
      </details>

      <div className="flex flex-col gap-3 lg:col-span-7">
        <Step
          n={1}
          title="Contact"
          open={step === 1}
          done={step > 1}
          summary={`+91 ${address.phone.replace(/(\d{5})(\d{5})/, '$1 $2')} · ${email}`}
          onEdit={() => goTo(1)}
          error={step === 1 ? error : null}
        >

          {showSavedNote && (
            <p className="flex flex-wrap items-center gap-x-2 rounded-[10px] bg-surface-2 px-3 py-2.5 text-sm text-fg">
              We filled in your details from your last order on this device.
              <button
                type="button"
                className="font-semibold text-brand underline-offset-4 hover:underline"
                onClick={() => {
                  clearSavedDetails();
                  setSaved([]);
                  setMode('new');
                  setEmail('');
                  setAddress(EMPTY_ADDRESS);
                  setShowSavedNote(false);
                  setFormKey((k) => k + 1);
                }}
              >
                Not you? Clear
              </button>
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
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
            <Field label="Email for your receipt">
              <input className={INPUT} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
          </div>
          <PhoneLogin
            phone={address.phone}
            onFound={(foundEmail, found) => {
              if (foundEmail && !email) setEmail(foundEmail);
              if (found.length === 0) {
                setVerifiedNote('No past orders with this number yet. Your address will be saved after this order.');
                return;
              }
              // Past-order addresses first, then ones only saved on this device.
              const merged = [...found, ...saved.filter((a) => !found.some((f) => sameAddress(f, a)))];
              setSaved(merged);
              setSelected(0);
              setMode('saved');
              setAddress(merged[0]);
              setShowSavedNote(false);
              setVerifiedNote(`Found ${found.length} ${found.length === 1 ? 'address' : 'addresses'} from your past orders.`);
            }}
          />
          {verifiedNote && <p className="text-caption font-medium text-success">{verifiedNote}</p>}
          <p className="text-caption text-fg-muted">The courier calls this number on delivery.</p>
          <StepContinue disabled={busy} />
        </Step>

        <Step
          n={2}
          title="Delivery address"
          open={step === 2}
          done={step > 2}
          summary={[name, address.address1, `${address.city} ${address.postalCode}`].filter((x) => x.trim()).join(', ')}
          onEdit={() => goTo(2)}
          error={step === 2 ? error : null}
        >

          {mode === 'saved' && saved.length > 0 ? (
            <SavedAddresses
              addresses={saved}
              selected={selected}
              onSelect={(i) => {
                setSelected(i);
                // Keep a phone number the visitor just typed above if the saved one is empty.
                setAddress((cur) => ({ ...saved[i], phone: saved[i].phone || cur.phone }));
              }}
              onEdit={(i) => {
                setAddress(saved[i]);
                setMode('new');
                setFormKey((k) => k + 1);
              }}
              onRemove={(i) => {
                const next = forgetAddress(saved[i])?.addresses ?? [];
                setSaved(next);
                if (next.length === 0) {
                  setMode('new');
                  setAddress((cur) => ({ ...EMPTY_ADDRESS, phone: cur.phone }));
                  setFormKey((k) => k + 1);
                  return;
                }
                const nextIndex = Math.min(i, next.length - 1);
                setSelected(nextIndex);
                setAddress(next[nextIndex]);
              }}
              onAddNew={() => {
                setMode('new');
                setAddress((cur) => ({ ...EMPTY_ADDRESS, phone: cur.phone }));
                setFormKey((k) => k + 1);
              }}
            />
          ) : (
            <>
              {saved.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('saved');
                    const i = Math.min(selected, saved.length - 1);
                    setSelected(i);
                    setAddress(saved[i]);
                  }}
                  className="self-start text-sm font-semibold text-brand underline-offset-4 hover:underline"
                >
                  ← Use a saved address ({saved.length})
                </button>
              )}
              <AddressFields key={formKey} address={address} setAddress={setAddress} />
            </>
          )}
          <StepContinue disabled={busy} />
        </Step>

        <Step n={3} title="Delivery & payment" open={step === 3} done={false} summary="" onEdit={() => goTo(3)} error={step === 3 ? error : null}>
          {!options ? (
            <div className="h-32 animate-pulse rounded-[10px] bg-surface-2" />
          ) : (
            <>
              {options.shipping.length === 0 ? (
                <p className="text-sm text-danger">We cannot deliver to this address right now. Please contact us on WhatsApp.</p>
              ) : options.shipping.length === 1 && shipping ? (
                <div className="flex items-center justify-between gap-3 rounded-[10px] bg-surface-2/60 px-4 py-3">
                  <span className="flex items-center gap-3">
                    <Truck className="size-4.5 text-fg-muted" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-semibold text-fg">{shipping.name}</span>
                      {shipping.description && <span className="block text-caption text-fg-muted">{shipping.description}</span>}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-fg tabular-nums">{shippingAmount === 0 ? 'Free' : formatInr(shippingAmount)}</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2" role="radiogroup" aria-label="Delivery option">
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
                        <span className="text-sm font-semibold text-fg">{s.name}</span>
                      </span>
                      <span className="text-sm font-bold text-fg tabular-nums">{s.amount === 0 ? 'Free' : formatInr(s.amount)}</span>
                    </label>
                  ))}
                </div>
              )}

              <p className="mt-2 text-sm font-semibold text-fg">Pay with</p>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Payment method">
                {options.payment.map((p) => (
                  <label
                    key={p.providerId}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-[10px] border p-4 transition-colors',
                      providerId === p.providerId ? 'border-fg bg-surface-2/50' : 'border-border hover:border-fg/40',
                    )}
                  >
                    <input type="radio" name="payment" className="size-4 accent-[var(--color-fg)]" checked={providerId === p.providerId} onChange={() => setProviderId(p.providerId)} />
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-fg">
                      {p.kind === 'razorpay' ? <CreditCard className="size-4.5" aria-hidden="true" /> : <Banknote className="size-4.5" aria-hidden="true" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-fg">{p.label}</span>
                      <span className="block text-caption text-fg-muted">{p.description}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="flex items-center gap-1.5 text-caption text-fg-muted">
                <Lock className="size-3.5" aria-hidden="true" />
                {payment?.kind === 'razorpay' ? 'Payments are processed securely by Razorpay.' : 'Pay the courier in cash or UPI on delivery.'}
              </p>
            </>
          )}
        </Step>

      </div>

      <aside className="hidden flex-col gap-4 rounded-xl border border-border bg-surface p-5 lg:sticky lg:top-24 lg:col-span-5 lg:flex">
        <h2 className="text-lg font-extrabold text-fg">Order summary</h2>
        <div className="max-h-80 overflow-y-auto">
          <CartLines lines={cart.lines} editable={false} />
        </div>
        <Totals cart={cart} shipping={shipping} shippingAmount={shippingAmount} total={total} />
        {step === 3 ? (
          <button
            type="submit"
            disabled={busy || !options || !shipping || !payment}
            className="inline-flex h-13 items-center justify-center gap-2 rounded-[10px] bg-fg text-base font-semibold text-paper transition-colors hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:bg-fg/50"
          >
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {busy ? busyLabel : placeLabel}
          </button>
        ) : (
          <p className="text-center text-caption text-fg-muted">Add your contact and address to place the order.</p>
        )}
      </aside>

      {/* Phones: one fixed bar with the total and the next action, in thumb reach. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-paper/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_color-mix(in_srgb,var(--color-shadow)_18%,transparent)] backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-caption text-fg-muted">{priced ? 'Total' : 'Subtotal'}</p>
            <p className="text-lg leading-tight font-extrabold text-fg tabular-nums">{formatInr(priced ? total : cart.itemSubtotal)}</p>
          </div>
          <button
            type="submit"
            disabled={busy || (step === 3 && (!options || !shipping || !payment))}
            className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-[10px] bg-fg text-base font-semibold text-paper transition-colors hover:bg-[#2b2b2b] disabled:bg-fg/50"
          >
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {cta}
          </button>
        </div>
      </div>
    </form>
  );
}

function Totals({
  cart,
  shipping,
  shippingAmount,
  total,
}: {
  cart: { itemSubtotal: number; discountTotal: number };
  shipping: unknown;
  shippingAmount: number;
  total: number;
}) {
  return (
    <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
      <div className="flex justify-between">
        <dt className="text-fg-muted">Subtotal</dt>
        <dd className="font-semibold text-fg tabular-nums">{formatInr(cart.itemSubtotal)}</dd>
      </div>
      {cart.discountTotal > 0 && (
        <div className="flex justify-between">
          <dt className="text-fg-muted">Bundle saving</dt>
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
  );
}

/** One checkout step: open, done (one summary line + Edit), or waiting. */
function Step({
  n,
  title,
  open,
  done,
  summary,
  onEdit,
  error,
  children,
}: {
  n: number;
  title: string;
  open: boolean;
  done: boolean;
  summary: string;
  onEdit: () => void;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-current={open ? 'step' : undefined}
      className={cn('scroll-mt-28 rounded-xl border bg-surface transition-colors', open ? 'border-fg/70 shadow-sm' : 'border-border')}
    >
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
        <span
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold',
            done ? 'bg-success text-paper' : open ? 'bg-fg text-paper' : 'bg-surface-2 text-fg-muted',
          )}
        >
          {done ? <Check className="size-4" aria-hidden="true" /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className={cn('text-base font-extrabold', open || done ? 'text-fg' : 'text-fg-muted')}>{title}</h2>
          {done && summary && <p className="truncate text-caption text-fg-muted">{summary}</p>}
        </div>
        {done && (
          <button type="button" onClick={onEdit} className="shrink-0 text-sm font-semibold text-brand underline-offset-4 hover:underline">
            Edit
          </button>
        )}
      </div>
      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-4 pt-4 pb-5 sm:px-5">
          {children}
          {error && (
            <p role="alert" className="rounded-[10px] bg-danger/8 px-3 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/** In-step Continue for larger screens; phones use the fixed bar. */
function StepContinue({ disabled }: { disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="hidden h-12 items-center justify-center self-start rounded-[10px] bg-fg px-8 text-base font-semibold text-paper transition-colors hover:bg-[#2b2b2b] disabled:bg-fg/50 lg:inline-flex"
    >
      Continue
    </button>
  );
}
