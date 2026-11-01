'use client';

import { MapPin, Plus } from 'lucide-react';
import type { CartAddress } from '@/lib/cart/types';
import { cn } from '@/lib/utils';

interface Props {
  addresses: CartAddress[];
  selected: number;
  onSelect: (index: number) => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onAddNew: () => void;
}

function lines(a: CartAddress): string[] {
  return [
    a.address1,
    a.address2,
    [a.city, a.province].filter(Boolean).join(', ') + (a.postalCode ? ` ${a.postalCode}` : ''),
  ].filter((l) => l.trim().length > 0);
}

/** Addresses saved on this device from earlier orders, as cards; one tap picks where to deliver. */
export function SavedAddresses({ addresses, selected, onSelect, onEdit, onRemove, onAddNew }: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      <div role="radiogroup" aria-label="Saved addresses" className="flex flex-col gap-2.5">
        {addresses.map((a, i) => {
          const active = i === selected;
          const name = [a.firstName, a.lastName].filter(Boolean).join(' ');
          return (
            <div
              key={`${a.address1}-${a.postalCode}-${a.phone}`}
              className={cn(
                'rounded-[10px] border p-4 transition-colors',
                active ? 'border-fg bg-surface-2/50' : 'border-border hover:border-fg/40',
              )}
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="radio"
                  name="saved-address"
                  className="mt-1 size-4 accent-[var(--color-fg)]"
                  checked={active}
                  onChange={() => onSelect(i)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-bold text-fg">
                    <MapPin className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
                    {name || 'Saved address'}
                    {i === 0 && (
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[0.625rem] font-bold tracking-wide text-fg-muted uppercase">
                        Last used
                      </span>
                    )}
                  </span>
                  {lines(a).map((l) => (
                    <span key={l} className="block text-sm text-fg-muted">
                      {l}
                    </span>
                  ))}
                  {a.phone && <span className="mt-0.5 block text-sm text-fg-muted tabular-nums">+91 {a.phone}</span>}
                </span>
              </label>
              {active && (
                <div className="mt-3 flex gap-4 pl-7 text-sm">
                  <button type="button" onClick={() => onEdit(i)} className="font-semibold text-brand underline-offset-4 hover:underline">
                    Edit
                  </button>
                  <button type="button" onClick={() => onRemove(i)} className="font-semibold text-fg-muted underline-offset-4 hover:text-danger hover:underline">
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onAddNew}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-dashed border-fg/30 text-sm font-semibold text-fg transition-colors hover:border-fg hover:bg-surface-2"
      >
        <Plus className="size-4" aria-hidden="true" />
        Deliver to a new address
      </button>
    </div>
  );
}
