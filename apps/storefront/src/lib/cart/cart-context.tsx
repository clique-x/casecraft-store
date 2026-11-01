'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition, type ReactNode } from 'react';
import { addManyToCart, addToCart, getCart, setLineQuantity } from './actions';
import type { CartSummary } from './types';

interface CartState {
  /** False when the store runs on sample data (no Medusa): cart buttons fall back to WhatsApp. */
  enabled: boolean;
  cart: CartSummary | null;
  /** The cart has been read from the server at least once. */
  ready: boolean;
  pending: boolean;
  error: string | null;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  add: (variantId: string, options?: { openDrawer?: boolean }) => Promise<boolean>;
  /** Several variants at once: a cover with add-ons, or a ready-made bundle. */
  addMany: (variantIds: string[], options?: { openDrawer?: boolean }) => Promise<boolean>;
  setQuantity: (lineId: string, quantity: number) => Promise<void>;
  refresh: () => Promise<void>;
  /** Replaces the local copy, e.g. after checkout saved the address. */
  replace: (cart: CartSummary | null) => void;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [ready, setReady] = useState(!enabled);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      setCart(await getCart());
    } finally {
      setReady(true);
    }
  }, [enabled]);

  // Pages are static, and the cart cookie is httpOnly, so the cart is read after hydration.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (variantId: string, options?: { openDrawer?: boolean }) => {
      setError(null);
      const result = await addToCart(variantId);
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      startTransition(() => setCart(result.value));
      if (options?.openDrawer !== false) setDrawerOpen(true);
      return true;
    },
    [],
  );

  const addMany = useCallback(async (variantIds: string[], options?: { openDrawer?: boolean }) => {
    setError(null);
    const result = await addManyToCart(variantIds);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    startTransition(() => setCart(result.value));
    if (options?.openDrawer !== false) setDrawerOpen(true);
    return true;
  }, []);

  const setQuantity = useCallback(async (lineId: string, quantity: number) => {
    setError(null);
    const result = await setLineQuantity(lineId, quantity);
    if (!result.ok) setError(result.error);
    else startTransition(() => setCart(result.value));
  }, []);

  const value = useMemo<CartState>(
    () => ({ enabled, cart, ready, pending, error, drawerOpen, setDrawerOpen, add, addMany, setQuantity, refresh, replace: setCart }),
    [enabled, cart, ready, pending, error, drawerOpen, add, addMany, setQuantity, refresh],
  );
  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
