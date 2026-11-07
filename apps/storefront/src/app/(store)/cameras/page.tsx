import type { Metadata } from 'next';
import { DepartmentPage } from '@/components/gadget/DepartmentPage';
import { BRAND_NAME, SITE_URL, OG_IMAGE } from '@/lib/brand';

const TITLE = 'CP Plus Wi-Fi security cameras';
const DESCRIPTION =
  'CP Plus ezyKam+ pan-and-tilt Wi-Fi cameras in 2, 3 and 4 MP, with night vision and two-way talk, Cash on Delivery and free shipping over ₹499.';
const URL_PATH = '/cameras';

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

export default function CamerasPage() {
  return <DepartmentPage department="cameras" />;
}
