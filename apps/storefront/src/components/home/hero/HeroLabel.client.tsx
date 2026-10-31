'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, m } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PRODUCT_CTA_LABEL } from '@/lib/brand';
import { formatInr, getPhoto } from '@/lib/catalog/photos';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { featuredStore, useFeaturedItem } from '@/lib/hero-state';
import { EASE_OUT_EXPO } from '@/lib/motion/tokens';
import { cn } from '@/lib/utils';
import { heroCommands } from './heroBus';

interface Props {
  className?: string;
}

const ARROW =
  'grid size-11 shrink-0 place-items-center rounded-pill text-fg-on-ink transition-colors duration-(--dur-micro) hover:bg-fg-on-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2';

/**
 * The cover's own label on the slab: `[‹] Design · Brand Series ₹price [View] [›]`.
 * Rendered twice (lg row, phone copy stack); the hidden instance's live region is display:none, so only one announces.
 * Re-renders only on a beat; announces user-initiated changes only.
 */
export function HeroLabel({ className }: Props) {
  const item = useFeaturedItem();
  const reduced = useReducedMotion();
  const [announcement, setAnnouncement] = useState('');

  useEffect(
    () =>
      featuredStore.subscribe(() => {
        if (featuredStore.lastSource() !== 'user') return;
        const next = getPhoto(featuredStore.itemId());
        if (!next) return;
        setAnnouncement(`${next.design}, ${next.brand} ${next.series}, ${formatInr(next.priceInr)}, fits ${next.modelLabel}`);
      }),
    [],
  );

  const duration = reduced ? 0 : 0.2;

  return (
    <div className={cn('pointer-events-none', className)}>
      <div className="pointer-events-auto flex min-h-14 items-center gap-1 rounded-pill bg-surface-glass p-1.5">
        <button type="button" aria-label="Previous cover" onClick={() => heroCommands.beat(-1)} className={ARROW}>
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>

        <div className="relative min-w-0 flex-1 overflow-hidden px-1">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration, ease: [...EASE_OUT_EXPO] }}
              className="flex min-w-0 flex-col leading-tight"
            >
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="min-w-0 truncate font-sans text-sm font-bold text-fg-on-ink">{item.design}</span>
                <span className="shrink-0 font-sans text-sm font-bold tabular-nums text-fg-on-ink">{formatInr(item.priceInr)}</span>
              </span>
              <span className="min-w-0 truncate text-caption text-fg-on-ink-muted">
                {item.brand} {item.series}
              </span>
            </m.div>
          </AnimatePresence>
        </div>

        <Link
          href={`/products/${item.slug}`}
          prefetch={false}
          className="inline-flex h-10 shrink-0 items-center rounded-pill bg-fg-on-ink px-4 font-sans text-sm font-bold text-ink transition-colors duration-(--dur-micro) hover:bg-fg-on-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
        >
          {PRODUCT_CTA_LABEL}
        </Link>

        <button type="button" aria-label="Next cover" onClick={() => heroCommands.beat(1)} className={ARROW}>
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </div>
  );
}
