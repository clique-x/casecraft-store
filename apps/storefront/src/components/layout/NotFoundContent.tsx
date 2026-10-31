import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { SearchForm } from '@/components/search/SearchForm';

const SECONDARY =
  'inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-border bg-paper px-5 text-sm font-semibold text-fg transition-colors duration-(--dur-micro) hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2';

/** The 404 body shared by app/not-found.tsx (unmatched URLs) and app/(store)/not-found.tsx. */
export function NotFoundContent() {
  return (
    <section
      aria-labelledby="not-found-heading"
      className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-36 lg:pb-28"
    >
      <p className="text-caption font-semibold tracking-wide text-fg-muted uppercase tabular-nums">404</p>
      <h1 id="not-found-heading" className="font-display text-h2 font-extrabold text-balance text-fg">
        We couldn’t find that page
      </h1>
      <p className="max-w-md text-body text-fg-muted">
        The link may be old, or the address may have a typo. Search for a cover, or start from one of these.
      </p>

      <SearchForm id="not-found-q" />

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link
          href="/trending"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-fg px-5 text-sm font-semibold text-paper transition-colors duration-(--dur-micro) hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Browse trending
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
        <Link href="/phones" className={SECONDARY}>
          Shop by phone
        </Link>
        <Link href="/" className={SECONDARY}>
          Go to the home page
        </Link>
      </div>
    </section>
  );
}
