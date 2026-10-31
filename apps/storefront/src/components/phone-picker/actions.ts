'use server';

import { cookies } from 'next/headers';
import { PHONE_MODELS } from '@/lib/medusa/fixtures';

const MY_PHONE_COOKIE = 'my_phone';
const ONE_YEAR_S = 365 * 24 * 60 * 60;

export async function setMyPhone(slug: string | null): Promise<void> {
  const store = await cookies();
  if (slug === null) {
    store.delete(MY_PHONE_COOKIE);
    return;
  }
  if (!PHONE_MODELS.some((m) => m.slug === slug)) {
    throw new Error('Unknown phone model');
  }
  store.set(MY_PHONE_COOKIE, slug, {
    maxAge: ONE_YEAR_S,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
  });
}
