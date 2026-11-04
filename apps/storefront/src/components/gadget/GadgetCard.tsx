import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { GadgetArt } from '@/components/gadget/GadgetArt';
import { PhoneFitNote } from '@/components/gadget/PhoneFitNote.client';
import { keepTogether } from '@/components/gadget/keep-together';
import { GADGET_TYPE_LABEL, gadgetCardSrc, gadgetCardSrcSet, gadgetHeroIndex } from '@/lib/catalog/gadgets';
import { formatInr } from '@/lib/catalog/photos';
import type { HomeProduct } from '@/lib/medusa/fixtures';
import { cn } from '@/lib/utils';

const CARD_SIZES = '(max-width: 768px) 46vw, (max-width: 1024px) 31vw, (max-width: 1280px) 23vw, 240px';

/** Grid card for audio, chargers and cables, with the colours or lengths it comes in. */
export function GadgetCard({ product, className }: { product: HomeProduct; className?: string }) {
  const g = product.gadget;
  if (!g) return null;
  const hero = g.photos ? gadgetHeroIndex(g.photos, g.options[0]?.slug) : 0;
  const regular = product.regularInr !== undefined && product.regularInr > product.priceFromInr ? product.regularInr : null;
  const fromPrice = new Set(product.gadget?.options.map((o) => o.priceInr ?? g.priceInr)).size > 1;
  return (
    <Link
      href={`/products/${product.handle}`}
      className={cn('group/card flex h-full flex-col gap-3 rounded-card outline-none focus-visible:ring-3 focus-visible:ring-brand', className)}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card bg-surface-2">
        {g.photos ? (
          // eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer
          <img
            src={gadgetCardSrc(g.photos, hero)}
            srcSet={gadgetCardSrcSet(g.photos, hero)}
            sizes={CARD_SIZES}
            width={480}
            height={600}
            alt=""
            decoding="async"
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out-expo group-hover/card:scale-[1.03]"
          />
        ) : (
          <GadgetArt gadget={g} hex={g.options[0]?.hex} className="transition-transform duration-500 ease-out-expo group-hover/card:scale-[1.03]" />
        )}
        {g.original ? (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-[0.6875rem] font-bold text-fg shadow-sm">
            <BadgeCheck className="size-3.5 text-brand" aria-hidden="true" />
            Original
          </span>
        ) : (
          regular !== null && (
            <span className="absolute top-2 left-2 rounded-full bg-brand-coral px-2 py-0.5 text-[0.6875rem] font-bold text-fg tabular-nums">
              {Math.round((1 - product.priceFromInr / regular) * 100)}% off
            </span>
          )
        )}
      </div>
      <div className="flex flex-col gap-1 px-0.5">
        <p className="text-label font-bold tracking-[0.12em] text-fg-muted uppercase">
          {g.original ? `${g.original.brand} · ${GADGET_TYPE_LABEL[g.type]}` : GADGET_TYPE_LABEL[g.type]}
        </p>
        <h3 className="line-clamp-2 font-sans text-base leading-tight font-bold text-fg">{keepTogether(product.title)}</h3>
        <p className="flex items-baseline gap-2 text-body tabular-nums">
          <span className="font-bold text-fg">
            {fromPrice ? 'from ' : ''}
            {formatInr(product.priceFromInr)}
          </span>
          {regular !== null && <s className="text-sm text-fg-muted">{formatInr(regular)}</s>}
        </p>
        {g.optionKind === 'colour' ? (
          <p className="flex items-center gap-1.5" aria-label={`Colours: ${g.options.map((c) => c.name).join(', ')}`}>
            {g.options.map((c) => (
              <span key={c.slug} aria-hidden="true" className="size-3.5 rounded-full ring-1 ring-black/15" style={{ background: c.hex }} />
            ))}
          </p>
        ) : (
          <p className="text-caption text-fg-muted">{g.options.map((o) => o.name).join(' · ')}</p>
        )}
        <PhoneFitNote gadget={g} />
      </div>
      <span
        aria-hidden="true"
        className="mt-auto inline-flex h-10 items-center justify-center gap-1.5 rounded-pill bg-fg text-sm font-bold text-paper transition-colors duration-(--dur-micro) group-hover/card:bg-brand"
      >
        {g.options.length > 1 ? (g.optionKind === 'colour' ? 'Choose colour' : 'Choose length') : 'Buy now'}
      </span>
    </Link>
  );
}
