import Link from 'next/link';
import { ArrowUpRightIcon, HeadphonesIcon, ShieldCheckIcon, SmartphoneIcon, type LucideIcon } from 'lucide-react';
import { PhoneBrandLogo } from '@/components/brand/PhoneBrandLogo';
import { AccessoryArt } from '@/components/accessory/AccessoryArt';
import { AccentBar } from '@/components/brand/AccentBar';
import { Reveal } from '@/components/motion/Reveal.client';
import { gadgetGallerySrc, gadgetGallerySrcSet, type GadgetEntry } from '@/lib/catalog/gadgets';
import type { AccessoryEntry } from '@/lib/catalog/accessories';
import { shotSrc, shotSrcSet, type PhotoEntry } from '@/lib/catalog/photos';
import { cn } from '@/lib/utils';
import { EYEBROW, SHELL } from './hub-styles';

export interface CategoryCounts {
  covers: number;
  coverPhones: number;
  earbuds: number;
  neckbands: number;
  protection: number;
  phoneModels: number;
  looks: { name: string; href: string }[];
  phoneBrands: string[];
}

interface Props {
  counts: CategoryCounts;
  coverShots: PhotoEntry[];
  earbuds: GadgetEntry;
  neckband: GadgetEntry;
  accessory: AccessoryEntry;
}

const TILE =
  'group/cat relative flex flex-col overflow-hidden rounded-[22px] outline-none ring-1 ring-fg/8 transition-[transform,box-shadow] duration-(--dur-ui) ease-out-expo hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_color-mix(in_srgb,var(--color-shadow)_45%,transparent)] focus-visible:ring-2 focus-visible:ring-accent-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0';
const ARROW =
  'hidden size-9 shrink-0 sm:grid place-items-center rounded-pill bg-paper text-fg shadow-sm transition-transform duration-(--dur-ui) ease-out-expo group-hover/cat:rotate-45';

function TileText({ title, meta, Icon, dark = false }: { title: string; meta: string; Icon: LucideIcon; dark?: boolean }) {
  return (
    <div className="relative z-10 mt-auto flex items-end justify-between gap-2 p-2.5 sm:p-4">
      <span className={cn('flex min-w-0 items-center gap-2 rounded-2xl py-1.5 pr-2.5 pl-1.5 sm:gap-2.5 sm:py-2 sm:pr-3 sm:pl-2', dark ? 'bg-white/10 ring-1 ring-white/15 backdrop-blur' : 'bg-paper/90 shadow-sm ring-1 ring-fg/5 backdrop-blur')}>
        <span className={cn('grid size-7 shrink-0 place-items-center rounded-lg sm:size-8 sm:rounded-xl', dark ? 'bg-paper text-fg' : 'bg-fg text-paper')}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className={cn('block text-[0.8125rem] leading-tight font-bold sm:text-sm', dark ? 'text-paper' : 'text-fg')}>{title}</span>
          <span className={cn('block truncate text-caption', dark ? 'text-paper/70' : 'text-fg-muted')}>{meta}</span>
        </span>
      </span>
      <span className={ARROW} aria-hidden="true">
        <ArrowUpRightIcon className="size-4" />
      </span>
    </div>
  );
}

