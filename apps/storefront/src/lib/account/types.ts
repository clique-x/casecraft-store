import type { CartAddress } from '@/lib/cart/types';

/** Client-safe shapes of GET /store/my-orders (apps/backend/src/lib/orders.ts). */
export interface AccountOrder {
  id: string;
  displayId: number;
  email: string | null;
  createdAt: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  paidOnline: boolean;
  paymentLabel: string;
  items: { id: string; title: string; variantTitle: string | null; quantity: number; unitPrice: number; total: number; thumbnail: string | null }[];
  itemSubtotal: number;
  shippingTotal: number;
  discountTotal: number;
  total: number;
  address: CartAddress | null;
  shipments: { fulfillmentId: string; trackingNumber: string | null; trackingUrl: string | null; shippedAt: string | null; deliveredAt: string | null }[];
}

export interface Account {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  addresses: (CartAddress & { id: string })[];
  orders: AccountOrder[];
}

/** The four steps a customer sees, from Medusa's statuses: 0 placed, 1 packed, 2 shipped, 3 delivered. */
export function orderStep(o: Pick<AccountOrder, 'fulfillmentStatus' | 'shipments'>): number {
  const f = o.fulfillmentStatus;
  if (f === 'delivered' || f === 'partially_delivered' || o.shipments.some((s) => s.deliveredAt)) return 3;
  if (f === 'shipped' || f === 'partially_shipped' || o.shipments.some((s) => s.shippedAt)) return 2;
  if (f === 'fulfilled' || f === 'partially_fulfilled') return 1;
  return 0;
}

export const ORDER_STEPS = ['Order placed', 'Packed', 'Shipped', 'Delivered'] as const;
