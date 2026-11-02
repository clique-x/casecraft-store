import { AccentBar } from '@/components/brand/AccentBar';
import { ScrollRail } from '@/components/listing/ScrollRail.client';
import { Reveal } from '@/components/motion/Reveal.client';
import { gadgetGallerySrc, gadgetGallerySrcSet, type GadgetEntry } from '@/lib/catalog/gadgets';

const SIZES = '(min-width: 64rem) 300px, (min-width: 40rem) 45vw, 78vw';

/**
 * The brand's own images of a gadget, in the order set in the catalogue: the colours in stock
 * first, then the feature creatives. Square images in a sideways rail under the stage.
 */
export function GadgetGallery({ gadget, title }: { gadget: GadgetEntry; title: string }) {
  const photos = gadget.photos;
  if (!photos || photos.gallery.length === 0) return null;

  return (
    <section aria-labelledby="gadget-gallery-heading" className="bg-paper pt-4 pb-10 text-fg lg:pb-14">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 id="gadget-gallery-heading" className="font-display text-h2 text-balance">
            Up close
          </h2>
          <AccentBar className="mt-4" />
        </Reveal>

        <ScrollRail label={`Images of ${title}`}>
          {photos.gallery.map((caption, n) => (
            <li key={n} className="w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-[calc((100%-3*1.25rem)/4)]">
              <figure className="flex flex-col gap-2">
                <div className="relative aspect-square w-full overflow-hidden rounded-card bg-surface-2 shadow-lg shadow-shadow/10 ring-1 ring-fg/10 ring-inset">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer */}
                  <img
                    src={gadgetGallerySrc(photos, n)}
                    srcSet={gadgetGallerySrcSet(photos, n)}
                    sizes={SIZES}
                    width={960}
                    height={960}
                    alt={`${title}: ${caption}`}
                    decoding="async"
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover"
                  />
                </div>
                <figcaption className="text-sm text-fg-muted">{caption}</figcaption>
              </figure>
            </li>
          ))}
        </ScrollRail>
      </div>
    </section>
  );
}
