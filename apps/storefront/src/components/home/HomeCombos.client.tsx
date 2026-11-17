'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, Plus, Smartphone } from 'lucide-react';
import { CoverCarousel } from '@/components/home/CoverCarousel.client';
import { phoneHref } from '@/components/phone-picker/BrandOutline';
import { BUNDLE_SAVING_INR, accessoryPhotoSrc, bundlePrice, type AccessoryEntry } from '@/lib/catalog/accessories';
import { backdropThumbSrc, backdropThumbSrcSet, formatInr, getPhoto } from '@/lib/catalog/photos';
import { useCart } from '@/lib/cart/cart-context';
import { pickerSheet } from '@/lib/phone/picker-sheet-store';
import { useMyPhone } from '@/lib/phone/use-my-phone';

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
  photoId: number;
  /** One variant per phone the cover fits. */
  variants: ComboVariant[];
}

export interface ComboAccessory {
  entry: AccessoryEntry;
  title: string;
  /** One variant per phone the guard or film is made for. */
  variants: ComboVariant[];
}

type Role = 'glass' | 'film';

/** The combos: a cover with the screen glass, with the back film, or with both. Every piece is made for the same phone. */
const KITS: readonly { id: string; name: string; roles: readonly Role[] }[] = [
  { id: 'glass', name: 'Cover + screen glass', roles: ['glass'] },
  { id: 'film', name: 'Cover + back film', roles: ['film'] },
  { id: 'full', name: 'Cover + glass + back film', roles: ['glass', 'film'] },
];

const ROLE_LABEL: Record<Role, string> = { glass: 'Screen glass for your phone', film: 'Hydrogel back film for your phone' };

function roleOf(entry: AccessoryEntry): Role | null {
  if (entry.type === 'screen-guard') return 'glass';
  if (entry.type === 'back-film') return 'film';
  return null;
}

const inStock = (variants: readonly ComboVariant[], slug: string) => variants.find((v) => v.modelSlug === slug && v.stock > 0) ?? null;

function CoverThumb({ cover }: { cover: ComboCover }) {
  const entry = getPhoto(cover.photoId);
  if (!entry) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small catalogue photo at a fixed size
    <img src={backdropThumbSrc(entry, 160)} srcSet={backdropThumbSrcSet(entry)} sizes="96px" alt={cover.title} className="size-full object-cover" loading="lazy" />
  );
}

function AccessoryThumb({ accessory }: { accessory: ComboAccessory }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- the guard's own shop photo, pre-sized
    <img src={accessoryPhotoSrc(accessory.entry.id, 0, 480)} alt={accessory.title} className="size-full object-cover" loading="lazy" />
  );
}

/**
 * "Combo deals" on the home page: the visitor's phone, a cover they choose for it, and the real screen glass and
 * back film made for that phone at bundle price. The ₹50 off each add-on is the store's automatic BUNDLE50
 * promotion (any screen guard or back film in a cart with a cover), so the total here is what checkout charges.
 */
