import Link from 'next/link';
import { ArrowRightIcon, BadgeCheckIcon, BanknoteIcon, TruckIcon } from 'lucide-react';
import { AccessoryArt } from '@/components/accessory/AccessoryArt';
import { OpenPickerButton } from '@/components/home/hero/OpenPickerButton';
import type { AccessoryEntry } from '@/lib/catalog/accessories';
import { cn } from '@/lib/utils';
import { GlassTilt } from './GlassTilt.client';
import { SHELL } from './hub-styles';

export interface HeroItem {
  href: string;
  /** A transparent cutout, so the product floats on the glass. */
  src: string;
  srcSet?: string;
  w: number;
  h: number;
  title: string;
  price: string;
}

export interface HubHeroProps {
  /** The big card: earbuds. */
  featured: HeroItem;
  cover: HeroItem;
  neckband: HeroItem;
  guard: AccessoryEntry;
}

const GLASS =
  'relative overflow-hidden rounded-[1.75rem] bg-white/[0.06] ring-1 ring-white/[0.14] shadow-[0_30px_80px_-40px_rgba(0,0,0,.8)] backdrop-blur-xl ' +
  'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(135deg,rgba(255,255,255,.14),rgba(255,255,255,0)_45%)] ' +
  'after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:opacity-0 after:transition-opacity after:duration-500 after:bg-[radial-gradient(60%_60%_at_var(--gx,50%)_var(--gy,50%),rgba(255,255,255,.16),transparent)] group-hover/glass:after:opacity-100';

const CHIP = 'inline-flex items-center gap-2 rounded-pill bg-white/[0.07] px-3.5 py-2 text-sm font-semibold text-paper/85 ring-1 ring-white/[0.12] backdrop-blur-md';

const CSS = `
@keyframes hero-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes hero-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes hero-orb{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(6%,-8%) scale(1.12)}}
@keyframes hero-orb-2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-8%,6%) scale(1.08)}}
.hero-rise{animation:hero-rise .9s var(--ease-out-expo) both;animation-delay:var(--d,0s)}
.hero-float{animation:hero-float 6s ease-in-out infinite;animation-delay:var(--d,0s)}
.hero-orb{animation:hero-orb 16s ease-in-out infinite}
.hero-orb-2{animation:hero-orb-2 20s ease-in-out infinite}
.glass-tilt{transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .4s var(--ease-out-expo);transform-style:preserve-3d}
@media (prefers-reduced-motion:reduce){.hero-rise,.hero-float,.hero-orb,.hero-orb-2{animation:none}.glass-tilt{transform:none}}
`;

function Cutout({ item, sizes, className }: { item: HeroItem; sizes: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants
    <img
      src={item.src}
      srcSet={item.srcSet}
      sizes={sizes}
      alt=""
      width={item.w}
      height={item.h}
      draggable={false}
      className={cn('block h-auto w-full object-contain drop-shadow-[0_28px_36px_rgba(0,0,0,.55)]', className)}
    />
  );
}

