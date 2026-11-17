'use server';

import { cookies } from 'next/headers';
import { medusaEnabled, sdk } from '@/lib/medusa/client';
import type { ActionResult, CartAddress } from '@/lib/cart/types';
import { SESSION_COOKIE, getAccount, visitorIp } from './session';

function messageOf(error: unknown): string {
  const raw = (error as { message?: string })?.message ?? '';
  return raw && !/fetch failed|ECONNREFUSED|Unauthorized/i.test(raw) ? raw : 'Something went wrong. Please try again.';
}

/** Whether the shop can email sign-in codes (the backend has email set up). */
export async function emailSignInAvailable(): Promise<boolean> {
  if (!medusaEnabled || !sdk) return false;
  try {
    const { enabled } = await sdk.client.fetch<{ enabled: boolean }>('/store/login-code');
    return enabled;
  } catch {
    return false;
  }
}

/** Emails a 6-digit sign-in code to this address. */
export async function requestSignInCode(email: string): Promise<ActionResult<true>> {
  if (!sdk) return { ok: false, error: 'Sign-in is not available yet.' };
  try {
    const ip = await visitorIp();
    await sdk.client.fetch('/store/login-code', {
      method: 'POST',
      body: { email },
      headers: ip ? { 'x-client-ip': ip } : undefined,
    });
    return { ok: true, value: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

/** Checks the code and signs the visitor in on this browser for 30 days. */
export async function verifySignInCode(email: string, code: string): Promise<ActionResult<true>> {
  if (!sdk) return { ok: false, error: 'Sign-in is not available yet.' };
  try {
    const { token, expires_at } = await sdk.client.fetch<{ token: string; expires_at: number }>('/store/login-code/verify', {
      method: 'POST',
      body: { email, code },
    });
    (await cookies()).set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(expires_at),
    });
    return { ok: true, value: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** For checkout: the signed-in customer's email and saved addresses, or null. */
export async function signedInDetails(): Promise<{ email: string; addresses: CartAddress[] } | null> {
  const account = await getAccount();
  if (!account) return null;
  return {
    email: account.email,
    addresses: account.addresses.map((a) => ({
      firstName: a.firstName,
      lastName: a.lastName,
      phone: a.phone.replace(/^\+91/, ''),
      address1: a.address1,
      address2: a.address2,
      city: a.city,
      province: a.province,
      postalCode: a.postalCode,
    })),
  };
}
