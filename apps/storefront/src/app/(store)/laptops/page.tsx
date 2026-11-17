import type { Metadata } from 'next';
import { DepartmentPage } from '@/components/gadget/DepartmentPage';
import { BRAND_NAME, SITE_URL, OG_IMAGE } from '@/lib/brand';

const TITLE = 'Refurbished Dell Latitude laptops';
const DESCRIPTION =
  'Refurbished Dell Latitude 5400 and 7490: Core i5 8th gen, 8GB RAM, 256GB SSD, from ₹23,500 with a 6-month warranty. Cash on Delivery.';
const URL_PATH = '/laptops';

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

export default function LaptopsPage() {
  return <DepartmentPage department="laptops" />;
}
