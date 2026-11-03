'use client';

import { useState } from 'react';
import { Check, Loader2, Plus, Smartphone } from 'lucide-react';
import { AccessoryArt } from '@/components/accessory/AccessoryArt';
import { CoverCarousel } from '@/components/home/CoverCarousel.client';
import { phoneHref } from '@/components/phone-picker/BrandOutline';
import { ProcCaseThumb } from '@/components/product/ProcCaseThumb';
import { BUNDLE_SAVING_INR, bundlePrice, kitsFor, type AccessoryEntry } from '@/lib/catalog/accessories';
import { formatInr, backdropThumbSrc, backdropThumbSrcSet, getPhoto } from '@/lib/catalog/photos';
import { useCart } from '@/lib/cart/cart-context';
import { getDesign } from '@/lib/designs/catalog';
import { pickerSheet } from '@/lib/phone/picker-sheet-store';
import { useMyPhone } from '@/lib/phone/use-my-phone';
import { cn } from '@/lib/utils';

export interface ComboVariant {
  id: string;
  modelSlug: string;
  priceInr: number;
  stock: number;
}

export interface ComboCover {
  id: string;
  handle: string;
  title: string;
  photoId: number | null;
  designId: string;
  /** One variant per phone (the soft case for printed designs). */
  variants: ComboVariant[];
}

export interface ComboAccessory {
  entry: AccessoryEntry;
  title: string;
  priceInr: number;
  variants: ComboVariant[];
}

const MOST_PICKED = 'full';

function CoverThumb({ cover }: { cover: ComboCover }) {
  if (cover.photoId !== null) {
    const entry = getPhoto(cover.photoId);
    if (entry) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- small catalogue photo at a fixed size
        <img src={backdropThumbSrc(entry, 160)} srcSet={backdropThumbSrcSet(entry)} sizes="128px" alt="" className="h-full w-full object-cover" loading="lazy" />
      );
    }
  }
  const design = getDesign(cover.designId);
  return design ? <ProcCaseThumb design={design} className="h-full w-auto" /> : null;
}

const inStock = (variants: ComboVariant[], slug: string) => variants.find((v) => v.modelSlug === slug && v.stock > 0) ?? null;

/**
 * "Combo deals" on the home page: the visitor's phone, a cover they choose from the top covers
 * for it, and ready-made protection kits at bundle price (₹50 off each add-on via BUNDLE50).
 */
