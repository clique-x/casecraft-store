'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCart } from '@/lib/cart/cart-context';
import { cn } from '@/lib/utils';

const BASE =
  'inline-flex h-13 min-w-0 items-center justify-center gap-2 rounded-[10px] px-4 text-[0.9375rem] font-semibold tracking-[-0.005em] whitespace-nowrap transition-colors duration-(--dur-micro) outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed';
const OUTLINE = 'border border-fg/80 bg-paper text-fg hover:bg-surface-2 disabled:border-border disabled:text-fg-muted disabled:hover:bg-paper';
const SOLID =
  'bg-fg text-paper shadow-[0_1px_2px_color-mix(in_srgb,var(--color-shadow)_20%,transparent)] hover:bg-[#2b2b2b] disabled:bg-fg/40';

interface BuyButtonsProps {
  /** Medusa variant for the current phone / case type; null until a phone is chosen. */
  variantId: string | null;
  soldOut: boolean;
  /** wa.me link: the fallback order path without Medusa, and "Notify me" for sold-out variants. */
  whatsappHref: string;
  /** Shown inside Buy now, e.g. "₹1,149"; the sticky bar uses it on phones where there is no price column. */
  priceLabel?: string;
  className?: string;
}

/** Add to cart + Buy now, shared by the buy box and the sticky bar. */
export function BuyButtons({ variantId, soldOut, whatsappHref, priceLabel, className }: BuyButtonsProps) {
  const router = useRouter();
  const { enabled, add } = useCart();
  const [busy, setBusy] = useState<'add' | 'buy' | null>(null);

  const price = priceLabel ? <span className="font-medium text-paper/70 tabular-nums">· {priceLabel}</span> : null;

  if (!enabled) {
    // Sample-data mode: no cart backend, so orders go through WhatsApp.
    return (
      <div className={cn('grid grid-cols-2 gap-2.5', className)}>
        <button type="button" disabled title="The cart needs the shop backend" className={cn(BASE, OUTLINE)}>
          Add to cart
        </button>
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={cn(BASE, SOLID)}>
          {soldOut ? 'Notify me' : 'Buy now'}
          {!soldOut && price}
        </a>
      </div>
    );
  }

  if (soldOut) {
    return (
      <div className={cn('grid grid-cols-2 gap-2.5', className)}>
        <button type="button" disabled className={cn(BASE, OUTLINE)}>
          Sold out
        </button>
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={cn(BASE, OUTLINE)}>
          Notify me
        </a>
      </div>
    );
  }

  const run = async (kind: 'add' | 'buy') => {
    if (!variantId || busy) return;
    setBusy(kind);
    const ok = await add(variantId, { openDrawer: kind === 'add' });
    setBusy(null);
    if (ok && kind === 'buy') router.push('/checkout');
  };

  const noPhone = variantId === null;
  return (
    <div className={cn('grid grid-cols-2 gap-2.5', className)}>
      <button
        type="button"
        onClick={() => run('add')}
        disabled={noPhone || busy !== null}
        title={noPhone ? 'Choose your phone first' : undefined}
        className={cn(BASE, OUTLINE)}
      >
        {busy === 'add' && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {noPhone ? 'Choose phone' : 'Add to cart'}
      </button>
      <button type="button" onClick={() => run('buy')} disabled={noPhone || busy !== null} className={cn(BASE, SOLID)}>
        {busy === 'buy' && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Buy now
        {price}
      </button>
    </div>
  );
}
