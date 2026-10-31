import type { Metadata, Viewport } from 'next';
import './globals.css';
import { manrope, unbounded } from '@/lib/fonts';
import { BRAND_NAME, SITE_URL } from '@/lib/brand';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND_NAME} · Trending phone back covers, cut for your phone`,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    'Trending phone back covers in India, cut for your exact model. Pick your phone once, browse only the designs that fit, and pay with UPI, cards or Cash on Delivery.',
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