export function HomeCombos({ covers, accessories }: { covers: ComboCover[]; accessories: ComboAccessory[] }) {
  const { phone } = useMyPhone();
  const { enabled, addMany } = useCart();
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const slug = phone?.slug ?? null;
  const choices = slug ? covers.filter((c) => inStock(c.variants, slug)) : [];
  const cover = choices.find((c) => c.id === picked) ?? choices[0] ?? null;
  const coverVariant = cover && slug ? inStock(cover.variants, slug) : null;
  // Before a phone is picked, the first cover stands in as the example and prices read "from".
  const shownCover = cover ?? covers[0] ?? null;
  const cheapestCover = Math.min(...covers.flatMap((c) => c.variants.map((v) => v.priceInr)));

  // The guard or film for each role: the one made for the visitor's phone, or (no phone yet) the cheapest example.
  const forRole = (role: Role): { accessory: ComboAccessory; variant: ComboVariant | null; priceInr: number } | null => {
    const ofRole = accessories.filter((a) => roleOf(a.entry) === role);
    if (slug) {
      const accessory = ofRole.find((a) => inStock(a.variants, slug));
      const variant = accessory ? inStock(accessory.variants, slug) : null;
      return accessory && variant ? { accessory, variant, priceInr: variant.priceInr } : null;
    }
    const cheapest = [...ofRole].sort((a, b) => a.entry.priceInr - b.entry.priceInr)[0];
    return cheapest ? { accessory: cheapest, variant: null, priceInr: cheapest.entry.priceInr } : null;
  };
  const roles = { glass: forRole('glass'), film: forRole('film') };

  const kits = KITS.flatMap((kit) => {
    const items = kit.roles.map((r) => roles[r]);
    if (items.some((i) => i === null)) return [];
    const parts = items as NonNullable<(typeof items)[number]>[];
    const coverPrice = coverVariant?.priceInr ?? cheapestCover;
    const price = coverPrice + parts.reduce((n, p) => n + bundlePrice(p.priceInr), 0);
    const separately = coverPrice + parts.reduce((n, p) => n + p.priceInr, 0);
    const variantIds = [coverVariant?.id, ...parts.map((p) => p.variant?.id)].filter((x): x is string => Boolean(x));
    const available = Boolean(coverVariant) && variantIds.length === parts.length + 1;
    return [{ kit, parts, price, separately, available, variantIds }];
  });

  const noCovers = Boolean(phone) && choices.length === 0;
  const noKits = Boolean(phone) && !noCovers && kits.length === 0;

  return (
    <section id="combos" aria-labelledby="combos-heading" className="cv-auto scroll-mt-20 bg-surface-2 py-14 text-fg lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-label font-bold tracking-[0.16em] text-brand uppercase">Combo deals</p>
            <h2 id="combos-heading" className="mt-2 font-display text-h2 font-extrabold text-balance">
              Cover, screen glass and back film in one go
            </h2>
            <p className="mt-2 text-body text-fg-muted">
              Every piece is made for the same phone. {formatInr(BUNDLE_SAVING_INR)} off the glass and the back film when they come with a cover.
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

        {(noCovers || noKits) && phone ? (
          <p className="mt-6 max-w-2xl rounded-2xl border border-border bg-paper p-5 text-body text-fg-muted">
            {noCovers
              ? `We have no covers for the ${phone.model} in stock right now, so there is no combo for it yet.`
              : `Screen glass and back films for the ${phone.model} are not in stock yet. The covers for it are on its page.`}{' '}
            <Link href={noCovers ? '/covers' : phoneHref(phone)} className="font-semibold text-fg underline underline-offset-4">
              {noCovers ? 'See all covers' : `Covers for ${phone.model}`}
            </Link>
          </p>
        ) : (
          /* Phones: swipe one combo at a time, the next one peeking in. Larger screens: a grid. */
          <ul
            aria-label="Combo deals"
            className="-mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden"
          >
            {kits.map(({ kit, parts, price, separately, available, variantIds }) => (
              <li key={kit.id} className="relative flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-paper sm:w-auto">
                <span className="absolute top-3 right-3 z-10 rounded-full bg-brand-coral px-2.5 py-1 text-[0.6875rem] font-bold text-fg tabular-nums">
                  Save {formatInr(separately - price)}
                </span>

                <div className="flex items-center justify-center gap-1.5 bg-surface-2/70 px-4 pt-12 pb-5">
                  <span className="flex h-28 w-[5.5rem] items-center justify-center overflow-hidden rounded-lg bg-paper">
                    {shownCover && <CoverThumb cover={shownCover} />}
                  </span>
                  {parts.map((p) => (
                    <span key={p.accessory.entry.id} className="flex items-center gap-1.5">
                      <Plus className="size-3.5 text-fg-muted" aria-hidden="true" />
                      <span className="h-28 w-[5.5rem] overflow-hidden rounded-lg bg-paper">
                        <AccessoryThumb accessory={p.accessory} />
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
                        <span className="min-w-0">{cover ? cover.title : 'A cover for your phone'}</span>
                      </span>
                      <span className="shrink-0 text-fg-muted tabular-nums">
                        {coverVariant ? formatInr(coverVariant.priceInr) : `from ${formatInr(cheapestCover)}`}
                      </span>
                    </li>
                    {parts.map((p, i) => (
                      <li key={p.accessory.entry.id} className="flex items-start justify-between gap-3">
                        <span className="flex items-start gap-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                          <span className="min-w-0">{phone ? p.accessory.title : ROLE_LABEL[kit.roles[i]]}</span>
                        </span>
                        <span className="shrink-0 tabular-nums">
                          <s className="mr-1.5 text-caption text-fg-muted">{formatInr(p.priceInr)}</s>
                          {formatInr(bundlePrice(p.priceInr))}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {!phone && kit.roles.includes('film') && (
                    <p className="text-caption text-fg-muted">The back film is for iPhones, from the iPhone 12 to the 18 Pro.</p>
                  )}

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
                      title={enabled ? undefined : 'The cart needs the shop backend'}
                      onClick={async () => {
                        setBusy(kit.id);
                        await addMany(variantIds, { openDrawer: true });
                        setBusy(null);
                      }}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-fg text-base font-semibold text-paper transition-colors hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:bg-fg/40"
                    >
                      {busy === kit.id && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                      {available ? `Add combo · ${parts.length + 1} items` : 'Out of stock for this phone'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
