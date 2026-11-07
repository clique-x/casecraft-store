import Link from 'next/link';
import { AccessoryArt } from '@/components/accessory/AccessoryArt';
import { ACCESSORY_TYPE_LABEL, accessoryPhotoSrc, accessoryPhotoSrcSet, bundlePrice } from '@/lib/catalog/accessories';
import { formatInr } from '@/lib/catalog/photos';
import type { HomeProduct } from '@/lib/medusa/fixtures';
import { cn } from '@/lib/utils';

/** Same as the cover cards' `sizes` (PhotoCard). */
const CARD_SIZES = '(max-width: 640px) 41vw, (max-width: 1024px) 31vw, 240px';

/** Grid card for a screen guard, lens protector or back film; a photographed one shows its first photo. */
export function AccessoryCard({ product, className }: { product: HomeProduct; className?: string }) {
  const a = product.accessory;
  if (!a) return null;
  const regular = product.regularInr !== undefined && product.regularInr > product.priceFromInr ? product.regularInr : null;
  const zoom = 'transition-transform duration-500 ease-out-expo group-hover/card:scale-[1.03]';
  return (
    <Link
      href={`/products/${product.handle}`}
      className={cn('group/card flex h-full flex-col gap-3 rounded-card outline-none focus-visible:ring-3 focus-visible:ring-brand', className)}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card bg-surface-2">
        {a.photos && a.photos.gallery.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer
          <img
            src={accessoryPhotoSrc(a.id, 0, 480)}
            srcSet={accessoryPhotoSrcSet(a.id, 0)}
            sizes={CARD_SIZES}
            width={960}
            height={960}
            alt={`${product.title}: ${a.photos.gallery[0]}`}
            decoding="async"
            loading="lazy"
            className={cn('absolute inset-0 size-full object-cover', zoom)}
          />
        ) : (
          <AccessoryArt accessory={a} className={zoom} />
        )}
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
