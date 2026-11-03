import Link from 'next/link';
import { HeadphonesIcon, ShieldCheckIcon, SmartphoneIcon, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HeroRing, type RingItem } from './HeroRing.client';
import { SHELL } from './hub-styles';

const SHORTCUTS: readonly { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/categories', label: 'Covers', Icon: SmartphoneIcon },
  { href: '/audio#earbuds', label: 'Earbuds', Icon: HeadphonesIcon },
  { href: '/audio#neckband', label: 'Neckbands', Icon: HeadphonesIcon },
  { href: '/accessories', label: 'Protection', Icon: ShieldCheckIcon },
];

/** Opening band: a short line, a turning 3D ring of real products, and one-tap shortcuts. */
export function HubHero({ items }: { items: RingItem[] }) {
  return (
    <section
      id="hero"
      aria-labelledby="hub-hero-heading"
      className="relative isolate overflow-hidden bg-[#071518] pt-24 pb-12 text-paper lg:pt-28 lg:pb-16"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_70%_45%,#0f3b44_0%,#0a2329_45%,#071518_80%)]"
      />
      <div aria-hidden="true" className="absolute -top-24 -left-24 -z-10 size-80 rounded-full bg-brand-coral/15 blur-3xl" />
      <div className={cn(SHELL, 'grid items-center gap-8 lg:grid-cols-12 lg:gap-6')}>
        <div className="flex flex-col items-center gap-6 text-center lg:col-span-5 lg:items-start lg:text-left">
          <h1
            id="hub-hero-heading"
            className="font-display text-[clamp(2.4rem,1.5rem+4vw,4.5rem)] leading-[0.98] font-extrabold tracking-[-0.045em] text-balance"
          >
            Everything your phone <span className="text-[#7fd3dc]">needs.</span>
          </h1>
          <nav aria-label="Shop by department" className="grid w-full max-w-md grid-cols-4 gap-2 sm:gap-3">
            {SHORTCUTS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group/sc flex flex-col items-center gap-2 rounded-2xl bg-white/[0.06] px-1 py-3 ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fd3dc]"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-paper text-fg transition-transform duration-300 ease-out-expo group-hover/sc:-translate-y-0.5">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-caption font-semibold text-paper/85">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="min-w-0 lg:col-span-7">
          <HeroRing items={items} />
        </div>
      </div>
    </section>
  );
}
