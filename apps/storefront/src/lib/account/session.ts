import 'server-only';
import { cookies, headers } from 'next/headers';
import { medusaEnabled, sdk } from '@/lib/medusa/client';
import type { Account, AccountOrder } from './types';

/** The signed-in customer's Medusa token, in an httpOnly cookie the browser's scripts cannot read. */
export const SESSION_COOKIE = 'gh_session';

export async function sessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

/**
 * The visitor's IP address as the proxy in front of the site saw it (nginx sets X-Real-IP and appends to
 * X-Forwarded-For; Caddy replaces X-Forwarded-For). The backend rate-limits sign-in codes by it.
 */
export async function visitorIp(): Promise<string | undefined> {
  const h = await headers();
  const real = h.get('x-real-ip')?.trim();
  if (real) return real;
  const chain = h.get('x-forwarded-for')?.split(',').map((s) => s.trim()).filter(Boolean);
  return chain?.[chain.length - 1];
}

interface MyOrdersResponse {
  customer: Omit<Account, 'orders'>;
  orders: AccountOrder[];
}

/** The signed-in customer with their addresses and orders, or null when nobody is signed in (or the session ended). */
export async function getAccount(): Promise<Account | null> {
  const token = await sessionToken();
  if (!token || !medusaEnabled || !sdk) return null;
  try {
    const { customer, orders } = await sdk.client.fetch<MyOrdersResponse>('/store/my-orders', {
      headers: { authorization: `Bearer ${token}` },
    });
    return { ...customer, orders };
  } catch {
    return null;
  }
}

/** One of the signed-in customer's orders; null when it is not theirs or nobody is signed in. */
export async function getAccountOrder(id: string): Promise<AccountOrder | null> {
  const token = await sessionToken();
  if (!token || !medusaEnabled || !sdk || !/^order_[A-Za-z0-9]+$/.test(id)) return null;
  try {
    const { order } = await sdk.client.fetch<{ order: AccountOrder }>(`/store/my-orders/${id}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    return order;
  } catch {
    return null;
  }
}
