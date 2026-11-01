import Link from 'next/link';
import { AudioArt } from '@/components/audio/AudioArt';
import { AUDIO_TYPE_LABEL } from '@/lib/catalog/audio';
import { formatInr } from '@/lib/catalog/photos';
import type { HomeProduct } from '@/lib/medusa/fixtures';
import { cn } from '@/lib/utils';

/** Grid card for earbuds, neckbands and speakers, with the colours it comes in. */
export function AudioCard({ product, className }: { product: HomeProduct; className?: string }) {
  const a = product.audio;
  if (!a) return null;
  const regular = product.regularInr !== undefined && product.regularInr > product.priceFromInr ? product.regularInr : null;
  return (
    <Link
      href={`/products/${product.handle}`}
      className={cn('group/card flex h-full flex-col gap-3 rounded-card outline-none focus-visible:ring-3 focus-visible:ring-brand', className)}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card bg-surface-2">
        <AudioArt audio={a} hex={a.colours[0]?.hex} className="transition-transform duration-500 ease-out-expo group-hover/card:scale-[1.03]" />
        {regular !== null && (
          <span className="absolute top-2 left-2 rounded-full bg-brand-coral px-2 py-0.5 text-[0.6875rem] font-bold text-fg tabular-nums">
            {Math.round((1 - product.priceFromInr / regular) * 100)}% off
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 px-0.5">
        <p className="text-label font-bold tracking-[0.12em] text-fg-muted uppercase">{AUDIO_TYPE_LABEL[a.type]}</p>
        <h3 className="truncate font-sans text-base leading-tight font-bold text-fg">{product.title}</h3>
        <p className="flex items-baseline gap-2 text-body tabular-nums">
          <span className="font-bold text-fg">{formatInr(product.priceFromInr)}</span>
          {regular !== null && <s className="text-sm text-fg-muted">{formatInr(regular)}</s>}
        </p>
        <p className="flex items-center gap-1.5" aria-label={`Colours: ${a.colours.map((c) => c.name).join(', ')}`}>
          {a.colours.map((c) => (
            <span key={c.slug} aria-hidden="true" className="size-3.5 rounded-full ring-1 ring-black/15" style={{ background: c.hex }} />
          ))}
        </p>
      </div>
    </Link>
  );
}
