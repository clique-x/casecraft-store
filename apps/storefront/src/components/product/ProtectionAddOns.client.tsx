'use client';

import { Check } from 'lucide-react';
import { AccessoryArt } from '@/components/accessory/AccessoryArt';
import { bundlePrice } from '@/lib/catalog/accessories';
import { formatInr } from '@/lib/catalog/photos';
import { useCart } from '@/lib/cart/cart-context';
import type { PhoneModel, ProductDetail } from '@/lib/medusa/fixtures';
import { accessoryVariant, ADDON_IDS } from '@/lib/product/addons';
import { addonStore, useSelectedAddons } from '@/lib/product/addon-store';
import { cn } from '@/lib/utils';

interface Props {
  accessories: readonly ProductDetail[];
  model: PhoneModel | null;
  coverPrice: number;
}

/** "Complete the protection": tick a screen guard and lens protector to add with the cover, at bundle price. */
export function ProtectionAddOns({ accessories, model, coverPrice }: Props) {
  const { enabled } = useCart();
  const selected = useSelectedAddons();
  // Only guards cut for the picked phone: an iPhone cover offers FLAYR glass, a Galaxy S cover G-TEL glass.
  const offers = ADDON_IDS.map((id) => accessories.find((a) => a.accessory?.id === id)).filter(
    (a): a is ProductDetail => Boolean(a?.accessory) && (!model || a!.variants.some((v) => v.modelSlug === model.slug)),
  );
  if (!enabled || offers.length === 0) return null;

  const chosen = offers.filter((a) => selected.includes(a.accessory!.id) && accessoryVariant(a, model?.slug ?? null));
  const availableIds = offers.filter((a) => accessoryVariant(a, model?.slug ?? null)).map((a) => a.accessory!.id);
  const allChosen = availableIds.length > 0 && availableIds.every((id) => selected.includes(id));
  const addOnTotal = chosen.reduce((n, a) => n + bundlePrice(a.priceFromInr), 0);
  // Savings are against today's selling price, the same ₹50 each the cart shows as "Bundle saving".
  const saved = chosen.reduce((n, a) => n + a.priceFromInr - bundlePrice(a.priceFromInr), 0);

  return (
    <section aria-labelledby="addons-heading" className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="addons-heading" className="text-sm font-bold text-fg">
            Complete the protection
          </h2>
          <p className="text-caption font-semibold text-brand">Bundle price with this cover</p>
        </div>
        {availableIds.length > 1 && (
          <button
            type="button"
            onClick={() => addonStore.set(allChosen ? [] : availableIds)}
            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-caption font-semibold text-fg transition-colors hover:border-fg"
          >
            {allChosen ? 'Clear all' : `Select all ${availableIds.length}`}
          </button>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {offers.map((a) => {
          const entry = a.accessory!;
          const available = accessoryVariant(a, model?.slug ?? null) !== null;
          const on = selected.includes(entry.id) && available;
          return (
            <li key={entry.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={!available}
                onClick={() => addonStore.toggle(entry.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[10px] border p-2.5 text-left transition-colors outline-none focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50',
                  on ? 'border-fg bg-surface-2/60' : 'border-border hover:border-fg/40',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn('grid size-5 shrink-0 place-items-center rounded-md border', on ? 'border-fg bg-fg text-paper' : 'border-fg/30')}
                >
                  {on && <Check className="size-3.5" />}
                </span>
                <span className="h-12 w-10 shrink-0 overflow-hidden rounded-md bg-surface-2">
                  <AccessoryArt accessory={entry} island={model?.islandStyle} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-fg">{a.title}</span>
                  <span className="block truncate text-caption text-fg-muted">{available ? entry.short : 'Not available for this phone'}</span>
                </span>
                <span className="shrink-0 text-right tabular-nums">
                  <span className="block text-sm font-bold text-fg">+{formatInr(bundlePrice(a.priceFromInr))}</span>
                  <s className="block text-caption text-fg-muted">{formatInr(a.priceFromInr)}</s>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {chosen.length > 0 && (
        <p className="flex items-baseline justify-between text-sm" aria-live="polite">
          <span className="text-fg-muted">
            Cover + {chosen.length} {chosen.length === 1 ? 'add-on' : 'add-ons'} · you save {formatInr(saved)}
          </span>
          <span className="font-extrabold text-fg tabular-nums">{formatInr(coverPrice + addOnTotal)}</span>
        </p>
      )}
      {!model && <p className="text-caption text-fg-muted">Choose your phone above to add these.</p>}
    </section>
  );
}
