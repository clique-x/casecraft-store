'use client';

import { createContext, useContext } from 'react';
import type { PhoneModel } from '@/lib/medusa/fixtures';

export interface MyPhoneState {
  phone: PhoneModel | null;
  setPhone: (slug: string | null) => void;
  models: PhoneModel[];
}

export const MyPhoneContext = createContext<MyPhoneState | null>(null);

export function useMyPhone(): MyPhoneState {
  const ctx = useContext(MyPhoneContext);
  if (!ctx) throw new Error('useMyPhone must be used inside <MyPhoneProvider>');
  return ctx;
}
