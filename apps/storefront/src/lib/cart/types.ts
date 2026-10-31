/** Client-safe cart and checkout shapes, mapped from Medusa's store API in lib/cart/actions.ts. */

export interface CartLine {
  id: string;
  variantId: string;
  productTitle: string;
  productHandle: string | null;
  /** "Galaxy S25 / Soft silicone" */
  variantTitle: string | null;
  sku: string | null;
  thumbnail: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CartAddress {
  firstName: string;
  lastName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface CartSummary {
  id: string;
  count: number;
  lines: CartLine[];
  itemSubtotal: number;
  shippingTotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  email: string | null;
  address: CartAddress | null;
  shippingOptionId: string | null;
}

export interface ShippingChoice {
  id: string;
  name: string;
  amount: number;
  description: string | null;
}

export type PaymentChoiceKind = 'razorpay' | 'cod';

export interface PaymentChoice {
  providerId: string;
  kind: PaymentChoiceKind;
  label: string;
  description: string;
}

export interface CheckoutOptions {
  shipping: ShippingChoice[];
  payment: PaymentChoice[];
}

/** What the browser needs to open Razorpay Checkout for the cart's payment session. */
export interface RazorpayLaunch {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
}

export type ActionResult<T> = { ok: true; value: T } | { ok: false; error: string };
