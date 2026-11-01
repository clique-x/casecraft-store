import Link from 'next/link';
import { AccessoryArt } from '@/components/accessory/AccessoryArt';
import { ACCESSORY_TYPE_LABEL, bundlePrice } from '@/lib/catalog/accessories';
import { formatInr } from '@/lib/catalog/photos';
import type { HomeProduct } from '@/lib/medusa/fixtures';
import { cn } from '@/lib/utils';

/** Grid card for a screen guard, lens protector or back film. */
export function AccessoryCard({ product, className }: { product: HomeProduct; className?: string }) {
  const a = product.accessory;
  if (!a) return null;
  const regular = product.regularInr !== undefined && product.regularInr > product.priceFromInr ? product.regularInr : null;
  return (
    <Link
      href={`/products/${product.handle}`}
      className={cn('group/card flex h-full flex-col gap-3 rounded-card outline-none focus-visible:ring-3 focus-visible:ring-brand', className)}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card bg-surface-2">
        <AccessoryArt accessory={a} className="transition-transform duration-500 ease-out-expo group-hover/card:scale-[1.03]" />
      </div>
      <div className="flex flex-col gap-1 px-0.5">
        <p className="text-label font-bold tracking-[0.12em] text-fg-muted uppercase">{ACCESSORY_TYPE_LABEL[a.type]}</p>
        <h3 className="truncate font-sans text-base leading-tight font-bold text-fg">{product.title}</h3>
        <p className="flex items-baseline gap-2 text-body tabular-nums">
          <span className="font-bold text-fg">{formatInr(product.priceFromInr)}</span>
          {regular !== null && <s className="text-sm text-fg-muted">{formatInr(regular)}</s>}
        </p>
        <p className="text-caption font-semibold text-brand tabular-nums">{formatInr(bundlePrice(product.priceFromInr))} with any cover</p>
      </div>
    </Link>
  );
}
