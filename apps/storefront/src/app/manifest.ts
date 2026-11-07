import type { MetadataRoute } from 'next';
import { BRAND_NAME } from '@/lib/brand';

/** Lets phones add the store to the home screen with the GadgetsHub "G" mark. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND_NAME,
    short_name: BRAND_NAME,
    description: 'Phone cases, earbuds, speakers, memory cards, SSDs, RAM, cameras and screen protection.',
    start_url: '/',
    display: 'standalone',
    background_color: '#024C51',
    theme_color: '#024C51',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
