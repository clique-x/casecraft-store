import { NextResponse, type NextRequest } from 'next/server';
import { brandSlug } from '@/components/phone-picker/BrandOutline';
import { LOOKS } from '@/lib/catalog/looks';
import { POLICY_SLUGS } from '@/lib/content/policies';
import { getCatalogPhoneModels } from '@/lib/medusa/catalog';
import { THEMES } from '@/lib/medusa/fixtures';
import { getProxyProductHandles, MISSING_PRODUCT_HANDLE } from '@/lib/medusa/products';

export const config = {
  matcher: ['/products/:handle', '/pages/:slug', '/categories/:handle', '/phones/:brand', '/phones/:brand/:model'],
};

/** No route answers this path, so a rewrite to it renders the global 404 with a real 404 status. */
const MISSING_PAGE = '/__not-found';

function segments(pathname: string): string[] {
  try {
    return pathname.split('/').filter(Boolean).map(decodeURIComponent);
  } catch {
    return [];
  }
}

const CATEGORY_HANDLES = new Set<string>([...LOOKS.map((l) => l.handle), ...THEMES.map((t) => t.handle)]);
const POLICIES = new Set<string>(POLICY_SLUGS);

async function exists(parts: string[]): Promise<boolean> {
  const [section, a, b] = parts;
  switch (section) {
    case 'pages':
      return parts.length === 2 && POLICIES.has(a);
    case 'categories':
      return parts.length === 2 && CATEGORY_HANDLES.has(a);
    case 'phones': {
      const models = await getCatalogPhoneModels();
      if (parts.length === 2) return models.some((m) => brandSlug(m.brand) === a);
      return parts.length === 3 && models.some((m) => brandSlug(m.brand) === a && m.slug === b);
    }
    default:
      return true;
  }
}

// Under cacheComponents + partialPrefetching an unknown param would be answered with the App Shell
// (status 200) before notFound() runs; deciding here keeps the first response a real 404.
export async function proxy(request: NextRequest) {
  const parts = segments(request.nextUrl.pathname);

  if (parts[0] === 'products') {
    const handles = await getProxyProductHandles();
    if (parts.length === 2 && handles.includes(parts[1])) return NextResponse.next();
    return NextResponse.rewrite(new URL(`/products/${MISSING_PRODUCT_HANDLE}`, request.url));
  }

  if (await exists(parts)) return NextResponse.next();
  return NextResponse.rewrite(new URL(MISSING_PAGE, request.url));
}
