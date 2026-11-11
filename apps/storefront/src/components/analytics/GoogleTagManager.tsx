import Script from 'next/script';
import { GTM_ID } from '@/lib/brand';

/** Only production builds send data, so local and development runs never show up in Google Analytics. */
const ENABLED = process.env.NODE_ENV === 'production' && /^GTM-[A-Z0-9]+$/.test(GTM_ID);

/**
 * Google Tag Manager, Google's standard container snippet. It loads after the page is interactive, so it never
 * holds up the first paint. Google Analytics (GA4) is added and published inside the container; with GA4's
 * enhanced measurement on, page changes made by client-side navigation are counted too.
 *
 * No <noscript> iframe: Google Analytics cannot run without JavaScript, and crawlers that read the page as text
 * showed the iframe's URL as text at the top of the page.
 */
export function GoogleTagManager() {
  if (!ENABLED) return null;
  return (
    <Script id="gtm" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}
