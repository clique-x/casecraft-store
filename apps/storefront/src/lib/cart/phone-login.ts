'use server';

import { medusaEnabled, sdk } from '@/lib/medusa/client';
import type { ActionResult, CartAddress } from './types';

function messageOf(error: unknown): string {
  const raw = (error as { message?: string })?.message ?? '';
  return raw && !/fetch failed|ECONNREFUSED/i.test(raw) ? raw : 'Something went wrong. Please try again.';
}

/** Whether the backend has phone login configured (Twilio Verify). */
export async function phoneLoginAvailable(): Promise<boolean> {
  if (!medusaEnabled || !sdk) return false;
  try {
    const { enabled } = await sdk.client.fetch<{ enabled: boolean }>('/store/otp');
    return enabled;
  } catch {
    return false;
  }
}

export async function sendLoginCode(phone: string): Promise<ActionResult<true>> {
  if (!sdk) return { ok: false, error: 'Phone login is not available.' };
  try {
    await sdk.client.fetch('/store/otp', { method: 'POST', body: { phone } });
    return { ok: true, value: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

interface AddressesResponse {
  email: string | null;
  addresses: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    city: string;
    province: string;
    postal_code: string;
    phone: string;
  }[];
}

/** Checks the code and returns the past addresses of this number. */
export async function verifyLoginCode(
  phone: string,
  code: string,
): Promise<ActionResult<{ email: string | null; addresses: CartAddress[] }>> {
  if (!sdk) return { ok: false, error: 'Phone login is not available.' };
  try {
    // The pass stays on the server: it is used once, right here, and never reaches the browser.
    const { token } = await sdk.client.fetch<{ token: string }>('/store/otp/verify', {
      method: 'POST',
      body: { phone, code },
    });
    const res = await sdk.client.fetch<AddressesResponse>('/store/my-addresses', { headers: { 'x-phone-pass': token } });
    return {
      ok: true,
      value: {
        email: res.email,
        addresses: res.addresses.map((a) => ({
          firstName: a.first_name,
          lastName: a.last_name,
          phone: a.phone.replace(/^\+91/, ''),
          address1: a.address_1,
          address2: a.address_2,
          city: a.city,
          province: a.province,
          postalCode: a.postal_code,
        })),
      },
    };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}
