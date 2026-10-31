'use client';

import { Pause, Play } from 'lucide-react';
import { autoAdvance, useAutoAdvancePaused } from '@/lib/hero-state';
import type { PhoneModel } from '@/lib/medusa/fixtures';
import { useMyPhone } from '@/lib/phone/use-my-phone';
import { cn } from '@/lib/utils';
import { chipSelection, markInteraction, useAutoLive, useChipSelection } from './heroBus';

interface Props {
  /** Models with at least three hero-eligible photos (the cast threshold). */
  models: PhoneModel[];
  className?: string;
}

interface ChipProps {
  selected: boolean;
  onSelect: () => void;
  children: string;
}

function Chip({ selected, onSelect, children }: ChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="flex h-11 shrink-0 snap-start items-center py-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
    >
      <span
        className={cn(
          'inline-flex h-10 items-center rounded-pill px-4 font-sans text-sm font-semibold whitespace-nowrap transition-colors duration-(--dur-micro)',
          selected
            ? 'bg-fg-on-ink text-ink ring-2 ring-accent-2 ring-offset-2 ring-offset-ink-2'
            : 'border border-fg-on-ink-muted/20 text-fg-on-ink hover:bg-fg-on-ink/10',
        )}
      >
        {children}
      </span>
    </button>
  );
}

/**
 * Phones only: "All" plus one chip per model with enough hero photos. Filters the cast
 * locally; never writes the cookie. Pre-selected from `my_phone` when it matches.
 */
export function HeroChips({ models, className }: Props) {
  const { phone } = useMyPhone();
  const selection = useChipSelection();
  const live = useAutoLive();
  const paused = useAutoAdvancePaused();

  const slugs = models.map((m) => m.slug);
  const effective =
    selection === undefined ? (phone && slugs.includes(phone.slug) ? phone.slug : null) : selection;

  const choose = (slug: string | null) => {
    markInteraction();
    chipSelection.set(slug);
  };

  return (
    <div className={cn('absolute inset-x-0 z-[4] flex items-center gap-2 px-4 lg:hidden', className)}>
      <div
        role="radiogroup"
        aria-label="Show covers for"
        className="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Chip selected={effective === null} onSelect={() => choose(null)}>
          All
        </Chip>
        {models.map((model) => (
          <Chip key={model.slug} selected={effective === model.slug} onSelect={() => choose(model.slug)}>
            {model.model}
          </Chip>
        ))}
      </div>
      {live ? (
        <button
          type="button"
          aria-label={paused ? 'Resume auto-advance' : 'Pause auto-advance'}
          aria-pressed={paused}
          onClick={() => autoAdvance.setPaused(!paused)}
          className="grid size-11 shrink-0 place-items-center rounded-pill text-fg-on-ink hover:bg-fg-on-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
        >
          {paused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
        </button>
      ) : null}
    </div>
  );
}
