import { AccentBar } from '@/components/brand/AccentBar';
import { ScrollRail } from '@/components/listing/ScrollRail.client';
import { Reveal } from '@/components/motion/Reveal.client';
import { gallerySrc, gallerySrcSet, photoAlt, type PhotoEntry } from '@/lib/catalog/photos';

const SIZES = '(min-width: 64rem) 300px, (min-width: 40rem) 45vw, 78vw';

/**
 * Every view of a photographed cover, in the order the owner set: the back on its own, in hand,
 * the other angles, the spec card last. Square images in a sideways rail under the stage.
 */
export function PhotoGallery({ entry }: { entry: PhotoEntry }) {
  const labels = entry.gallery ?? [];
  if (labels.length === 0) return null;
  const alt = photoAlt(entry);

  return (
    <section aria-labelledby="photo-gallery-heading" className="bg-paper pt-4 pb-10 text-fg lg:pb-14">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 id="photo-gallery-heading" className="font-display text-h2 text-balance">
            Every angle
          </h2>
          <AccentBar className="mt-4" />
        </Reveal>

        <ScrollRail label={`Photos of ${entry.title}`}>
          {labels.map((label, n) => (
            <li key={n} className="w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-[calc((100%-3*1.25rem)/4)]">
              <figure className="flex flex-col gap-2">
                <div className="relative aspect-square w-full overflow-hidden rounded-card bg-ink-2 shadow-lg shadow-shadow/10 ring-1 ring-fg/10 ring-inset">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer */}
                  <img
                    src={gallerySrc(entry.id, n)}
                    srcSet={gallerySrcSet(entry.id, n)}
                    sizes={SIZES}
                    width={960}
                    height={960}
                    alt={`${alt}: ${label}`}
                    decoding="async"
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover"
                  />
                </div>
                <figcaption className="text-sm text-fg-muted">{label}</figcaption>
              </figure>
            </li>
          ))}
        </ScrollRail>
      </div>
    </section>
  );
}
