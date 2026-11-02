import type { Metadata } from 'next';
import { DepartmentPage } from '@/components/gadget/DepartmentPage';
import { BRAND_NAME, SITE_URL } from '@/lib/brand';

const TITLE = 'boAt and realme wireless earbuds and neckbands';
const DESCRIPTION =
  'Sealed boAt and realme earbuds and neckbands with the 1-year brand warranty, for every phone, with Cash on Delivery and free shipping over ₹499.';
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

export default function AudioPage() {
  return <DepartmentPage department="audio" />;
}
