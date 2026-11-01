'use client';

import { useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { BuyButtons } from '@/components/product/BuyButtons';
import { PriceTag } from '@/components/product/PriceTag.client';
import { StockLine } from '@/components/product/StockLine.client';
import { AUDIO_TYPE_LABEL } from '@/lib/catalog/audio';
import type { ProductDetail } from '@/lib/medusa/fixtures';
import { DEFAULT_SELECTION, useVariantSelection, variantStore } from '@/lib/product/variant-store';
import { askOnWhatsAppHref } from '@/lib/product/whatsapp-link';
import { cn } from '@/lib/utils';

/**
 * Buy box for earbuds, neckbands and speakers: colour swatches instead of the phone picker. The colour
 * slug goes in the shared selection's `modelSlug`, so the sticky bar and cart work as on cover pages.
 */
export function AudioBuyBox({ product }: { product: ProductDetail }) {
  const audio = product.audio!;
  const selection = useVariantSelection();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get('colour');
    const inStock = product.variants.find((v) => v.stock > 0)?.modelSlug ?? product.variants[0]?.modelSlug ?? null;
    const start = product.variants.some((v) => v.modelSlug === query) ? query : inStock;
    variantStore.reset({ modelSlug: start, caseType: 'soft' });
    return () => variantStore.reset(DEFAULT_SELECTION);
  }, [product]);

  useEffect(() => {
    const current = variantStore.get().modelSlug;
    if (!current) return;
    const url = new URL(window.location.href);
    url.searchParams.set('colour', current);
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [selection]);

  const variant = product.variants.find((v) => v.modelSlug === selection.modelSlug) ?? null;
  const colour = audio.colours.find((c) => c.slug === selection.modelSlug) ?? null;
  const soldOut = variant !== null && variant.stock <= 0;
  const price = variant?.priceInr ?? product.priceFromInr;
  const whatsappHref = askOnWhatsAppHref({
    productName: product.title,
    modelName: colour ? `${colour.name} colour` : null,
    caseTypeName: null,
    sku: variant?.sku ?? null,
    intent: soldOut ? 'notify' : 'order',
  });

  return (
    <section id="buy-box" aria-labelledby="buy-box-title" className="flex flex-col gap-7 text-fg">
      <header className="flex flex-col gap-3">
        <p className="text-label font-bold tracking-[0.2em] text-accent-text uppercase">{AUDIO_TYPE_LABEL[audio.type]}</p>
        <h1 id="buy-box-title" className="font-display text-h2 text-balance">
          {product.title}
        </h1>
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <PriceTag priceInr={price} regularInr={product.regularInr} />
          <StockLine stock={variant ? variant.stock : null} />
        </div>
        <p className="text-body text-fg-muted">{audio.short}</p>
      </header>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-fg">
          Colour: <span className="font-normal text-fg-muted">{colour?.name ?? 'Choose'}</span>
        </p>
        <div role="radiogroup" aria-label="Colour" className="flex flex-wrap gap-3">
          {audio.colours.map((c) => {
            const v = product.variants.find((x) => x.modelSlug === c.slug);
            const on = c.slug === selection.modelSlug;
            const out = !v || v.stock <= 0;
            return (
              <button
                key={c.slug}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={`${c.name}${out ? ', sold out' : ''}`}
                title={c.name}
                onClick={() => variantStore.set({ modelSlug: c.slug })}
                className={cn(
                  'relative grid size-11 place-items-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                  on ? 'ring-2 ring-fg ring-offset-2 ring-offset-paper' : 'ring-1 ring-border hover:ring-fg/40',
                )}
              >
                <span className="size-8 rounded-full ring-1 ring-black/15" style={{ background: c.hex }} />
                {out && <span aria-hidden="true" className="absolute h-0.5 w-9 rotate-45 bg-fg-muted" />}
              </button>
            );
          })}
        </div>
      </div>

      <div id="buy-actions" className="flex flex-col gap-3">
        <BuyButtons variantId={variant?.id ?? null} soldOut={soldOut} whatsappHref={whatsappHref} />
        <p className="text-caption text-fg-muted">Pay by UPI, card, netbanking or Cash on Delivery at checkout.</p>
        <a
          href={askOnWhatsAppHref({ productName: product.title, modelName: null, caseTypeName: null, sku: null })}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 self-start rounded-sm text-sm font-semibold text-fg underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <MessageCircle className="size-4 text-whatsapp" aria-hidden="true" />
          Questions? Chat with us on WhatsApp
        </a>
      </div>
    </section>
  );
}
