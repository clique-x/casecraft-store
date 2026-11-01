'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { AccessoryArt } from '@/components/accessory/AccessoryArt';
import { ProcCaseThumb } from '@/components/product/ProcCaseThumb';
import { bundlePrice, kitsFor } from '@/lib/catalog/accessories';
import { formatInr, photoSrc } from '@/lib/catalog/photos';
import { useCart } from '@/lib/cart/cart-context';
import { getDesign } from '@/lib/designs/catalog';
import type { PhoneModel, ProductDetail, Variant } from '@/lib/medusa/fixtures';
import { findVariant } from '@/lib/medusa/variants';
import { accessoryVariant } from '@/lib/product/addons';
import { useVariantSelection } from '@/lib/product/variant-store';
import { cn } from '@/lib/utils';

interface Props {
  product: ProductDetail;
  accessories: readonly ProductDetail[];
  models: PhoneModel[];
}

function coverVariant(product: ProductDetail, modelSlug: string | null, caseType: Variant['caseType']): Variant | null {
  if (!modelSlug) return null;
  if (product.caseTypes.length > 0) return findVariant(product, modelSlug, caseType);
  return product.variants.find((v) => v.modelSlug === modelSlug) ?? null;
}

function CoverThumb({ product }: { product: ProductDetail }) {
  if (product.photo) {
    // eslint-disable-next-line @next/next/no-img-element -- small catalogue photo at a fixed size
    return <img src={photoSrc(product.photo.id, 320)} alt="" className="h-full w-full object-contain" loading="lazy" />;
  }
  const design = getDesign(product.designId);
  return design ? <ProcCaseThumb design={design} className="h-full w-full" /> : null;
}

/** Ready-made kits for this cover: the cover plus screen glass and/or lens protector, at bundle price. */
export function BundleKits({ product, accessories, models }: Props) {
  const { enabled, addMany } = useCart();
  const { modelSlug, caseType } = useVariantSelection();
  const [busy, setBusy] = useState<string | null>(null);
  if (!enabled || product.accessory) return null;

  const model = models.find((m) => m.slug === modelSlug) ?? null;
  const cover = coverVariant(product, modelSlug, caseType);
  const kits = kitsFor(modelSlug).map((kit) => {
    const items = kit.accessoryIds
      .map((id) => accessories.find((a) => a.accessory?.id === id))
      .filter((a): a is ProductDetail => Boolean(a));
    const variants = items.map((a) => accessoryVariant(a, modelSlug));
    // Compared with buying the same items separately today, so it matches the cart's "Bundle saving".
    const regular = (cover?.priceInr ?? product.priceFromInr) + items.reduce((n, a) => n + a.priceFromInr, 0);
    const price = (cover?.priceInr ?? product.priceFromInr) + items.reduce((n, a) => n + bundlePrice(a.priceFromInr), 0);
    const available = Boolean(cover && cover.stock > 0 && items.length === kit.accessoryIds.length && variants.every(Boolean));
    return { kit, items, variantIds: [cover?.id, ...variants.map((v) => v?.id)].filter(Boolean) as string[], regular, price, available };
  });
  if (kits.every((k) => k.items.length === 0)) return null;

  return (
    <section aria-labelledby="bundles-heading" className="bg-surface-2 py-12 lg:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="bundles-heading" className="font-display text-h2 font-extrabold text-balance text-fg">
          Ready-made bundles{model ? ` for ${model.model}` : ''}
        </h2>
        <p className="mt-2 text-body text-fg-muted">This cover with the protection most people add. Everything is cut for the same phone.</p>

        <ul className={cn('mt-8 grid gap-4 md:grid-cols-2', kits.length > 3 ? 'xl:grid-cols-4' : 'lg:grid-cols-3')}>
          {kits.map(({ kit, items, variantIds, regular, price, available }) => (
            <li key={kit.id} className="flex flex-col gap-4 rounded-xl border border-border bg-paper p-4">
              <div className="flex items-center gap-2" aria-hidden="true">
                <span className="h-24 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  <CoverThumb product={product} />
                </span>
                {items.map((a) => (
                  <span key={a.id} className="flex items-center gap-2">
                    <Plus className="size-4 text-fg-muted" />
                    <span className="h-24 w-[4.5rem] overflow-hidden rounded-lg bg-surface-2">
                      <AccessoryArt accessory={a.accessory!} island={model?.islandStyle} />
                    </span>
                  </span>
                ))}
              </div>
              <div>
                <p className="flex items-center gap-2 text-base font-extrabold text-fg">
                  {kit.name}
                  {regular > price && (
                    <span className="rounded-full bg-brand-coral px-2 py-0.5 text-[0.6875rem] font-bold text-fg tabular-nums">
                      Save {formatInr(regular - price)}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-fg-muted">{kit.blurb}</p>
              </div>
              <p className="mt-auto flex items-baseline gap-2 tabular-nums">
                <span className="text-xl font-extrabold text-fg">{formatInr(price)}</span>
                {regular > price && <s className="text-sm text-fg-muted">{formatInr(regular)}</s>}
              </p>
              <button
                type="button"
                disabled={!available || busy !== null}
                onClick={async () => {
                  setBusy(kit.id);
                  await addMany(variantIds, { openDrawer: true });
                  setBusy(null);
                }}
                className={cn(
                  'inline-flex h-12 items-center justify-center gap-2 rounded-[10px] text-base font-semibold transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                  available ? 'bg-fg text-paper hover:bg-[#2b2b2b]' : 'cursor-not-allowed border border-border text-fg-muted',
                )}
              >
                {busy === kit.id && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {available ? `Add bundle · ${items.length + 1} items` : model ? 'Not available for this phone' : 'Choose your phone above'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
