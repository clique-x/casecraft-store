import Link from 'next/link';
import { ArrowRightIcon, HeadphonesIcon, ShieldCheckIcon, SmartphoneIcon, type LucideIcon } from 'lucide-react';
import { HeroFlythrough, type HeroItem } from './HeroFlythrough.client';

const DEPARTMENTS: readonly { href: string; label: string; hint: string; Icon: LucideIcon }[] = [
  { href: '/categories', label: 'Covers', hint: 'Cut for your phone', Icon: SmartphoneIcon },
  { href: '/audio#earbuds', label: 'Earbuds', hint: 'boAt · realme', Icon: HeadphonesIcon },
  { href: '/audio#neckband', label: 'Neckbands', hint: 'All-day battery', Icon: HeadphonesIcon },
  { href: '/accessories', label: 'Protection', hint: 'Glass & more', Icon: ShieldCheckIcon },
];

/** Opening screen: a room of floating products you scroll through, from one line to the departments. */
export function HubHero({ items }: { items: HeroItem[] }) {
  return (
    <section id="hero" aria-labelledby="hub-hero-heading" className="relative isolate">
      <HeroFlythrough
        items={items}
        headline={
          <h1
            id="hub-hero-heading"
            className="font-display text-[clamp(2.8rem,1rem+7vw,7rem)] leading-[0.95] font-extrabold tracking-[-0.05em] text-balance drop-shadow-[0_20px_60px_rgba(0,0,0,.7)]"
          >
            Everything your phone <span className="text-[#7fd3dc]">needs.</span>
          </h1>
        }
        end={
          <div className="flex flex-col items-center gap-7 px-3">
            <p className="text-caption font-bold tracking-[0.22em] text-[#7fd3dc] uppercase">Where to?</p>
            <nav aria-label="Shop by department" className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {DEPARTMENTS.map(({ href, label, hint, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group/dep relative flex flex-col gap-5 overflow-hidden rounded-3xl bg-white/[0.07] p-5 ring-1 ring-white/15 backdrop-blur-md transition-[transform,background-color,box-shadow] duration-300 ease-out-expo hover:-translate-y-1 hover:bg-white/[0.13] hover:shadow-[0_30px_60px_-30px_rgba(46,196,214,.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fd3dc] sm:p-6"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -top-10 -right-10 size-28 rounded-full bg-[#2ec4d6]/25 blur-2xl transition-opacity duration-300 group-hover/dep:opacity-100 sm:opacity-60"
                  />
                  <span className="grid size-12 place-items-center rounded-2xl bg-paper text-fg shadow-lg transition-transform duration-300 ease-out-expo group-hover/dep:-translate-y-0.5 group-hover/dep:scale-105">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-base font-bold text-paper sm:text-lg">{label}</span>
                    <span className="text-caption text-paper/60">{hint}</span>
                  </span>
                  <ArrowRightIcon
                    className="absolute right-5 bottom-5 size-4 text-paper/50 transition-[transform,color] duration-300 group-hover/dep:translate-x-1 group-hover/dep:text-[#7fd3dc]"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </nav>
            <Link
              href="#categories"
              className="inline-flex h-13 items-center gap-2 rounded-pill bg-paper px-7 text-sm font-bold text-fg shadow-[0_20px_50px_-20px_rgba(255,255,255,.5)] transition-colors hover:bg-brand hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fd3dc]"
            >
              Shop everything <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </div>
        }
      />
    </section>
  );
}
