import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgePercent } from 'lucide-react';
import { DepartmentHeader, DepartmentSection } from '@/components/listing/DepartmentHeader';
import { PAGE_SHELL } from '@/components/listing/ListingHeader';
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

const SECTIONS: readonly { type: AccessoryType; heading: string }[] = [
  { type: 'screen-guard', heading: 'Screen guards' },
  { type: 'lens-protector', heading: 'Lens protectors' },
  { type: 'back-film', heading: 'Back films' },
  { type: 'body-film', heading: 'Body film' },
];

export default async function AccessoriesPage() {
  const accessories = await getAccessories();
  const groups = SECTIONS.map((s) => ({ ...s, items: accessories.filter((a) => a.accessory?.type === s.type) })).filter((g) => g.items.length > 0);

  return (
    <div className={PAGE_SHELL}>
      <DepartmentHeader
        trail={[{ name: 'Accessories', href: URL_PATH }]}
        title="Protection"
        groups={groups.map((g) => ({ id: g.type, heading: g.heading, count: g.items.length }))}
        warranty="Cut for your exact phone"
      />

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-fg">
        <BadgePercent className="size-5 shrink-0 text-brand" aria-hidden="true" />
        <strong>{formatInr(BUNDLE_SAVING_INR)} off each with any cover</strong>
        <Link href="/covers" className="ml-auto inline-flex h-9 items-center rounded-pill bg-fg px-4 font-bold text-paper transition-colors hover:bg-brand">
          Shop covers
        </Link>
      </div>

      {groups.map(({ type, heading, items }, i) => (
        <DepartmentSection key={type} id={type} heading={heading} count={items.length} first={i === 0}>
          <ProductGrid products={items} label={ACCESSORY_TYPE_LABEL[type]} eager={i === 0} className="mt-5" />
        </DepartmentSection>
      ))}
    </div>
  );
}
