'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { animate, m, useMotionValue, useTransform } from 'motion/react';
import { ArrowRight, ChevronRight, Loader2, ShoppingBag, Smartphone } from 'lucide-react';
import { ComboCoverRail } from '@/components/home/combo/ComboCoverRail.client';
import type { QuickLookImage } from '@/components/home/combo/ComboQuickLook.client';
import { ComboStage, type StageCard } from '@/components/home/combo/ComboStage.client';
import { phoneHref } from '@/components/phone-picker/BrandOutline';
import { FREE_SHIPPING_THRESHOLD_INR } from '@/lib/brand';
import { BUNDLE_SAVING_INR, accessoryPhotoSrc, accessoryPhotoSrcSet, bundlePrice, type AccessoryEntry } from '@/lib/catalog/accessories';
import { backdropThumbSrc, backdropThumbSrcSet, formatInr, gallerySrc, gallerySrcSet, getPhoto, type PhotoEntry } from '@/lib/catalog/photos';
import { useCart } from '@/lib/cart/cart-context';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
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
  photoId: number;
  /** One variant per phone the cover fits. */
  variants: ComboVariant[];
}

/** The few fields of a guard or film the builder uses; the rest of its entry stays on the server. */
export type ComboEntry = Pick<AccessoryEntry, 'id' | 'handle' | 'type' | 'priceInr' | 'features' | 'photos'>;

export interface ComboAccessory {
  entry: ComboEntry;
  title: string;
  /** One variant per phone the guard or film is made for. */
  variants: ComboVariant[];
}

type Role = 'glass' | 'film' | 'lens';

/** The add-ons, in the order they are offered. A phone shows only the ones made for it. */
const ROLES: readonly Role[] = ['glass', 'film', 'lens'];
const ROLE_NAME: Record<Role, string> = { glass: 'Screen glass', film: 'Back film', lens: 'Lens protector' };
const ROLE_TAG: Record<Role, string> = { glass: 'Glass', film: 'Back film', lens: 'Lens' };
/** Shown under the name until a phone is picked and the exact product is known. */
const ROLE_HINT: Record<Role, string> = {
  glass: 'Tempered glass cut for your phone',
  film: 'Hydrogel film, for iPhone and Galaxy S',
  lens: 'Guards the camera lenses',
};

function roleOf(entry: ComboEntry): Role | null {
  if (entry.type === 'screen-guard') return 'glass';
  if (entry.type === 'back-film') return 'film';
  if (entry.type === 'lens-protector') return 'lens';
  return null;
}

const inStock = (variants: readonly ComboVariant[], slug: string) => variants.find((v) => v.modelSlug === slug && v.stock > 0) ?? null;

/** Every photo of a cover for the closer look: its gallery, or the one studio shot when it has none. */
function coverImages(photo: PhotoEntry): QuickLookImage[] {
  const gallery = photo.gallery ?? [];
  if (gallery.length === 0) return [{ src: backdropThumbSrc(photo, 480), srcSet: backdropThumbSrcSet(photo), thumb: backdropThumbSrc(photo, 160), caption: 'Back' }];
  return gallery.map((caption, n) => ({ src: gallerySrc(photo.id, n, 480), srcSet: gallerySrcSet(photo.id, n), thumb: gallerySrc(photo.id, n, 160), caption }));
}

/** Every shop photo of a guard or film. The stage already shows the first, so each has at least that one. */
function accessoryImages(entry: ComboEntry): QuickLookImage[] {
  return (entry.photos?.gallery ?? ['On the stage']).map((caption, n) => ({
    src: accessoryPhotoSrc(entry.id, n, 480),
    srcSet: accessoryPhotoSrcSet(entry.id, n),
    thumb: accessoryPhotoSrc(entry.id, n, 160),
    caption,
  }));
}

