'use server';

import { cookies } from 'next/headers';
import type { HttpTypes } from '@medusajs/types';
import { MEDUSA_REGION_ID, medusaEnabled, sdk } from '@/lib/medusa/client';
import type {
  ActionResult,
  CartAddress,
  CartSummary,
  CheckoutOptions,
  PaymentChoice,
  RazorpayLaunch,
  ShippingChoice,
} from './types';

const CART_COOKIE = 'cart_id';
const THIRTY_DAYS_S = 30 * 24 * 60 * 60;
const RAZORPAY_PROVIDER = 'pp_razorpay_razorpay';
const COD_PROVIDER = 'pp_system_default';
const MAX_QTY = 10;

// --- helpers --------------------------------------------------------------------------------------

function api() {
  if (!medusaEnabled || !sdk) throw new Error('The shop is not connected to Medusa yet.');
  return sdk;
}

/** Medusa's errors carry a useful message; network failures do not. */
function messageOf(error: unknown): string {
  const raw = (error as { message?: string })?.message ?? '';
  if (/fetch failed|ECONNREFUSED|network/i.test(raw)) return 'We could not reach the shop. Please try again.';
  return raw || 'Something went wrong. Please try again.';
}

async function readCartId(): Promise<string | null> {
  return (await cookies()).get(CART_COOKIE)?.value ?? null;
}

async function writeCartId(id: string | null): Promise<void> {
  const store = await cookies();
  if (id === null) {
    store.delete(CART_COOKIE);
    return;
  }
  store.set(CART_COOKIE, id, {
    maxAge: THIRTY_DAYS_S,
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });
}

function toAddress(a: HttpTypes.StoreCartAddress | null | undefined): CartAddress | null {
  if (!a || !a.address_1) return null;
  return {
    firstName: a.first_name ?? '',
    lastName: a.last_name ?? '',
    phone: (a.phone ?? '').replace(/^\+91/, ''),
    address1: a.address_1 ?? '',
    address2: a.address_2 ?? '',
    city: a.city ?? '',
    province: a.province ?? '',
    postalCode: a.postal_code ?? '',
  };
}

