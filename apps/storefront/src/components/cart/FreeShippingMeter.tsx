import { FREE_SHIPPING_THRESHOLD_INR } from '@/lib/brand';
import { formatInr } from '@/lib/catalog/photos';

/** "₹120 away from free shipping" with a thin progress bar. */
export function FreeShippingMeter({ subtotal }: { subtotal: number }) {
  const left = Math.max(0, FREE_SHIPPING_THRESHOLD_INR - subtotal);
  const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD_INR) * 100));
  return (
    <div className="flex flex-col gap-2">
      <p className="text-caption font-medium text-fg">
        {left > 0 ? (
          <>
            Add <span className="font-bold tabular-nums">{formatInr(left)}</span> more for free shipping
          </>
        ) : (
          <>You get free shipping on this order</>
        )}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
