import type { Metadata } from 'next';
import { DepartmentPage } from '@/components/gadget/DepartmentPage';
import { BRAND_NAME, SITE_URL, OG_IMAGE } from '@/lib/brand';

const TITLE = 'Gaming mice, keyboard combos and USB hubs';
const DESCRIPTION =
  'Ant Esports gaming mice and keyboard combos and a Honeywell 4-port USB hub, sealed with the brand warranty. Cash on Delivery, free shipping over ₹499.';
const URL_PATH = '/computer-accessories';

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

export default function ComputerAccessoriesPage() {
  return <DepartmentPage department="computer" />;
}
