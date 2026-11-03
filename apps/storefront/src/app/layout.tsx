import type { Metadata, Viewport } from 'next';
import './globals.css';
import { manrope, unbounded } from '@/lib/fonts';
import { BRAND_NAME, SITE_URL } from '@/lib/brand';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND_NAME} · Phone covers, earbuds and protection`,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    'Phone covers cut for your exact model, sealed boAt and realme earbuds and neckbands, and screen protection. UPI, cards or Cash on Delivery across India.',
  applicationName: BRAND_NAME,
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
};

// Store chrome (header, footer, providers) lives in app/(store)/layout.tsx.
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-IN" className={`${unbounded.variable} ${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
