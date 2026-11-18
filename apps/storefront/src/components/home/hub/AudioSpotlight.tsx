import Link from 'next/link';
import { ArrowRightIcon, BadgeCheckIcon, ShieldCheckIcon, TruckIcon } from 'lucide-react';
import { GadgetCard } from '@/components/gadget/GadgetCard';
import { Reveal } from '@/components/motion/Reveal.client';
import { gadgetCutSrc, gadgetCutSrcSet, gadgetGallerySrc, gadgetGallerySrcSet, type GadgetEntry } from '@/lib/catalog/gadgets';
import type { HomeProduct } from '@/lib/medusa/fixtures';
import { cn } from '@/lib/utils';
import { AudioFeatureStage, type FeatureItem } from './AudioFeatureStage.client';
import { SHELL, TEXT_LINK } from './hub-styles';

interface Props {
  /** The featured products, in the order they take their turn; the first shows first. */
  features: { gadget: GadgetEntry; handle: string }[];
  products: HomeProduct[];
  total: number;
  brands: string[];
}

const POINTS = [
  { Icon: BadgeCheckIcon, text: '100% original, sealed box' },
  { Icon: ShieldCheckIcon, text: '1-year brand warranty' },
  { Icon: TruckIcon, text: 'Cash on Delivery' },
];

/** A featured product's picture: its transparent cutout when it has one, else its first photo on the light backdrop. */
function featureItem({ gadget, handle }: Props['features'][number]): FeatureItem[] {
  const photos = gadget.photos;
  if (!photos) return [];
  const cut = Boolean(photos.cut);
  return [
    {
      id: gadget.id,
      handle,
      title: gadget.title,
      priceInr: gadget.priceInr,
      src: cut ? gadgetCutSrc(photos) : gadgetGallerySrc(photos, 0),
      srcSet: cut ? gadgetCutSrcSet(photos) : gadgetGallerySrcSet(photos, 0),
      cut,
    },
  ];
}

/**
 * Audio department: a dark studio feature panel whose featured product changes every few seconds, then the picks
 * as cards. On a phone the panel is sized to show whole on one screen.
 */
export function AudioSpotlight({ features, products, total, brands }: Props) {
  const items = features.flatMap(featureItem);
  return (
    <section id="audio" aria-labelledby="audio-heading" className="scroll-mt-20 bg-paper py-12 text-fg lg:py-20">
      <div className={SHELL}>
        <Reveal className="grid overflow-hidden rounded-[28px] bg-fg text-paper lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-3.5 p-5 sm:gap-5 sm:p-10 lg:p-14">
            <p className="text-label font-bold tracking-[0.2em] text-[#7fd3dc] uppercase">Audio · {brands.join(' · ')}</p>
            <h2 id="audio-heading" className="font-display text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] leading-[1.04] font-extrabold tracking-[-0.035em] text-balance">
              Sound that ships sealed.
            </h2>
            {/* Phones: three short columns, to leave the screen to the product. Larger screens: a list. */}
            <ul className="grid grid-cols-3 gap-2 sm:flex sm:flex-col sm:gap-2.5">
              {POINTS.map(({ Icon, text }) => (
                <li key={text} className="flex flex-col gap-1.5 text-[0.75rem] leading-snug text-paper/85 sm:flex-row sm:items-center sm:gap-3 sm:text-sm">
                  <span className="grid size-7 shrink-0 place-items-center rounded-pill bg-white/10 sm:size-8">
                    <Icon className="size-3.5 text-[#7fd3dc] sm:size-4" aria-hidden="true" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
            <div className="pt-0.5 sm:pt-1">
              <Link
                href="/audio"
                className="inline-flex h-11 items-center gap-2 rounded-pill bg-paper px-5 text-[0.9375rem] font-bold text-fg transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper sm:h-12 sm:px-6 sm:text-base"
              >
                Shop all audio <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
          {items.length > 0 && <AudioFeatureStage items={items} className="h-[clamp(15rem,44svh,19rem)] sm:h-[24rem] lg:h-auto lg:min-h-[30rem]" />}
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