/** A rupee amount that counts to its new value instead of jumping. Screen readers get the final figure only. */
function AnimatedInr({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const amount = useMotionValue(value);
  const text = useTransform(amount, (v) => formatInr(Math.round(v)));
  useEffect(() => {
    if (reduced) {
      amount.set(value);
      return;
    }
    const controls = animate(amount, value, { duration: 0.45, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [amount, value, reduced]);
  return (
    <>
      <m.span aria-hidden="true">{text}</m.span>
      <span className="sr-only">{formatInr(value)}</span>
    </>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <h3 className="flex min-w-0 items-center gap-2 text-sm font-bold">
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-fg text-[0.6875rem] leading-none text-paper tabular-nums">{n}</span>
      {children}
    </h3>
  );
}

/**
 * "Combo deals" on the home page, as one builder: the visitor's phone, a cover they choose for it, and a switch
 * for each add-on made for that phone (screen glass, back film, lens protector). The stage shows the combo as it
 * stands and the total follows every change. The ₹50 off each add-on is the store's automatic BUNDLE50 promotion
 * (any of them in a cart with a cover), so the total here is what checkout charges.
 */
export function HomeCombos({ covers, accessories }: { covers: ComboCover[]; accessories: ComboAccessory[] }) {
  const { phone } = useMyPhone();
  const { enabled, addMany } = useCart();
  const [picked, setPicked] = useState<string | null>(null);
  const [off, setOff] = useState<ReadonlySet<Role>>(new Set());
  const [busy, setBusy] = useState(false);

  const slug = phone?.slug ?? null;
  const choices = slug ? covers.filter((c) => inStock(c.variants, slug)) : [];
  const cover = choices.find((c) => c.id === picked) ?? choices[0] ?? null;
  const coverVariant = cover && slug ? inStock(cover.variants, slug) : null;
  // Before a phone is picked, the first cover stands in as the example and prices read "from".
  const shownCover = cover ?? covers[0] ?? null;
  const shownPhoto = shownCover ? getPhoto(shownCover.photoId) : undefined;
  const cheapestCover = Math.min(...covers.flatMap((c) => c.variants.map((v) => v.priceInr)));

  // The guard or film for each role: the one made for the visitor's phone, or (no phone yet) the cheapest example.
  const forRole = (role: Role): { role: Role; accessory: ComboAccessory; variant: ComboVariant | null; priceInr: number } | null => {
    const ofRole = accessories.filter((a) => roleOf(a.entry) === role);
    if (slug) {
      const accessory = ofRole.find((a) => inStock(a.variants, slug));
      const variant = accessory ? inStock(accessory.variants, slug) : null;
      return accessory && variant ? { role, accessory, variant, priceInr: variant.priceInr } : null;
    }
    const cheapest = [...ofRole].sort((a, b) => a.entry.priceInr - b.entry.priceInr)[0];
    return cheapest ? { role, accessory: cheapest, variant: null, priceInr: cheapest.entry.priceInr } : null;
  };
  const offered = ROLES.flatMap((r) => forRole(r) ?? []);
  const parts = offered.filter((p) => !off.has(p.role));

  const coverPrice = coverVariant?.priceInr ?? cheapestCover;
  const price = coverPrice + parts.reduce((n, p) => n + bundlePrice(p.priceInr), 0);
  const saving = parts.reduce((n, p) => n + (p.priceInr - bundlePrice(p.priceInr)), 0);
  const variantIds = [coverVariant?.id, ...parts.map((p) => p.variant?.id)].filter((x): x is string => Boolean(x));
  const available = Boolean(coverVariant) && variantIds.length === parts.length + 1;
  const pieces = parts.length + 1;

  const noCovers = Boolean(phone) && choices.length === 0;
  const noAddOns = Boolean(phone) && !noCovers && offered.length === 0;

  const toggle = (role: Role) =>
    setOff((prev) => {
      const next = new Set(prev);
      if (!next.delete(role)) next.add(role);
      return next;
    });

  const stageCards: StageCard[] = [
    ...(shownCover && shownPhoto
      ? [
          {
            key: 'cover',
            label: 'Cover',
            src: backdropThumbSrc(shownPhoto, 480),
            srcSet: backdropThumbSrcSet(shownPhoto),
            quick: {
              id: shownCover.id,
              kind: 'Cover',
              title: shownCover.title,
              href: `/products/${shownCover.handle}`,
              priceInr: coverPrice,
              from: !coverVariant,
              features: shownPhoto.features,
              images: coverImages(shownPhoto),
            },
          },
        ]
      : []),
    ...parts.map((p) => ({
      key: p.role,
      label: ROLE_TAG[p.role],
      src: accessoryPhotoSrc(p.accessory.entry.id, 0, 480),
      quick: {
        id: p.accessory.entry.id,
        kind: ROLE_NAME[p.role],
        title: p.accessory.title,
        href: `/products/${p.accessory.entry.handle}`,
        priceInr: bundlePrice(p.priceInr),
        wasInr: p.priceInr,
        features: p.accessory.entry.features,
        images: accessoryImages(p.accessory.entry),
      },
    })),
  ];

  return (
    <section id="combos" aria-labelledby="combos-heading" className="cv-auto scroll-mt-20 bg-surface-2 py-10 text-fg lg:py-16">
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-10 xl:px-14">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-x-4">
          <p className="text-label font-bold tracking-[0.16em] whitespace-nowrap text-brand uppercase">Combo deals</p>
          <button
            type="button"
            onClick={() => pickerSheet.open()}
            className="col-start-2 row-start-1 inline-flex h-9 max-w-full min-w-0 items-center gap-1.5 justify-self-end rounded-full border border-border bg-paper px-3 text-[0.8125rem] font-semibold whitespace-nowrap text-fg transition-colors hover:border-fg sm:row-span-3 sm:h-11 sm:gap-2 sm:self-end sm:px-4 sm:text-sm"
          >
            <Smartphone className="size-4 shrink-0" aria-hidden="true" />
            {phone ? (
              <>
                <span className="min-w-0 truncate">{phone.model}</span> <span className="text-brand">· Change</span>
              </>
            ) : (
              'Pick your phone'
            )}
          </button>
          <h2 id="combos-heading" className="col-span-2 font-display text-h2 font-extrabold text-balance sm:col-span-1">
            Build your combo
          </h2>
          <p className="col-span-2 max-w-2xl text-[0.9375rem] leading-snug text-pretty text-fg-muted sm:col-span-1 sm:text-body">
            Cover, screen glass, back film and lens protector for your phone. {formatInr(BUNDLE_SAVING_INR)} off each add-on.
          </p>
        </div>

        {(noCovers || noAddOns) && phone ? (
          <p className="mt-5 max-w-2xl rounded-2xl border border-border bg-paper p-5 text-body text-fg-muted">
            {noCovers
              ? `We have no covers for the ${phone.model} in stock right now, so there is no combo for it yet.`
              : `Screen glass and back films for the ${phone.model} are not in stock yet. The covers for it are on its page.`}{' '}
            <Link href={noCovers ? '/covers' : phoneHref(phone)} className="font-semibold text-fg underline underline-offset-4">
              {noCovers ? 'See all covers' : `Covers for ${phone.model}`}
            </Link>
          </p>
        ) : (
          <div className="mt-4 grid overflow-hidden rounded-3xl border border-border bg-paper shadow-[0_30px_60px_-40px_rgb(27_26_23/0.35)] lg:mt-7 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <ComboStage
              cards={stageCards}
              coverKey={shownCover?.id ?? 'cover'}
              savingInr={saving}
              caption={
                parts.length === 0
                  ? `Switch on an add-on to save ${formatInr(BUNDLE_SAVING_INR)} on it`
                  : `${pieces} pieces${phone ? ` for the ${phone.model}` : ', all made for one phone'}`
              }
              label={`Your combo: ${[shownCover?.title ?? 'a cover', ...parts.map((p) => ROLE_NAME[p.role].toLowerCase())].join(', ')}`}
              className="lg:min-h-0"
            />

            <div className="flex min-w-0 flex-col gap-3 p-4 pb-3.5 sm:gap-5 sm:p-6 lg:p-8">
              {/* 1 · the cover */}
              {phone && cover ? (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <Step n={1}>Cover</Step>
                    <p aria-live="polite" className="min-w-0">
                      <Link href={`/products/${cover.handle}`} className="flex min-w-0 items-baseline gap-1.5 text-sm underline-offset-4 hover:underline">
                        <span className="truncate font-semibold">{cover.title}</span>
                        {coverVariant && <span className="shrink-0 text-fg-muted tabular-nums">{formatInr(coverVariant.priceInr)}</span>}
                      </Link>
                    </p>
                  </div>
                  {choices.length > 1 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <ComboCoverRail
                          covers={choices.flatMap((c) => {
                            const photo = getPhoto(c.photoId);
                            return photo ? [{ id: c.id, title: c.title, src: backdropThumbSrc(photo, 160), srcSet: backdropThumbSrcSet(photo) }] : [];
                          })}
                          selectedId={cover.id}
                          onSelect={setPicked}
                          label={`Designs for ${phone.model}`}
                        />
                      </div>
                      <Link
                        href={phoneHref(phone)}
                        className="hidden shrink-0 items-center gap-1 text-caption font-semibold whitespace-nowrap text-brand underline-offset-4 hover:underline sm:inline-flex"
                      >
                        See all <ArrowRight className="size-3" aria-hidden="true" />
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => pickerSheet.open()}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-dashed border-brand/50 bg-brand/[0.05] p-3 text-left transition-colors hover:bg-brand/[0.09]"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-paper">
                    <Smartphone className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">Which phone is it for?</span>
                    <span className="block text-caption text-fg-muted">Pick it to see the covers and exact prices.</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-brand transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
              )}

              {/* 2 · the add-ons */}
              <div>
                <div className="flex items-center justify-between gap-3">
                  <Step n={phone ? 2 : 1}>Add protection</Step>
                  <span className="text-caption font-semibold text-brand-coral tabular-nums">{formatInr(BUNDLE_SAVING_INR)} off each</span>
                </div>
                <ul className="mt-2 flex flex-col gap-1.5 sm:gap-2">
                  {offered.map((p) => {
                    const on = !off.has(p.role);
                    return (
                      <li key={p.role}>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={on}
                          onClick={() => toggle(p.role)}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-2xl border p-1.5 pr-2.5 text-left transition-[background-color,border-color,transform] duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.99] min-[360px]:gap-3 min-[360px]:pr-3 sm:p-2 sm:pr-3.5',
                            on ? 'border-brand/40 bg-brand/[0.05]' : 'border-border bg-paper hover:border-fg/30',
                          )}
                        >
                          <span className={cn('size-9 shrink-0 overflow-hidden rounded-[0.6rem] bg-surface-2 transition-[opacity,filter] duration-200 sm:size-11 sm:rounded-xl', !on && 'opacity-60 grayscale')}>
                            {/* eslint-disable-next-line @next/next/no-img-element -- the add-on's own shop photo, pre-sized */}
                            <img src={accessoryPhotoSrc(p.accessory.entry.id, 0, 160)} alt="" loading="lazy" className="size-full object-cover" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm leading-tight font-bold">{ROLE_NAME[p.role]}</span>
                            <span className="block truncate text-caption text-fg-muted">{phone ? p.accessory.title : ROLE_HINT[p.role]}</span>
                          </span>
                          <span className={cn('shrink-0 text-right leading-tight tabular-nums transition-opacity duration-200', !on && 'opacity-60')}>
                            <span className="block text-sm font-bold">{formatInr(bundlePrice(p.priceInr))}</span>
                            <s className="block text-[0.6875rem] text-fg-muted">{formatInr(p.priceInr)}</s>
                          </span>
                          <span aria-hidden="true" className={cn('relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200', on ? 'bg-brand' : 'bg-surface-3')}>
                            <span className={cn('absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out-expo', on && 'translate-x-4')} />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* The total and the one button */}
              <div className="mt-auto border-t border-border pt-3 sm:pt-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="flex flex-col leading-none tabular-nums sm:flex-row sm:items-baseline sm:gap-2">
                    <span className="text-[1.625rem] font-extrabold tracking-tight sm:text-3xl">
                      {!coverVariant && <span className="mr-1 text-sm font-semibold tracking-normal text-fg-muted">from</span>}
                      <AnimatedInr value={price} />
                    </span>
                    {saving > 0 && <s className="mt-1 text-caption text-fg-muted sm:mt-0 sm:text-sm">{formatInr(price + saving)}</s>}
                  </p>
                  {!phone ? (
                    <button
                      type="button"
                      onClick={() => pickerSheet.open()}
                      className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-fg px-3 text-[0.9375rem] font-semibold whitespace-nowrap text-paper transition-colors hover:bg-[#2b2b2b] min-[360px]:px-5 min-[360px]:text-base sm:max-w-xs"
                    >
                      <Smartphone className="hidden size-4 shrink-0 sm:block" aria-hidden="true" />
                      Pick your phone
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!enabled || !available || busy}
                      title={enabled ? undefined : 'The cart needs the shop backend'}
                      onClick={async () => {
                        setBusy(true);
                        await addMany(variantIds, { openDrawer: true });
                        setBusy(false);
                      }}
                      className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-fg px-3 text-[0.9375rem] font-semibold whitespace-nowrap text-paper transition-[background-color,transform] hover:bg-[#2b2b2b] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-fg/40 min-[360px]:px-5 min-[360px]:text-base sm:max-w-xs"
                    >
                      {busy ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" /> : <ShoppingBag className="hidden size-4 shrink-0 sm:block" aria-hidden="true" />}
                      {!available ? 'Out of stock' : pieces === 1 ? 'Add cover' : `Add combo · ${pieces} items`}
                    </button>
                  )}
                </div>
                <p className="mt-2 text-[0.75rem] text-fg-muted min-[360px]:text-caption sm:mt-2.5">
                  {saving > 0 && <span className="font-semibold text-success">You save {formatInr(saving)} · </span>}
                  {price >= FREE_SHIPPING_THRESHOLD_INR && 'Free shipping · '}
                  Cash on Delivery
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
