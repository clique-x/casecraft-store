'use server';

import { medusaEnabled, sdk } from '@/lib/medusa/client';
import type { ActionResult } from './types';

export interface TrackedOrder {
  displayId: number;
  createdAt: string;
  status: string;
  fulfillmentStatus: string;
  paymentStatus: string;
  total: number;
  city: string | null;
  items: { title: string; variantTitle: string | null; quantity: number; thumbnail: string | null }[];
  tracking: { number: string | null; url: string | null }[];
}

interface LookupResponse {
  order: {
    display_id: number;
    created_at: string;
    status: string;
    fulfillment_status: string;
    payment_status: string;
    total: number;
    city: string | null;
    items?: { title: string; variant_title?: string | null; quantity: number; thumbnail?: string | null }[];
    fulfillments?: { labels?: { tracking_number?: string | null; tracking_url?: string | null }[] }[];
  };
}

/** Order lookup for guests: order number plus the email or phone used at checkout. */
export async function trackOrder(orderNo: string, contact: string): Promise<ActionResult<TrackedOrder>> {
  if (!medusaEnabled || !sdk) return { ok: false, error: 'Order tracking is not available yet.' };
  try {
    const { order } = await sdk.client.fetch<LookupResponse>('/store/order-lookup', {
      query: { order: orderNo.replace(/^#/, '').trim(), contact: contact.trim() },
    });
    return {
      ok: true,
      value: {
        displayId: order.display_id,
        createdAt: order.created_at,
        status: order.status,
        fulfillmentStatus: order.fulfillment_status,
        paymentStatus: order.payment_status,
        total: Number(order.total ?? 0),
        city: order.city,
        items: (order.items ?? []).map((i) => ({
          title: i.title,
          variantTitle: i.variant_title ?? null,
          quantity: i.quantity,
          thumbnail: i.thumbnail ?? null,
        })),
        tracking: (order.fulfillments ?? []).flatMap((f) =>
          (f.labels ?? []).map((l) => ({ number: l.tracking_number ?? null, url: l.tracking_url ?? null })),
        ),
      },
    };
  } catch (error) {
    const message = (error as { message?: string })?.message ?? '';
    return { ok: false, error: /No order matches|Enter your order/.test(message) ? message : 'We could not look that up. Please try again.' };
  }
}
