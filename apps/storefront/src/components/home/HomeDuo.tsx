import Link from 'next/link';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal.client';
import { gadgetGallerySrc, gadgetGallerySrcSet, gadgetHeroIndex, type GadgetEntry } from '@/lib/catalog/gadgets';
import { formatInr } from '@/lib/catalog/photos';

export interface DuoFeature {
  eyebrow: string;
  heading: string;
  sub: string;
  points: readonly string[];
  fromInr: number;
  /** Where the main button goes, and its label. */
  href: string;
  cta: string;
  /** The product whose first photo leads the card, its page, and the short label of the button to it. */
  gadget: GadgetEntry;
  productHref: string;
  productLabel: string;
}

const SIZES = '(min-width: 64rem) 300px, (min-width: 40rem) 40vw, 80vw';

/** Two departments side by side on dark teal: today, Wi-Fi cameras and Bluetooth speakers. */
export function HomeDuo({ features }: { features: DuoFeature[] }) {
  if (features.length === 0) return null;
  return (
    <section aria-label="Cameras and speakers" className="cv-auto bg-gh-ivory py-10 text-gh-ink lg:py-20">
      {/* Phones: the two cards side by side, one to swipe to. From sm they stack, from lg they share the row. */}
      <div className="mx-auto flex w-full max-w-[90rem] snap-x gap-4 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:grid sm:gap-5 sm:overflow-visible sm:px-6 sm:pb-0 lg:grid-cols-2 lg:gap-6 lg:px-10 xl:px-14 [&::-webkit-scrollbar]:hidden">
        {features.map((f, i) => {
          const photos = f.gadget.photos;
          const hero = photos ? gadgetHeroIndex(photos, f.gadget.options[0]?.slug) : 0;
          return (
            <Reveal key={f.href} delay={i * 80} className="w-[86%] shrink-0 snap-start sm:w-auto">
              <article className="grid h-full overflow-hidden rounded-[1.5rem] bg-[radial-gradient(120%_120%_at_85%_15%,#11565a_0%,#06363b_45%,#021d20_100%)] text-white shadow-[0_24px_60px_-36px_rgba(0,22,25,.8)] sm:grid-cols-[1fr_minmax(0,0.9fr)]">
                <div className="flex flex-col gap-3 p-5 sm:gap-4 sm:p-8">
                  <p className="text-label font-bold tracking-[0.16em] text-[#7fe6f2] uppercase">{f.eyebrow}</p>
                  <h2 className="font-display text-[1.75rem] leading-[1.1] font-extrabold tracking-[-0.03em] text-balance lg:text-[2rem]">
                    {f.heading}
                  </h2>
                  <p className="text-body text-white/75">{f.sub}</p>
                  <ul className="flex flex-col gap-2">
                    {f.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-white/90">
                        <CheckIcon className="mt-0.5 size-4 shrink-0 text-[#40F7AC]" aria-hidden="true" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-auto pt-2 text-sm text-white/70">
                    from <span className="text-xl font-bold text-white tabular-nums">{formatInr(f.fromInr)}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={f.href}
                      className="inline-flex h-11 items-center gap-1.5 rounded-pill bg-white px-5 text-sm font-bold text-gh-ink transition-colors hover:bg-[#40F7AC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {f.cta} <ArrowRightIcon className="size-4" aria-hidden="true" />
                    </Link>
                    <Link
                      href={f.productHref}
                      className="inline-flex h-11 items-center rounded-pill border border-white/40 px-5 text-sm font-semibold text-white transition-colors hover:border-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {f.productLabel}
                    </Link>
                  </div>
                </div>
                {photos && (
                  <Link href={f.productHref} tabIndex={-1} aria-hidden="true" className="group/duo relative order-first block aspect-[3/2] sm:order-none sm:aspect-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static variants, no optimizer */}
                    <img
                      src={gadgetGallerySrc(photos, hero, 960)}
                      srcSet={gadgetGallerySrcSet(photos, hero)}
                      sizes={SIZES}
                      width={960}
                      height={960}
                      alt={f.gadget.title}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 size-full object-cover object-top transition-transform duration-700 sm:object-center ease-out-expo group-hover/duo:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover/duo:transform-none"
                    />
                  </Link>
                )}
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