function toSummary(cart: HttpTypes.StoreCart): CartSummary {
  const lines = (cart.items ?? [])
    .map((item) => ({
      id: item.id,
      variantId: item.variant_id ?? '',
      productTitle: item.product_title ?? item.title,
      productHandle: item.product_handle ?? null,
      variantTitle: item.variant_title ?? null,
      sku: item.variant_sku ?? null,
      thumbnail: item.thumbnail ?? null,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price ?? 0),
      total: Number(item.total ?? Number(item.unit_price ?? 0) * item.quantity),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  return {
    id: cart.id,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    lines,
    itemSubtotal: Number(cart.item_subtotal ?? 0),
    shippingTotal: Number(cart.shipping_total ?? 0),
    discountTotal: Number(cart.discount_total ?? 0),
    taxTotal: Number(cart.tax_total ?? 0),
    total: Number(cart.total ?? 0),
    email: cart.email ?? null,
    address: toAddress(cart.shipping_address),
    shippingOptionId: cart.shipping_methods?.[0]?.shipping_option_id ?? null,
  };
}

/** The visitor's open cart, or null (none yet, completed, or deleted). */
async function loadCart(): Promise<HttpTypes.StoreCart | null> {
  const id = await readCartId();
  if (!id) return null;
  try {
    const { cart } = await api().store.cart.retrieve(id);
    if ((cart as { completed_at?: string | null }).completed_at) return null;
    return cart;
  } catch {
    return null;
  }
}

async function loadOrCreateCart(): Promise<HttpTypes.StoreCart> {
  const existing = await loadCart();
  if (existing) return existing;
  const { cart } = await api().store.cart.create({ region_id: MEDUSA_REGION_ID });
  await writeCartId(cart.id);
  return cart;
}

async function guard<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, value: await fn() };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

// --- cart -----------------------------------------------------------------------------------------

export async function getCart(): Promise<CartSummary | null> {
  if (!medusaEnabled) return null;
  const cart = await loadCart();
  return cart ? toSummary(cart) : null;
}

export async function addToCart(variantId: string, quantity = 1): Promise<ActionResult<CartSummary>> {
  return guard(async () => {
    const cart = await loadOrCreateCart();
    const existing = cart.items?.find((i) => i.variant_id === variantId);
    if (existing) {
      const qty = Math.min(MAX_QTY, existing.quantity + quantity);
      const { cart: next } = await api().store.cart.updateLineItem(cart.id, existing.id, { quantity: qty });
      return toSummary(next);
    }
    const { cart: next } = await api().store.cart.createLineItem(cart.id, { variant_id: variantId, quantity });
    return toSummary(next);
  });
}

export async function setLineQuantity(lineId: string, quantity: number): Promise<ActionResult<CartSummary | null>> {
  return guard(async () => {
    const cart = await loadCart();
    if (!cart) return null;
    if (quantity <= 0) {
      await api().store.cart.deleteLineItem(cart.id, lineId);
      const { cart: next } = await api().store.cart.retrieve(cart.id);
      return toSummary(next);
    }
    const { cart: next } = await api().store.cart.updateLineItem(cart.id, lineId, {
      quantity: Math.min(MAX_QTY, Math.floor(quantity)),
    });
    return toSummary(next);
  });
}

// --- checkout -------------------------------------------------------------------------------------

const PAYMENT_COPY: Record<string, Omit<PaymentChoice, 'providerId'>> = {
  [RAZORPAY_PROVIDER]: { kind: 'razorpay', label: 'Pay online', description: 'UPI, cards, netbanking or wallets via Razorpay' },
  [COD_PROVIDER]: { kind: 'cod', label: 'Cash on Delivery', description: 'Pay in cash or UPI to the courier when it arrives' },
};

export async function getCheckoutOptions(): Promise<ActionResult<CheckoutOptions>> {
  return guard(async () => {
    const cart = await loadCart();
    if (!cart) throw new Error('Your cart is empty.');
    const [{ shipping_options }, { payment_providers }] = await Promise.all([
      api().store.fulfillment.listCartOptions({ cart_id: cart.id }),
      api().store.payment.listPaymentProviders({ region_id: cart.region_id ?? MEDUSA_REGION_ID }),
    ]);
    const shipping: ShippingChoice[] = shipping_options.map((o) => ({
      id: o.id,
      name: o.name,
      amount: Number((o as { calculated_price?: { calculated_amount?: number } }).calculated_price?.calculated_amount ?? o.amount ?? 0),
      description: (o.type as { description?: string } | undefined)?.description ?? null,
    }));
    // Online payment first: it is the faster path for both sides.
    const payment = payment_providers
      .filter((p) => PAYMENT_COPY[p.id])
      .map((p) => ({ providerId: p.id, ...PAYMENT_COPY[p.id] }))
      .sort((a) => (a.kind === 'razorpay' ? -1 : 1));
    return { shipping, payment };
  });
}

export interface CheckoutDetails {
  email: string;
  address: CartAddress;
  shippingOptionId: string;
}

const PINCODE_RE = /^[1-9]\d{5}$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Saves contact, address and delivery on the cart and returns the updated totals. */
export async function saveCheckoutDetails(details: CheckoutDetails): Promise<ActionResult<CartSummary>> {
  return guard(async () => {
    const a = details.address;
    const phone = a.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    if (!EMAIL_RE.test(details.email.trim())) throw new Error('Enter a valid email address.');
    if (!PHONE_RE.test(phone)) throw new Error('Enter a 10-digit Indian mobile number.');
    if (!PINCODE_RE.test(a.postalCode.trim())) throw new Error('Enter a valid 6-digit pincode.');
    if (!a.firstName.trim() || !a.address1.trim() || !a.city.trim() || !a.province.trim()) {
      throw new Error('Fill in your name and full address.');
    }
    const cart = await loadCart();
    if (!cart || (cart.items?.length ?? 0) === 0) throw new Error('Your cart is empty.');

    const address = {
      first_name: a.firstName.trim(),
      last_name: a.lastName.trim(),
      phone: `+91${phone}`,
      address_1: a.address1.trim(),
      address_2: a.address2.trim(),
      city: a.city.trim(),
      province: a.province.trim(),
      postal_code: a.postalCode.trim(),
      country_code: 'in',
    };
    await api().store.cart.update(cart.id, {
      email: details.email.trim().toLowerCase(),
      shipping_address: address,
      billing_address: address,
    });
    const { cart: next } = await api().store.cart.addShippingMethod(cart.id, { option_id: details.shippingOptionId });
    return toSummary(next);
  });
}

/**
 * Creates the payment session for the chosen method. For Razorpay it returns what the browser
 * needs to open Razorpay Checkout; for Cash on Delivery the order can be placed straight away.
 */
export async function startPayment(providerId: string): Promise<ActionResult<RazorpayLaunch | null>> {
  return guard(async () => {
    if (!PAYMENT_COPY[providerId]) throw new Error('Choose a payment method.');
    const cart = await loadCart();
    if (!cart) throw new Error('Your cart is empty.');
    const { payment_collection } = await api().store.payment.initiatePaymentSession(cart, { provider_id: providerId });
    if (providerId !== RAZORPAY_PROVIDER) return null;
    const session = payment_collection.payment_sessions?.find((s) => s.provider_id === providerId);
    const data = (session?.data ?? {}) as { key_id?: string; razorpay_order_id?: string; amount?: number; currency?: string };
    if (!data.key_id || !data.razorpay_order_id) throw new Error('Online payment is not available right now. Try Cash on Delivery.');
    return { keyId: data.key_id, orderId: data.razorpay_order_id, amount: data.amount ?? 0, currency: data.currency ?? 'INR' };
  });
}

/**
 * Completes the cart. For Razorpay the backend confirms the payment with Razorpay before the
 * order is created, so this only succeeds once the money is really authorised.
 */
export async function placeOrder(): Promise<ActionResult<{ orderId: string }>> {
  return guard(async () => {
    const id = await readCartId();
    if (!id) throw new Error('Your cart is empty.');
    const result = await api().store.cart.complete(id);
    if (result.type !== 'order') {
      const message = (result as { error?: { message?: string } }).error?.message;
      throw new Error(
        message && !/payment/i.test(message)
          ? message
          : 'We could not confirm your payment yet. If money was taken, it will be refunded or your order confirmed within minutes; contact us on WhatsApp.',
      );
    }
    await writeCartId(null);
    return { orderId: result.order.id };
  });
}
