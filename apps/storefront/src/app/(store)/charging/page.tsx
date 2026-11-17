import type { Metadata } from 'next';
import { DepartmentPage } from '@/components/gadget/DepartmentPage';
import { BRAND_NAME, SITE_URL, OG_IMAGE } from '@/lib/brand';

const TITLE = 'Samsung chargers and data cables';
const DESCRIPTION =
  'Samsung 25W and 45W Super Fast Charging adapters and a USB-A to USB-C cable, sealed in the box. Cash on Delivery, free shipping over ₹499.';
const URL_PATH = '/charging';

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

export default function ChargingPage() {
  return <DepartmentPage department="charging" />;
}
