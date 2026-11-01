import type { Metadata } from 'next';
import { ListingHeader, PAGE_SHELL } from '@/components/listing/ListingHeader';
import { ProductGrid } from '@/components/listing/ProductGrid';
import { BRAND_NAME, SITE_URL } from '@/lib/brand';
import { AUDIO_TYPE_LABEL, type AudioType } from '@/lib/catalog/audio';
import { getAudio } from '@/lib/medusa/products';

const TITLE = 'Wireless earbuds, neckbands and Bluetooth speakers';
const DESCRIPTION =
  'Wireless earbuds, neckbands and Bluetooth speakers that work with every phone, with Cash on Delivery and free shipping over ₹499.';
const URL_PATH = '/audio';

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

const SECTIONS: readonly { type: AudioType; heading: string; intro: string }[] = [
  { type: 'earbuds', heading: 'Wireless earbuds', intro: 'True wireless, with a charging case. Pairs with Android and iPhone.' },
  { type: 'neckband', heading: 'Neckbands', intro: 'All-day battery and clear calls, always round your neck.' },
  { type: 'speaker', heading: 'Bluetooth speakers', intro: 'From pocket-size to party-size.' },
];

export default async function AudioPage() {
  const audio = await getAudio();

  return (
    <div className={PAGE_SHELL}>
      <ListingHeader
        trail={[{ name: 'Audio', href: URL_PATH }]}
        title="Wireless audio"
        intro="Earbuds, neckbands and speakers that work with any phone. Pick a colour on the product page."
        aside={`${audio.length} products`}
      />
      {SECTIONS.map(({ type, heading, intro }) => {
        const items = audio.filter((a) => a.audio?.type === type);
        if (items.length === 0) return null;
        return (
          <section key={type} id={type} aria-labelledby={`${type}-heading`} className="mt-12 scroll-mt-28">
            <h2 id={`${type}-heading`} className="font-display text-h3 font-extrabold text-fg">
              {heading}
            </h2>
            <p className="mt-1 text-body text-fg-muted">{intro}</p>
            <ProductGrid products={items} label={AUDIO_TYPE_LABEL[type]} className="mt-6" />
          </section>
        );
      })}
    </div>
  );
}
