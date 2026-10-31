'use client';

import { useSyncExternalStore } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { getPhoto } from '@/lib/catalog/photos';
import { autoAdvance, featuredStore, useAutoAdvancePaused, useFeaturedIndex } from '@/lib/hero-state';
import { cn } from '@/lib/utils';
import { heroCommands, useAutoLive } from './heroBus';

interface Props {
  /** Server cast ids: the dots the HTML ships with before the store hydrates. */
  castIds: number[];
  className?: string;
}

const CONTROL =
  'grid size-11 shrink-0 place-items-center rounded-pill text-fg-on-ink transition-colors duration-(--dur-micro) hover:bg-fg-on-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2';

function castSnapshot(): string {
  return featuredStore.cast().join(',');
}

function castServer(): string {
  return '';
}

/** `[‹] ● ● ● ● ● ● [›] [❚❚]` on the slab; 44 px targets around 8 px dots. */
export function HeroDots({ castIds, className }: Props) {
  const index = useFeaturedIndex();
  const snapshot = useSyncExternalStore(featuredStore.subscribe, castSnapshot, castServer);
  const ids = snapshot ? snapshot.split(',').map(Number) : castIds;
  const live = useAutoLive();
  const paused = useAutoAdvancePaused();

  return (
    <div
      role="group"
      aria-label="Featured covers"
      data-hero-dots=""
      className={cn('flex items-center gap-0.5 rounded-pill bg-surface-glass p-1', className)}
    >
      <button type="button" aria-label="Previous cover" onClick={() => heroCommands.beat(-1)} className={CONTROL}>
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      {ids.map((id, i) => {
        const entry = getPhoto(id);
        const active = i === index;
        return (
          <button
            key={id}
            type="button"
            aria-label={`Show cover ${i + 1} of ${ids.length}: ${entry ? `${entry.design} · ${entry.brand}` : ''}`.trim()}
            aria-current={active ? 'true' : undefined}
            onClick={() => heroCommands.goTo(i)}
            className={CONTROL}
          >
            <span
              aria-hidden="true"
              className={cn(
                'block size-2 rounded-pill transition-[background-color,transform] duration-(--dur-ui)',
                active ? 'scale-125 bg-fg-on-ink' : 'bg-fg-on-ink/35',
              )}
            />
          </button>
        );
      })}
      <button type="button" aria-label="Next cover" onClick={() => heroCommands.beat(1)} className={CONTROL}>
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>
      {live ? (
        <button
          type="button"
          aria-label={paused ? 'Resume auto-advance' : 'Pause auto-advance'}
          aria-pressed={paused}
          onClick={() => autoAdvance.setPaused(!paused)}
          className={CONTROL}
        >
          {paused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
        </button>
      ) : null}
    </div>
  );
}
