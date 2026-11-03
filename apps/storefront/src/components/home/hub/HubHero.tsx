import Link from 'next/link';
import { ArrowRightIcon, HeadphonesIcon, SmartphoneIcon, type LucideIcon } from 'lucide-react';
import { AccessoryArt } from '@/components/accessory/AccessoryArt';
import { CaseCutout } from '@/components/home/hero/CaseCutout';
import { OpenPickerButton } from '@/components/home/hero/OpenPickerButton';
import { gadgetGallerySrc, gadgetGallerySrcSet, type GadgetEntry } from '@/lib/catalog/gadgets';
import type { AccessoryEntry } from '@/lib/catalog/accessories';
import { formatInr, type PhotoEntry } from '@/lib/catalog/photos';
import { cn } from '@/lib/utils';
import { EYEBROW, GHOST_BTN, PRIMARY_BTN, SHELL } from './hub-styles';

export interface HubStat {
  value: number;
  label: string;
  icon: 'covers' | 'audio' | 'phones';
}

const STAT_ICON: Record<HubStat['icon'], LucideIcon> = { covers: SmartphoneIcon, audio: HeadphonesIcon, phones: SmartphoneIcon };

interface Props {
  cover: PhotoEntry;
  coverFromInr: number;
  earbuds: GadgetEntry;
  neckband: GadgetEntry;
  accessory: AccessoryEntry;
  stats: HubStat[];
}

const HUB_CSS = `
.hub-float{animation:hub-float var(--float-dur,9s) var(--ease-in-out-quart) infinite alternate}
@keyframes hub-float{from{transform:translateY(0)}to{transform:translateY(-10px)}}
.hub-tile{transition:transform var(--dur-ui) var(--ease-out-expo),box-shadow var(--dur-ui) var(--ease-out-expo)}
.hub-tile:hover{transform:translateY(-4px);box-shadow:0 24px 48px -24px color-mix(in srgb,var(--color-shadow) 35%,transparent)}
@media (prefers-reduced-motion:reduce){.hub-float{animation:none}.hub-tile,.hub-tile:hover{transition:none;transform:none}}
`;

const TILE =
  'hub-tile group/tile relative flex overflow-hidden rounded-[22px] bg-paper shadow-[0_18px_40px_-28px_color-mix(in_srgb,var(--color-shadow)_40%,transparent)] ring-1 ring-fg/8 outline-none focus-visible:ring-2 focus-visible:ring-accent-2';
const TAG =
  'absolute left-3 bottom-3 inline-flex flex-col rounded-2xl bg-paper/90 px-3 py-2 text-left shadow-sm ring-1 ring-fg/5 backdrop-blur sm:left-4 sm:bottom-4';

/** Opening band: the hub promise on the left, a studio collage of the three departments on the right. */
export function HubHero({ cover, coverFromInr, earbuds, neckband, accessory, stats }: Props) {
  const ePhotos = earbuds.photos!;
  const nPhotos = neckband.photos!;
  return (
    <section id="hero" aria-labelledby="hub-hero-heading" className="relative overflow-hidden bg-ink pt-24 pb-12 text-fg lg:pt-32 lg:pb-20">
      <style href="hub-hero" precedence="default">
        {HUB_CSS}
      </style>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand)_16%,transparent),transparent)]"
      />
      <div className={cn(SHELL, 'relative grid items-center gap-10 lg:grid-cols-12 lg:gap-12')}>
        <div className="flex min-w-0 flex-col items-start gap-5 lg:col-span-6">
          <p className={cn(EYEBROW, 'inline-flex items-center gap-2 rounded-pill bg-paper px-3 py-1.5 tracking-[0.12em] ring-1 ring-fg/8 sm:tracking-[0.2em]')}>
            <span className="size-1.5 rounded-full bg-brand-coral" aria-hidden="true" />
            Covers · Audio · Protection
          </p>
          <h1 id="hub-hero-heading" className="font-display text-[clamp(2.25rem,1.4rem+3.6vw,4.25rem)] leading-[1.02] font-extrabold tracking-[-0.04em] text-balance">
            Everything your phone needs, <span className="text-brand">in one hub.</span>
          </h1>
          <p className="max-w-md text-body leading-relaxed text-fg-muted sm:text-lg">
            Covers for your exact phone, sealed boAt and realme audio, and screen protection.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="#categories" className={PRIMARY_BTN}>
              Shop all categories
              <ArrowRightIcon aria-hidden="true" />
            </Link>
            <OpenPickerButton className={GHOST_BTN}>Find covers for my phone</OpenPickerButton>
          </div>
          <dl className="mt-2 grid w-full max-w-md grid-cols-3 gap-3 border-t border-fg/10 pt-5">
            {stats.map((s) => {
              const Icon = STAT_ICON[s.icon];
              return (
                <div key={s.label} className="flex flex-col gap-1.5">
                  <dt className="order-2 inline-flex items-center gap-1.5 text-caption leading-snug text-fg-muted">
                    <Icon className="size-3.5 text-brand" aria-hidden="true" />
                    {s.label}
                  </dt>
                  <dd className="order-1 font-display text-2xl leading-none font-extrabold tabular-nums sm:text-3xl">{s.value}</dd>
                </div>
              );
            })}
          </dl>
        </div>

        <div className="min-w-0 lg:col-span-6">
          <div className="mx-auto grid aspect-[5/4] w-full max-w-[600px] grid-cols-5 grid-rows-2 gap-3 sm:gap-4">
            <Link href="/categories" aria-label={`Phone covers from ${formatInr(coverFromInr)}`} className={cn(TILE, 'col-span-3 row-span-2 bg-surface-3/60')}>
              <div className="hub-float absolute inset-x-[16%] top-[7%] bottom-[18%]" style={{ ['--float-dur' as string]: '10s' }}>
                <CaseCutout entry={cover} role="tile" sizes="(min-width: 1024px) 300px, 50vw" priority />
              </div>
              <span className={TAG}>
                <span className="text-sm font-bold">Phone covers</span>
                <span className="text-caption text-fg-muted">from {formatInr(coverFromInr)}</span>
              </span>
            </Link>
            <Link href="/audio#earbuds" aria-label={`${earbuds.title}, wireless earbuds`} className={cn(TILE, 'col-span-2 bg-surface-2')}>
              {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants */}
              <img
                src={gadgetGallerySrc(ePhotos, 0, 480)}
                srcSet={gadgetGallerySrcSet(ePhotos, 0)}
                sizes="(min-width: 1024px) 240px, 40vw"
                alt=""
                width={480}
                height={480}
                fetchPriority="high"
                className="hub-float absolute inset-0 size-full object-contain p-2"
                style={{ ['--float-dur' as string]: '8s' }}
              />
              <span className={TAG}>
                <span className="text-sm font-bold">Earbuds</span>
                <span className="text-caption text-fg-muted">boAt · realme</span>
              </span>
            </Link>
            <div className="col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
              <Link href="/audio#neckband" aria-label={`${neckband.title}, neckband`} className={cn(TILE, 'bg-surface-2')}>
                {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants */}
                <img
                  src={gadgetGallerySrc(nPhotos, 0, 480)}
                  srcSet={gadgetGallerySrcSet(nPhotos, 0)}
                  sizes="(min-width: 1024px) 120px, 20vw"
                  alt=""
                  width={480}
                  height={480}
                  className="absolute inset-0 size-full object-contain p-1.5"
                />
              </Link>
              <Link href="/accessories" aria-label="Screen guards and protection" className={cn(TILE, 'bg-surface-2')}>
                <AccessoryArt accessory={accessory} className="absolute inset-0 size-full" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