/** Opening screen: one line, two buttons, and a glass bento of the departments with real products on it. */
export function HubHero({ featured, cover, neckband, guard }: HubHeroProps) {
  return (
    <section
      id="hero"
      aria-labelledby="hub-hero-heading"
      className="relative isolate flex min-h-svh flex-col justify-center overflow-hidden bg-[#06161b] pt-28 pb-12 text-paper lg:pt-24"
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {/* Backdrop: a deep teal room with two soft lights drifting, and a faint grid. */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[radial-gradient(80%_60%_at_50%_0%,#0f3a43_0%,#082229_45%,#06161b_100%)]" />
      <div aria-hidden="true" className="hero-orb absolute -top-[10%] -left-[10%] -z-10 size-[60vmin] rounded-full bg-[#2ec4d6]/25 blur-[120px]" />
      <div aria-hidden="true" className="hero-orb-2 absolute -right-[12%] -bottom-[20%] -z-10 size-[70vmin] rounded-full bg-brand-coral/20 blur-[140px]" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.35] [mask-image:radial-gradient(70%_60%_at_50%_40%,#000,transparent)] bg-[linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] bg-[size:48px_48px]"
      />

      <div className={cn(SHELL, 'grid items-center gap-10 lg:grid-cols-12 lg:gap-8')}>
        {/* Copy */}
        <div className="flex flex-col items-center gap-6 text-center lg:col-span-5 lg:items-start lg:text-left">
          <span className={cn(CHIP, 'hero-rise text-caption tracking-[0.18em] uppercase')} style={{ ['--d' as string]: '0s' }}>
            <span className="size-1.5 rounded-full bg-[#7fd3dc] shadow-[0_0_12px_#7fd3dc]" aria-hidden="true" />
            Covers · Audio · Protection
          </span>
          <h1
            id="hub-hero-heading"
            className="hero-rise font-display text-[clamp(2.6rem,1.4rem+4.6vw,5.2rem)] leading-[0.98] font-extrabold tracking-[-0.045em] text-balance"
            style={{ ['--d' as string]: '.08s' }}
          >
            Everything your phone <span className="bg-[linear-gradient(90deg,#7fd3dc,#c9f3f8)] bg-clip-text text-transparent">needs.</span>
          </h1>
          <p className="hero-rise max-w-md text-base text-paper/70 sm:text-lg" style={{ ['--d' as string]: '.16s' }}>
            Covers cut for your exact phone. Sealed boAt and realme audio with the brand warranty. Glass that fits.
          </p>
          <div className="hero-rise flex flex-wrap items-center justify-center gap-3 lg:justify-start" style={{ ['--d' as string]: '.24s' }}>
            <Link
              href="#categories"
              className="inline-flex h-12 items-center gap-2 rounded-pill bg-paper px-6 text-base font-bold text-fg shadow-[0_20px_50px_-20px_rgba(255,255,255,.45)] transition-[background-color,transform] duration-300 ease-out-expo hover:-translate-y-0.5 hover:bg-[#dff6f9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fd3dc]"
            >
              Shop now <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
            <OpenPickerButton className="inline-flex h-12 items-center gap-2 rounded-pill bg-white/[0.08] px-6 text-base font-semibold text-paper ring-1 ring-white/[0.18] backdrop-blur-md transition-colors duration-300 hover:bg-white/[0.14]">
              Pick my phone
            </OpenPickerButton>
          </div>
          <ul className="hero-rise flex flex-wrap items-center justify-center gap-2 lg:justify-start" style={{ ['--d' as string]: '.32s' }}>
            <li className={CHIP}>
              <BanknoteIcon className="size-4 text-[#7fd3dc]" aria-hidden="true" /> Cash on Delivery
            </li>
            <li className={CHIP}>
              <TruckIcon className="size-4 text-[#7fd3dc]" aria-hidden="true" /> Free shipping
            </li>
            <li className={CHIP}>
              <BadgeCheckIcon className="size-4 text-[#7fd3dc]" aria-hidden="true" /> Brand warranty
            </li>
          </ul>
        </div>

        {/* Glass bento */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-7 lg:grid-cols-4 lg:grid-rows-2">
          <GlassTilt className="hero-rise col-span-2 lg:row-span-2" delay="0.2s">
            <Link href={featured.href} className={cn(GLASS, 'flex h-full min-h-[18rem] flex-col justify-between p-5 sm:min-h-[22rem] sm:p-6 lg:min-h-[26rem]')}>
              <div className="relative z-10 flex items-start justify-between gap-3">
                <span className="text-caption font-bold tracking-[0.18em] text-[#7fd3dc] uppercase">Earbuds</span>
                <span className="rounded-pill bg-paper px-2.5 py-1 text-xs font-bold text-fg tabular-nums">{featured.price}</span>
              </div>
              <div className="hero-float pointer-events-none absolute inset-x-[12%] top-[14%] bottom-[22%] sm:inset-x-[16%]">
                <div aria-hidden="true" className="absolute inset-[18%] rounded-full bg-[#2ec4d6]/30 blur-3xl" />
                <Cutout item={featured} sizes="(min-width: 1024px) 420px, 80vw" className="relative h-full object-contain" />
              </div>
              <div className="relative z-10 flex items-end justify-between gap-3">
                <span className="text-lg font-bold text-balance sm:text-xl">{featured.title}</span>
                <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-paper text-fg transition-transform duration-300 ease-out-expo group-hover/glass:translate-x-1">
                  <ArrowRightIcon className="size-4" aria-hidden="true" />
                </span>
              </div>
            </Link>
          </GlassTilt>

          <GlassTilt className="hero-rise" delay="0.28s">
            <Link href={cover.href} className={cn(GLASS, 'flex h-full min-h-[11rem] flex-col justify-between p-4 sm:min-h-[12.5rem] sm:p-5')}>
              <span className="relative z-10 text-caption font-bold tracking-[0.18em] text-[#7fd3dc] uppercase">Covers</span>
              <div className="hero-float pointer-events-none absolute inset-x-[30%] top-[24%] bottom-[28%]" style={{ ['--d' as string]: '-2s' }}>
                <Cutout item={cover} sizes="160px" className="h-full object-contain" />
              </div>
              <span className="relative z-10 flex items-center justify-between text-sm font-bold">
                {cover.title.split(' · ')[0]} <span className="text-paper/60 tabular-nums">{cover.price}</span>
              </span>
            </Link>
          </GlassTilt>

          <GlassTilt className="hero-rise" delay="0.36s">
            <Link href={neckband.href} className={cn(GLASS, 'flex h-full min-h-[11rem] flex-col justify-between p-4 sm:min-h-[12.5rem] sm:p-5')}>
              <span className="relative z-10 text-caption font-bold tracking-[0.18em] text-[#7fd3dc] uppercase">Neckbands</span>
              <div className="hero-float pointer-events-none absolute inset-x-[14%] top-[24%] bottom-[28%]" style={{ ['--d' as string]: '-4s' }}>
                <Cutout item={neckband} sizes="220px" className="h-full object-contain" />
              </div>
              <span className="relative z-10 flex items-center justify-between text-sm font-bold">
                {neckband.title.replace(/^boAt |^realme /, '')} <span className="text-paper/60 tabular-nums">{neckband.price}</span>
              </span>
            </Link>
          </GlassTilt>

          <GlassTilt className="hero-rise col-span-2" delay="0.44s">
            <Link href="/accessories" className={cn(GLASS, 'flex h-full min-h-[8rem] items-center gap-4 p-4 sm:p-5')}>
              <span className="relative z-10 text-caption font-bold tracking-[0.18em] text-[#7fd3dc] uppercase">Protection</span>
              <div className="hero-float relative h-20 w-16 shrink-0" style={{ ['--d' as string]: '-1s' }}>
                <AccessoryArt accessory={guard} title={guard.title} className="drop-shadow-[0_18px_24px_rgba(0,0,0,.5)]" />
              </div>
              <span className="relative z-10 ml-auto flex items-center gap-2 text-sm font-bold">
                Glass &amp; lens guards <ArrowRightIcon className="size-4 text-paper/60" aria-hidden="true" />
              </span>
            </Link>
          </GlassTilt>
        </div>
      </div>
    </section>
  );
}
