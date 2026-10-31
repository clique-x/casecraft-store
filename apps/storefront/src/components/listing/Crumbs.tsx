import Link from 'next/link';
import { ChevronRightIcon } from 'lucide-react';
import { SITE_URL } from '@/lib/brand';

export interface Crumb {
  name: string;
  href: string;
}

function breadcrumbJsonLd(crumbs: readonly Crumb[]): string {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: new URL(crumb.href, SITE_URL).toString(),
    })),
  };
  return JSON.stringify(jsonLd).replace(/</g, '\\u003c');
}

const LINK =
  'rounded-sm underline-offset-4 transition-colors duration-(--dur-micro) hover:text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2';

/** Same look as the product Breadcrumb, for any trail; "Home" is prepended. */
export function Crumbs({ trail }: { trail: readonly Crumb[] }) {
  const crumbs: Crumb[] = [{ name: 'Home', href: '/' }, ...trail];
  const last = crumbs.length - 1;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(crumbs) }} />
      <nav aria-label="Breadcrumb" className="text-caption text-fg-muted">
        <ol className="flex min-w-0 items-center gap-1">
          {crumbs.map((crumb, i) =>
            i === last ? (
              <li key={crumb.href} aria-current="page" className="min-w-0 truncate font-medium text-fg">
                {crumb.name}
              </li>
            ) : (
              <li key={crumb.href} className="flex shrink-0 items-center gap-1">
                <Link href={crumb.href} className={LINK}>
                  {crumb.name}
                </Link>
                <ChevronRightIcon className="size-3.5" aria-hidden="true" />
              </li>
            ),
          )}
        </ol>
      </nav>
    </>
  );
}
