import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgePercent } from 'lucide-react';
import { ListingHeader, PAGE_SHELL } from '@/components/listing/ListingHeader';
import { ProductGrid } from '@/components/listing/ProductGrid';
import { BRAND_NAME, SITE_URL } from '@/lib/brand';
import { ACCESSORY_TYPE_LABEL, BUNDLE_SAVING_INR, type AccessoryType } from '@/lib/catalog/accessories';
import { formatInr } from '@/lib/catalog/photos';
import { getAccessories } from '@/lib/medusa/products';

const TITLE = 'Screen guards, lens protectors and back films';
const DESCRIPTION = `Tempered glass screen guards, camera lens protectors and full-frame back films cut for your phone. ${formatInr(BUNDLE_SAVING_INR)} off each when you buy it with a cover.`;
const URL_PATH = '/accessories';

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
  },
};

const SECTIONS: readonly { type: AccessoryType; heading: string; intro: string }[] = [
  { type: 'screen-guard', heading: 'Screen guards', intro: 'Tempered glass for the front, clear or privacy.' },
  { type: 'lens-protector', heading: 'Camera lens protectors', intro: 'Glass rings that keep the camera bump off the table.' },
  { type: 'back-film', heading: 'Full-frame back films', intro: 'For a bare phone: covers the back and sides.' },
];

export default async function AccessoriesPage() {
  const accessories = await getAccessories();

  return (
    <div className={PAGE_SHELL}>
      <ListingHeader
        trail={[{ name: 'Accessories', href: URL_PATH }]}
        title="Protection for your phone"
        intro="Screen guards, lens protectors and back films, each cut for your exact model."
        aside={`${accessories.length} products`}
      />

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3.5 text-sm text-fg">
        <BadgePercent className="size-5 shrink-0 text-brand" aria-hidden="true" />
        <span>
          <strong>{formatInr(BUNDLE_SAVING_INR)} off each</strong> when you buy it with any cover. The saving shows in your cart.
        </span>
        <Link href="/trending" className="font-semibold text-brand underline-offset-4 hover:underline">
          Shop covers
        </Link>
      </div>

      {SECTIONS.map(({ type, heading, intro }) => {
        const items = accessories.filter((a) => a.accessory?.type === type);
        if (items.length === 0) return null;
        return (
          <section key={type} aria-labelledby={`${type}-heading`} className="mt-12">
            <h2 id={`${type}-heading`} className="font-display text-h3 font-extrabold text-fg">
              {heading}
            </h2>
            <p className="mt-1 text-body text-fg-muted">{intro}</p>
            <ProductGrid products={items} label={ACCESSORY_TYPE_LABEL[type]} className="mt-6" />
          </section>
        );
      })}
    </div>
  );
}
