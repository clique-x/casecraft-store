import 'server-only';
import { medusaEnabled, sdk } from '@/lib/medusa/client';

export interface OrderView {
  id: string;
  displayId: number;
  email: string | null;
  createdAt: string;
  paymentLabel: string;
  paid: boolean;
  items: { id: string; title: string; variantTitle: string | null; quantity: number; total: number; thumbnail: string | null }[];
  itemSubtotal: number;
  shippingTotal: number;
  discountTotal: number;
  total: number;
  address: { name: string; lines: string[]; phone: string | null } | null;
}

/** An order by its Medusa id, for the confirmation page. Null when it does not exist. */
export async function getOrder(id: string): Promise<OrderView | null> {
  if (!medusaEnabled || !sdk || !/^order_[A-Za-z0-9]+$/.test(id)) return null;
  try {
    const { order } = await sdk.store.order.retrieve(id, {
      fields: '*items,*shipping_address,*payment_collections,*payment_collections.payment_sessions',
    });
    const session = order.payment_collections?.[0]?.payment_sessions?.[0];
    const online = session?.provider_id === 'pp_razorpay_razorpay';
    const a = order.shipping_address;
    return {
      id: order.id,
      displayId: order.display_id ?? 0,
      email: order.email ?? null,
      createdAt: String(order.created_at),
      paymentLabel: online ? 'Paid online (Razorpay)' : 'Cash on Delivery',
      paid: online,
      items: (order.items ?? []).map((i) => ({
        id: i.id,
        title: i.product_title ?? i.title,
        variantTitle: i.variant_title ?? null,
        quantity: i.quantity,
        total: Number(i.total ?? 0),
        thumbnail: i.thumbnail ?? null,
      })),
      itemSubtotal: Number(order.item_subtotal ?? 0),
      shippingTotal: Number(order.shipping_total ?? 0),
      discountTotal: Number(order.discount_total ?? 0),
      total: Number(order.total ?? 0),
      address: a
        ? {
            name: [a.first_name, a.last_name].filter(Boolean).join(' '),
            lines: [a.address_1, a.address_2, [a.city, a.province].filter(Boolean).join(', '), a.postal_code].filter(
              (l): l is string => Boolean(l),
            ),
            phone: a.phone ?? null,
          }
        : null,
    };
  } catch {
    return null;
  }
}
