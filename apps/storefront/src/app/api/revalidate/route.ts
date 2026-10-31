import { revalidateTag } from 'next/cache';
import { CATALOG_TAG } from '@/lib/medusa/catalog';

/**
 * Called by the Medusa backend (apps/backend/src/subscribers/revalidate-storefront.ts) after a
 * product, price or stock change, so cached pages pick up the new catalogue on their next request.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get('x-revalidate-secret') !== secret) {
    return Response.json({ revalidated: false }, { status: 401 });
  }
  // Expire immediately rather than serving stale data once more: stock counts should be exact.
  revalidateTag(CATALOG_TAG, { expire: 0 });
  return Response.json({ revalidated: true });
}
