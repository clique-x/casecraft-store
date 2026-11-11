import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRightIcon } from 'lucide-react';
import { CaseCutout } from '@/components/home/hero/CaseCutout';
import { ListingHeader, PAGE_SHELL } from '@/components/listing/ListingHeader';
import { BRAND_NAME, SITE_URL, OG_IMAGE } from '@/lib/brand';
import { coversLabel } from '@/lib/catalog/listing';
import { shotSrc, shotSrcSet, type PhotoEntry } from '@/lib/catalog/photos';
import { getLooks } from '@/lib/medusa/home';

const TITLE = 'Shop phone back covers by look';
const DESCRIPTION =
  'Carbon, animal print, solid, clear and frosted, and ring and stand covers. Every cover photographed in our shop.';
const URL_PATH = '/categories';
const TILE_SIZES = '(max-width: 768px) 46vw, (max-width: 1024px) 31vw, 400px';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: new URL(URL_PATH, SITE_URL).toString() },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: BRAND_NAME,
    title: `${TITLE} · ${BRAND_NAME}`,
    description: DESCRIPTION,
    url: new URL(URL_PATH, SITE_URL).toString(),
    images: [OG_IMAGE],
  },
};

function LookImage({ cover, priority }: { cover: PhotoEntry; priority: boolean }) {
  if (!cover.shots) {
    return (
      <div className="absolute inset-x-[14%] top-[8%] bottom-0">
        <CaseCutout entry={cover} role="tile" sizes={TILE_SIZES} priority={priority} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants, no optimizer
    <img
      src={shotSrc(cover.id, 0)}
      srcSet={shotSrcSet(cover.id, 0)}
      sizes={TILE_SIZES}
      width={800}
      height={1000}
      alt=""
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      className="absolute inset-0 size-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out-expo motion-safe:group-hover/tile:scale-[1.04]"
    />
  );
}

export default async function CategoriesPage() {
  const looks = await getLooks();

  return (
    <div className={PAGE_SHELL}>
      <ListingHeader
        trail={[{ name: 'Looks', href: URL_PATH }]}
        title="Phone back covers by look"
        intro={`${looks.length} looks. Every cover is photographed in our shop, so what you see is what arrives.`}
      />

      <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:mt-10">
        {looks.map(({ look, cover, count }, i) => (
          <li key={look.handle}>
            <Link
              href={`/categories/${look.handle}`}
              className="group/tile flex h-full flex-col gap-3 rounded-card outline-none focus-visible:ring-3 focus-visible:ring-accent-2"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card bg-surface-2 ring-1 ring-fg/10 ring-inset">
                <LookImage cover={cover} priority={i < 2} />
              </div>
              <div className="flex items-start justify-between gap-2 px-0.5">
                <div className="min-w-0">
                  <h2 className="font-sans text-base leading-tight font-bold text-fg sm:text-lg">{look.name}</h2>
                  <p className="mt-1 hidden text-sm text-fg-muted sm:block">{look.blurb}</p>
                  <p className="mt-1 text-caption text-fg-muted tabular-nums">{coversLabel(count)}</p>
                </div>
                <span className="grid size-8 shrink-0 place-items-center rounded-pill bg-surface-2 text-fg transition-colors duration-300 group-hover/tile:bg-fg group-hover/tile:text-paper">
                  <ArrowUpRightIcon aria-hidden="true" className="size-4" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