export function HomeCombos({ covers, accessories }: { covers: ComboCover[]; accessories: ComboAccessory[] }) {
  const { phone } = useMyPhone();
  const { enabled, addMany } = useCart();
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const slug = phone?.slug ?? null;
  // Every in-stock design for this phone, trending first.
  const choices = slug ? covers.filter((c) => inStock(c.variants, slug)) : [];
  const cover = choices.find((c) => c.id === picked) ?? choices[0] ?? null;
  const coverVariant = cover && slug ? inStock(cover.variants, slug) : null;
  const cheapestCover = Math.min(...covers.flatMap((c) => c.variants.map((v) => v.priceInr)));

  const kits = kitsFor(slug).map((kit) => {
    const items = kit.accessoryIds.map((id) => accessories.find((a) => a.entry.id === id)).filter((a): a is ComboAccessory => Boolean(a));
    const variants = slug ? items.map((a) => inStock(a.variants, slug)) : [];
    const coverPrice = coverVariant?.priceInr ?? cheapestCover;
    const price = coverPrice + items.reduce((n, a) => n + bundlePrice(a.priceInr), 0);
    const separately = coverPrice + items.reduce((n, a) => n + a.priceInr, 0);
    const available = Boolean(coverVariant) && variants.length === items.length && variants.every(Boolean);
    const variantIds = [coverVariant?.id, ...variants.map((v) => v?.id)].filter((x): x is string => Boolean(x));
    return { kit, items, price, separately, available, variantIds };
  });

  return (
    <section id="combos" aria-labelledby="combos-heading" className="scroll-mt-20 bg-surface-2 py-14 text-fg lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-label font-bold tracking-[0.16em] text-brand uppercase">Combo deals</p>
            <h2 id="combos-heading" className="mt-2 font-display text-h2 font-extrabold text-balance">
              Cover, glass and camera, sorted in one tap
            </h2>
            <p className="mt-2 text-body text-fg-muted">
              Every piece is cut for the same phone. {formatInr(BUNDLE_SAVING_INR)} off each add-on when it comes with a cover.
            </p>
          </div>
          <button
            type="button"
            onClick={() => pickerSheet.open()}
            className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-full border border-border bg-paper px-4 text-sm font-semibold text-fg transition-colors hover:border-fg sm:self-auto"
          >
            <Smartphone className="size-4" aria-hidden="true" />
            {phone ? (
              <>
                For {phone.model} <span className="text-brand">· Change</span>
              </>
            ) : (
              'Pick your phone'
            )}
          </button>
        </div>

        {phone && choices.length > 1 && (
          <CoverCarousel
            covers={choices.map((c) => ({
              id: c.id,
              handle: c.handle,
              title: c.title,
              priceInr: inStock(c.variants, phone.slug)?.priceInr ?? 0,
              thumb: <CoverThumb cover={c} />,
            }))}
            selectedId={cover?.id ?? null}
            onSelect={setPicked}
            phoneName={phone.model}
            allHref={phoneHref(phone)}
          />
        )}

        {/* Phones: swipe one combo at a time, the next one peeking in. Larger screens: a grid. */}
        <ul
          aria-label="Combo deals"
          className={cn(
            '-mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden',
            kits.length > 3 ? 'xl:grid-cols-4' : 'lg:grid-cols-3',
          )}
        >
          {kits.map(({ kit, items, price, separately, available, variantIds }) => {
            const featured = kit.id === MOST_PICKED;
            return (
              <li
                key={kit.id}
                className={cn(
                  'relative flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-paper sm:w-auto',
                  featured ? 'border-fg shadow-sm' : 'border-border',
                )}
              >
                {featured && (
                  <span className="absolute top-3 left-3 z-10 rounded-full bg-fg px-2.5 py-1 text-[0.6875rem] font-bold text-paper">Most picked</span>
                )}
                {kit.flagshipOnly && (
                  <span className="absolute top-3 left-3 z-10 rounded-full bg-brand px-2.5 py-1 text-[0.6875rem] font-bold text-paper">For flagships</span>
                )}
                <span className="absolute top-3 right-3 z-10 rounded-full bg-brand-coral px-2.5 py-1 text-[0.6875rem] font-bold text-fg tabular-nums">
                  Save {formatInr(separately - price)}
                </span>

                <div className="flex items-center justify-center gap-1.5 bg-surface-2/70 px-4 pt-12 pb-5" aria-hidden="true">
                  <span className="flex h-28 w-16 items-center justify-center overflow-hidden rounded-lg bg-paper">
                    {cover ? <CoverThumb cover={cover} /> : <span className="px-1 text-center text-[0.625rem] font-semibold text-fg-muted">Your cover</span>}
                  </span>
                  {items.map((a) => (
                    <span key={a.entry.id} className="flex items-center gap-1.5">
                      <Plus className="size-3.5 text-fg-muted" />
                      <span className="h-28 w-[4.5rem] overflow-hidden rounded-lg bg-paper">
                        <AccessoryArt accessory={a.entry} island={phone?.islandStyle} />
                      </span>
                    </span>
                  ))}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <h3 className="text-lg font-extrabold">{kit.name}</h3>
                  <ul className="flex flex-col gap-1.5 text-sm">
                    <li className="flex items-start justify-between gap-3">
                      <span className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                        <span className="min-w-0">{cover ? cover.title : 'Any cover for your phone'}</span>
                      </span>
                      <span className="shrink-0 text-fg-muted tabular-nums">
                        {coverVariant ? formatInr(coverVariant.priceInr) : `from ${formatInr(cheapestCover)}`}
                      </span>
                    </li>
                    {items.map((a) => (
                      <li key={a.entry.id} className="flex items-start justify-between gap-3">
                        <span className="flex items-start gap-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                          <span className="min-w-0">{a.title}</span>
                        </span>
                        <span className="shrink-0 tabular-nums">
                          <s className="mr-1.5 text-caption text-fg-muted">{formatInr(a.priceInr)}</s>
                          {formatInr(bundlePrice(a.priceInr))}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex items-baseline gap-2 border-t border-border pt-3 tabular-nums">
                    <span className="text-2xl font-extrabold">
                      {!coverVariant && <span className="mr-1 text-sm font-semibold text-fg-muted">from</span>}
                      {formatInr(price)}
                    </span>
                    <s className="text-sm text-fg-muted">{formatInr(separately)}</s>
                  </div>

                  {!phone ? (
                    <button
                      type="button"
                      onClick={() => pickerSheet.open()}
                      className="inline-flex h-12 items-center justify-center rounded-[10px] border border-fg text-base font-semibold text-fg transition-colors hover:bg-surface-2"
                    >
                      Pick your phone
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!enabled || !available || busy !== null}
                      onClick={async () => {
                        setBusy(kit.id);
                        await addMany(variantIds, { openDrawer: true });
                        setBusy(null);
                      }}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-fg text-base font-semibold text-paper transition-colors hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:bg-fg/40"
                    >
                      {busy === kit.id && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                      {available ? `Add combo · ${items.length + 1} items` : 'Out of stock for this phone'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
