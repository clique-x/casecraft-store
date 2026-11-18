import type { Metadata, Viewport } from 'next';
import './globals.css';
import { manrope, unbounded } from '@/lib/fonts';
import { BRAND_NAME, OG_IMAGE, SITE_URL } from '@/lib/brand';
import { IntroBoot } from '@/components/intro/IntroBoot';
import { InstallBoot } from '@/components/install/InstallBoot';
import { GoogleTagManager } from '@/components/analytics/GoogleTagManager';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND_NAME} · Phone covers, audio, storage and protection`,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    'Phone covers for your exact model, sealed boAt and realme audio, memory cards, SSDs, RAM and Wi-Fi cameras. COD, UPI and cards across India.',
  applicationName: BRAND_NAME,
  // Added to an iPhone's home screen, the store opens as its own app, without Safari's bars.
  appleWebApp: { capable: true, title: BRAND_NAME, statusBarStyle: 'default' },
  robots: { index: true, follow: true },
  // Pages that set their own openGraph replace this whole object, so each of them names an image too.
  openGraph: { type: 'website', locale: 'en_IN', siteName: BRAND_NAME, images: [OG_IMAGE] },
  // No images here: Next fills twitter:image from each page's own openGraph images.
  twitter: { card: 'summary_large_image' },
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
    // suppressHydrationWarning: the intro controller in <head> may set data-gh-intro and an inline style on
    // <html> before React hydrates (one level only; children are still checked).
    <html lang="en-IN" className={`${unbounded.variable} ${manrope.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <IntroBoot />
        <InstallBoot />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <GoogleTagManager />
      </body>
    </html>
  );
}
