'use client';

import { useEffect } from 'react';
import { useCart } from '@/lib/cart/cart-context';

/** The completed cart's cookie was cleared on the server; this updates the header count. */
export function ClearCart() {
  const { refresh } = useCart();
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return null;
}
