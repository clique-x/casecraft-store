'use client';

import { useId } from 'react';
import type { CaseType, CaseTypeInfo } from '@/lib/medusa/fixtures';
import { cn } from '@/lib/utils';

interface CaseTypeSelectorProps {
  /** Only the types this design is made in. */
  options: readonly CaseTypeInfo[];
  value: CaseType;
  onChange: (type: CaseType) => void;
  /** Types with no stock for the selected model; still selectable, just marked. */
  soldOut?: ReadonlySet<CaseType>;
  className?: string;
}

/** Native radios (arrow keys, form semantics) dressed as large cards. */
export function CaseTypeSelector({ options, value, onChange, soldOut, className }: CaseTypeSelectorProps) {
  const name = useId();

  return (
    <fieldset className={cn('flex flex-col gap-3', className)}>
      <legend className="mb-3 text-sm font-semibold text-fg">Case type</legend>
      <div className={cn('grid gap-3', options.length > 1 && 'sm:grid-cols-2')}>
        {options.map((option) => {
          const checked = option.type === value;
          const id = `${name}-${option.type}`;
          const out = soldOut?.has(option.type) ?? false;
          return (
            <div key={option.type} className="relative">
              <input
                type="radio"
                id={id}
                name={name}
                value={option.type}
                checked={checked}
                onChange={() => onChange(option.type)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={cn(
                  'flex min-h-[4.5rem] cursor-pointer gap-3 rounded-card border bg-surface p-4 transition-[border-color,background-color] duration-(--dur-micro) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-2',
                  checked ? 'border-fg ring-1 ring-fg' : 'border-border hover:border-fg-muted',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 size-4 shrink-0 rounded-full border-2 transition-colors duration-(--dur-micro)',
                    checked ? 'border-fg bg-fg shadow-[inset_0_0_0_3px_var(--color-surface)]' : 'border-fg-muted',
                  )}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-fg">{option.name}</span>
                    <span className="shrink-0 text-sm font-medium text-fg tabular-nums">
                      {option.priceDeltaInr > 0 ? `+₹${option.priceDeltaInr}` : 'Included'}
                    </span>
                  </span>
                  <span className="text-caption text-fg-muted">{option.blurb}</span>
                  {out && <span className="text-caption font-medium text-fg-muted">Sold out for this phone</span>}
                </span>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

export default CaseTypeSelector;
