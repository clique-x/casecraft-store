import { NextResponse, type NextRequest } from 'next/server';
import { getProxyProductHandles, MISSING_PRODUCT_HANDLE } from '@/lib/medusa/products';

export const config = {
  matcher: '/products/:handle',
};

function handleOf(pathname: string): string | null {
  const segment = pathname.split('/')[2];
  if (!segment) return null;
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

// Under cacheComponents + partialPrefetching an unlisted handle would be answered with the App Shell
// (status 200) before notFound() runs; deciding here keeps the first response a real 404.
export async function proxy(request: NextRequest) {
  const handle = handleOf(request.nextUrl.pathname);
  const handles = await getProxyProductHandles();
  if (handle !== null && handles.includes(handle)) return NextResponse.next();
  return NextResponse.rewrite(new URL(`/products/${MISSING_PRODUCT_HANDLE}`, request.url));
}
