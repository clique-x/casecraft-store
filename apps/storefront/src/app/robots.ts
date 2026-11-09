import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/brand';

/** /robots.txt: crawl the store, skip private and per-visitor pages, and find the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/cart', '/checkout', '/account', '/order', '/search', '/api/'] },
    sitemap: new URL('/sitemap.xml', SITE_URL).toString(),
  };
}
