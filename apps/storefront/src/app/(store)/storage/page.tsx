import type { Metadata } from 'next';
import { DepartmentPage } from '@/components/gadget/DepartmentPage';
import { BRAND_NAME, SITE_URL, OG_IMAGE } from '@/lib/brand';

const TITLE = 'Memory cards, pen drives, SSDs and RAM';
const DESCRIPTION =
  'SanDisk, Samsung, WD and Consistent memory cards, pen drives and SSDs, plus laptop and desktop RAM, with Cash on Delivery and free shipping over ₹499.';
const URL_PATH = '/storage';

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

export default function StoragePage() {
  return <DepartmentPage department="storage" />;
}
