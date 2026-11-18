import type { MetadataRoute } from 'next';
import { BRAND_NAME } from '@/lib/brand';

/**
 * Lets phones and computers install the store as an app, with the GadgetsHub "G" mark. The install pop-up
 * (components/install) offers it; `shortcuts` are the entries a long press on the app's icon shows.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND_NAME,
    short_name: BRAND_NAME,
    description: 'Phone cases, earbuds, speakers, memory cards, SSDs, RAM, cameras and screen protection.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    lang: 'en-IN',
    categories: ['shopping'],
    background_color: '#024C51',
    theme_color: '#024C51',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Phone covers', url: '/covers', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'Audio', url: '/audio', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'My orders', url: '/account', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
    ],
  };
}
