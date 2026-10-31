import Link from 'next/link';
import { ArrowRightIcon, SmartphoneIcon } from 'lucide-react';
import { OpenSheetButton } from '@/components/home/StickyPhoneCta.client';
import { Button } from '@/components/ui/button';

export default function ProductNotFound() {
  return (
    <section
      aria-labelledby="not-found-heading"
      className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-36 lg:pb-28"
    >
      <p className="text-caption font-semibold tracking-wide text-fg-muted uppercase tabular-nums">404</p>
      <h1 id="not-found-heading" className="font-display text-hero text-fg">
        That cover has moved
      </h1>
      <p className="max-w-md text-body text-fg-muted">
        The design at this address is no longer here. Trending has what people are ordering this week, or pick
        your phone and we will show only the covers that fit it.
      </p>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button
          asChild
          size="lg"
          className="h-12 rounded-pill bg-accent px-6 text-base font-semibold text-ink hover:bg-accent-hover focus-visible:ring-accent-2"
        >
          <Link href="/trending">
            Browse trending
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </Button>
        <OpenSheetButton className="bg-surface-2 text-fg hover:bg-border">
          <SmartphoneIcon aria-hidden="true" />
          Select your phone
        </OpenSheetButton>
      </div>
    </section>
  );
}
