import Link from 'next/link';
import { ArrowRightIcon, HeadphonesIcon, ShieldCheckIcon, SmartphoneIcon, type LucideIcon } from 'lucide-react';
import { HeroFlythrough, type HeroItem } from './HeroFlythrough.client';

const SHORTCUTS: readonly { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/categories', label: 'Covers', Icon: SmartphoneIcon },
  { href: '/audio#earbuds', label: 'Earbuds', Icon: HeadphonesIcon },
  { href: '/audio#neckband', label: 'Neckbands', Icon: HeadphonesIcon },
  { href: '/accessories', label: 'Protection', Icon: ShieldCheckIcon },
];

/** Opening screen: a room of floating products you scroll through, from one line to the shortcuts. */
export function HubHero({ items }: { items: HeroItem[] }) {
  return (
    <section id="hero" aria-labelledby="hub-hero-heading" className="relative isolate">
      <HeroFlythrough
        items={items}
        headline={
          <h1
            id="hub-hero-heading"
            className="font-display text-[clamp(2.6rem,1rem+7vw,7rem)] leading-[0.95] font-extrabold tracking-[-0.05em] text-balance drop-shadow-[0_20px_60px_rgba(0,0,0,.6)]"
          >
            Everything your phone <span className="text-[#7fd3dc]">needs.</span>
          </h1>
        }
        end={
          <div className="flex flex-col items-center gap-6">
            <nav aria-label="Shop by department" className="grid w-full max-w-md grid-cols-4 gap-2 sm:gap-3">
              {SHORTCUTS.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group/sc flex flex-col items-center gap-2 rounded-2xl bg-white/[0.07] px-1 py-3 ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-white/[0.14] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fd3dc]"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-paper text-fg transition-transform duration-300 ease-out-expo group-hover/sc:-translate-y-0.5">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-caption font-semibold text-paper/85">{label}</span>
                </Link>
              ))}
            </nav>
            <Link
              href="#categories"
              className="inline-flex h-12 items-center gap-2 rounded-pill bg-paper px-6 text-sm font-bold text-fg shadow-xl transition-colors hover:bg-brand hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fd3dc]"
            >
              Shop now <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </div>
        }
      />
    </section>
  );
}
