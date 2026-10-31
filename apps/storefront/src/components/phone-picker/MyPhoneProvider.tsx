'use client';

import { useCallback, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { MyPhoneContext, type MyPhoneState } from '@/lib/phone/use-my-phone';
import type { PhoneModel } from '@/lib/medusa/fixtures';
import { setMyPhone } from './actions';

interface MyPhoneProviderProps {
  initialSlug: string | null;
  models: PhoneModel[];
  children: ReactNode;
}

const COOKIE_RE = /(?:^|;\s*)my_phone=([^;]*)/;

function readCookieSlug(): string | null {
  const match = COOKIE_RE.exec(document.cookie);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

const subscribeNoop = () => () => {};
const getServerSlug = (): string | null => null;

export function MyPhoneProvider({ initialSlug, models, children }: MyPhoneProviderProps) {
  // Hydrates with the server's value (null on static routes), then reads the cookie client-side.
  const cookieSlug = useSyncExternalStore(subscribeNoop, readCookieSlug, getServerSlug);
  const [override, setOverride] = useState<string | null | undefined>(undefined);

  const candidate = override !== undefined ? override : (initialSlug ?? cookieSlug);
  const slug = candidate && models.some((m) => m.slug === candidate) ? candidate : null;

  const setPhone = useCallback(
    (next: string | null) => {
      if (next === slug) return;
      if (next !== null && !models.some((m) => m.slug === next)) return;
      const prev = slug;
      setOverride(next);
      setMyPhone(next).catch(() => setOverride(prev));
    },
    [models, slug],
  );

  const value = useMemo<MyPhoneState>(
    () => ({
      phone: slug ? (models.find((m) => m.slug === slug) ?? null) : null,
      setPhone,
      models,
    }),
    [slug, models, setPhone],
  );

  return <MyPhoneContext value={value}>{children}</MyPhoneContext>;
}

export default MyPhoneProvider;
