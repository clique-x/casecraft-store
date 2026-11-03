import Link from 'next/link';
import { ChevronDownIcon, HeadphonesIcon, ShieldCheckIcon, SmartphoneIcon, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HeroStudio, type ShelfItem } from './HeroStudio.client';
import { SHELL } from './hub-styles';

const SHORTCUTS: readonly { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/categories', label: 'Covers', Icon: SmartphoneIcon },
  { href: '/audio#earbuds', label: 'Earbuds', Icon: HeadphonesIcon },
  { href: '/audio#neckband', label: 'Neckbands', Icon: HeadphonesIcon },
  { href: '/accessories', label: 'Protection', Icon: ShieldCheckIcon },
];

/** Opening screen: one line, one-tap shortcuts, and a 3D shop wall of real products on shelves. */
export function HubHero({ items }: { items: ShelfItem[] }) {
  return (
    <section
      id="hero"
      aria-labelledby="hub-hero-heading"
      className="relative isolate flex min-h-svh flex-col justify-center overflow-hidden bg-[#071518] pt-28 pb-10 text-paper lg:pt-24 lg:pb-12"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_70%_45%,#0f3b44_0%,#0a2329_45%,#071518_80%)]"
      />
      <div aria-hidden="true" className="absolute -top-24 -left-24 -z-10 size-80 rounded-full bg-brand-coral/15 blur-3xl" />
      <div className={cn(SHELL, 'grid w-full items-center gap-10 lg:grid-cols-12 lg:gap-8')}>
        <div className="relative z-10 flex flex-col items-center gap-6 text-center lg:col-span-4 lg:items-start lg:text-left">
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
          <a
            href="#categories"
            className="mt-2 hidden items-center gap-2 text-sm font-semibold text-paper/60 transition-colors hover:text-paper lg:inline-flex"
          >
            <ChevronDownIcon className="size-4 animate-bounce" aria-hidden="true" />
            Scroll to shop
          </a>
        </div>
        <div className="min-w-0 lg:col-span-8">
          <HeroStudio items={items} />
        </div>
      </div>
    </section>
  );
}