/** Every department at a glance: covers large, then audio, protection and shop-by-phone. */
export function CategoryBento({ counts, coverShots, earbuds, neckband, accessory }: Props) {
  const shots = coverShots.slice(0, 3);
  return (
    <section id="categories" aria-labelledby="categories-heading" className="scroll-mt-20 bg-paper py-14 text-fg lg:py-20">
      <div className={SHELL}>
        <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={EYEBROW}>Shop by category</p>
            <h2 id="categories-heading" className="mt-2 font-display text-h2 font-extrabold text-balance">
              Pick a department
            </h2>
            <AccentBar className="mt-4" />
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-[minmax(0,15rem)_minmax(0,15rem)]">
          {/* Covers: the big tile */}
          <Link href="/categories" className={cn(TILE, 'col-span-2 min-h-[22rem] bg-[#0b2b33] lg:row-span-2 lg:min-h-0')}>
            <div aria-hidden="true" className="absolute inset-0 flex items-end justify-center gap-3 px-4 pt-16 pb-28 sm:gap-4 sm:pb-24">
              {shots.map((s, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants
                <img
                  key={s.id}
                  src={shotSrc(s.id, 0)}
                  srcSet={shotSrcSet(s.id, 0)}
                  sizes="(min-width: 1024px) 200px, 30vw"
                  alt=""
                  width={480}
                  height={600}
                  loading="lazy"
                  className={cn(
                    'aspect-[4/5] w-[30%] max-w-[13rem] rounded-2xl object-cover shadow-2xl ring-1 ring-white/10 transition-transform duration-500 ease-out-expo motion-reduce:transition-none',
                    i === 1 ? '-translate-y-4 group-hover/cat:-translate-y-6' : 'group-hover/cat:-translate-y-1',
                  )}
                />
              ))}
            </div>
            <div className="relative z-10 flex flex-wrap gap-2 p-4 sm:p-5">
              {counts.looks.map((l) => (
                <span key={l.href} className="rounded-pill bg-white/10 px-3 py-1 text-caption font-semibold text-paper/90 ring-1 ring-white/15">
                  {l.name}
                </span>
              ))}
            </div>
            <div className="relative z-10 mt-auto bg-gradient-to-t from-[#0b2b33] via-[#0b2b33]/80 to-transparent pt-10">
              <TileText Icon={SmartphoneIcon} title="Phone covers" meta={`${counts.covers} covers · ${counts.coverPhones} phones`} dark />
            </div>
          </Link>

          <Link href="/audio#earbuds" className={cn(TILE, 'min-h-[16rem] bg-surface-2 lg:min-h-0')}>
            <div className="absolute inset-0">
              {earbuds.photos && (
                // eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants
                <img
                  src={gadgetGallerySrc(earbuds.photos, 0, 480)}
                  srcSet={gadgetGallerySrcSet(earbuds.photos, 0)}
                  sizes="(min-width: 1024px) 260px, 46vw"
                  alt=""
                  width={480}
                  height={480}
                  loading="lazy"
                  className="absolute inset-0 size-full object-contain p-1 transition-transform duration-500 ease-out-expo group-hover/cat:scale-[1.06] motion-reduce:transition-none"
                />
              )}
            </div>
            <TileText Icon={HeadphonesIcon} title="Wireless earbuds" meta={`${counts.earbuds} models`} />
          </Link>

          <Link href="/audio#neckband" className={cn(TILE, 'min-h-[16rem] bg-surface-2 lg:min-h-0')}>
            <div className="absolute inset-0">
              {neckband.photos && (
                // eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants
                <img
                  src={gadgetGallerySrc(neckband.photos, 0, 480)}
                  srcSet={gadgetGallerySrcSet(neckband.photos, 0)}
                  sizes="(min-width: 1024px) 260px, 46vw"
                  alt=""
                  width={480}
                  height={480}
                  loading="lazy"
                  className="absolute inset-0 size-full object-contain p-1 transition-transform duration-500 ease-out-expo group-hover/cat:scale-[1.06] motion-reduce:transition-none"
                />
              )}
            </div>
            <TileText Icon={HeadphonesIcon} title="Neckbands" meta={`${counts.neckbands} models`} />
          </Link>

          <Link href="/accessories" className={cn(TILE, 'min-h-[16rem] bg-surface-2 lg:min-h-0')}>
            <div className="absolute inset-0">
              <AccessoryArt accessory={accessory} className="absolute inset-0 size-full transition-transform duration-500 ease-out-expo group-hover/cat:scale-[1.06] motion-reduce:transition-none" />
            </div>
            <TileText Icon={ShieldCheckIcon} title="Protection" meta={`${counts.protection} products`} />
          </Link>

          <Link href="/phones" className={cn(TILE, 'min-h-[16rem] bg-surface-2 lg:min-h-0')}>
            <div aria-hidden="true" className="flex flex-1 flex-wrap content-center items-center justify-center gap-x-4 gap-y-3 px-3 pt-5 sm:gap-x-6">
              {counts.phoneBrands.map((b) => (
                <span key={b} className="flex items-center transition-transform duration-500 ease-out-expo [zoom:1.15] group-hover/cat:scale-110 motion-reduce:transition-none sm:[zoom:1.7]">
                  <PhoneBrandLogo brand={b} />
                </span>
              ))}
            </div>
            <TileText Icon={SmartphoneIcon} title="Shop by phone" meta={`${counts.phoneModels} models`} />
          </Link>
        </div>
      </div>
    </section>
  );
}
