import Link from 'next/link';
import { ArrowRightIcon, BadgeCheckIcon, ShieldCheckIcon, TruckIcon } from 'lucide-react';
import { GadgetCard } from '@/components/gadget/GadgetCard';
import { Reveal } from '@/components/motion/Reveal.client';
import { gadgetGallerySrc, gadgetGallerySrcSet, type GadgetEntry } from '@/lib/catalog/gadgets';
import { formatInr } from '@/lib/catalog/photos';
import type { HomeProduct } from '@/lib/medusa/fixtures';
import { cn } from '@/lib/utils';
import { SHELL, TEXT_LINK } from './hub-styles';

interface Props {
  feature: GadgetEntry;
  featureHandle: string;
  products: HomeProduct[];
  total: number;
  brands: string[];
}

const POINTS = [
  { Icon: BadgeCheckIcon, text: '100% original, sealed box' },
  { Icon: ShieldCheckIcon, text: '1-year brand warranty' },
  { Icon: TruckIcon, text: 'Cash on Delivery' },
];

/** Audio department: a dark studio feature panel, then the picks as cards. */
export function AudioSpotlight({ feature, featureHandle, products, total, brands }: Props) {
  const photos = feature.photos;
  return (
    <section id="audio" aria-labelledby="audio-heading" className="scroll-mt-20 bg-paper py-14 text-fg lg:py-20">
      <div className={SHELL}>
        <Reveal className="grid overflow-hidden rounded-[28px] bg-fg text-paper lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-5 p-6 sm:p-10 lg:p-14">
            <p className="text-label font-bold tracking-[0.2em] text-[#7fd3dc] uppercase">Audio · {brands.join(' · ')}</p>
            <h2 id="audio-heading" className="font-display text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] leading-[1.04] font-extrabold tracking-[-0.035em] text-balance">
              Sound that ships sealed.
            </h2>
            <ul className="flex flex-col gap-2.5">
              {POINTS.map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-paper/85">
                  <span className="grid size-8 shrink-0 place-items-center rounded-pill bg-white/10">
                    <Icon className="size-4 text-[#7fd3dc]" aria-hidden="true" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/audio"
                className="inline-flex h-12 items-center gap-2 rounded-pill bg-paper px-6 text-base font-bold text-fg transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
              >
                Shop all audio <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
              <Link href={`/products/${featureHandle}`} className="text-sm font-semibold text-paper/80 underline-offset-4 hover:text-paper hover:underline">
                {feature.title} · {formatInr(feature.priceInr)}
              </Link>
            </div>
          </div>
          <Link href={`/products/${featureHandle}`} aria-label={feature.title} className="group/feat relative block min-h-[20rem] overflow-hidden bg-surface-2 lg:min-h-[32rem]">
            {photos && (
              // eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants
              <img
                src={gadgetGallerySrc(photos, 0)}
                srcSet={gadgetGallerySrcSet(photos, 0)}
                sizes="(min-width: 1024px) 640px, 100vw"
                alt={feature.title}
                width={960}
                height={960}
                loading="lazy"
                className="absolute inset-0 size-full object-contain p-6 transition-transform duration-700 ease-out-expo group-hover/feat:scale-[1.04] motion-reduce:transition-none sm:p-10"
              />
            )}
            <span className="absolute top-4 left-4 rounded-pill bg-fg px-3 py-1 text-caption font-bold text-paper">Featured</span>
          </Link>
        </Reveal>

        <div className="mt-8 flex items-end justify-between gap-4">
          <h3 className="font-display text-h3 font-extrabold">More audio</h3>
          <Link href="/audio" className={cn(TEXT_LINK, 'shrink-0')}>
            See all {total} <ArrowRightIcon aria-hidden="true" />
          </Link>
        </div>
        <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-4">
          {products.map((p) => (
            <li key={p.id}>
              <GadgetCard product={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
