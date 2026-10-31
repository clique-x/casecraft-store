'use client';

import { useState } from 'react';
import Link from 'next/link';
import { InfoIcon } from 'lucide-react';
import { BrandOutline, phoneHref } from '@/components/phone-picker/BrandOutline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LAUNCH_BRANDS } from '@/lib/brand';
import type { PhoneModel } from '@/lib/medusa/fixtures';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  /** Only the models this design fits, in catalogue order. */
  models: PhoneModel[];
  value: string | null;
  onChange: (slug: string) => void;
  /** The visitor's saved phone when this design does not fit it. */
  unfitPhone?: PhoneModel | null;
  className?: string;
}

interface BrandGroup {
  brand: string;
  models: PhoneModel[];
}

function groupByBrand(models: PhoneModel[]): BrandGroup[] {
  const order = new Map<string, number>(LAUNCH_BRANDS.map((brand, i) => [brand, i]));
  const groups = new Map<string, PhoneModel[]>();
  for (const model of models) {
    const list = groups.get(model.brand) ?? [];
    list.push(model);
    groups.set(model.brand, list);
  }
  return [...groups.entries()]
    .map(([brand, list]) => ({ brand, models: list }))
    .sort((a, b) => (order.get(a.brand) ?? 99) - (order.get(b.brand) ?? 99));
}

/** Brand tabs → model chips, in the PhonePicker's visual language on paper. */
export function ModelSelector({ models, value, onChange, unfitPhone = null, className }: ModelSelectorProps) {
  const groups = groupByBrand(models);
  const selected = value ? (models.find((m) => m.slug === value) ?? null) : null;

  const [brand, setBrand] = useState(() => selected?.brand ?? groups[0]?.brand ?? '');

  // Follow a selection made elsewhere (URL, cookie, viewer) by re-syncing the active tab.
  const [trackedSlug, setTrackedSlug] = useState<string | null>(selected?.slug ?? null);
  const currentSlug = selected?.slug ?? null;
  if (currentSlug !== trackedSlug) {
    setTrackedSlug(currentSlug);
    if (selected) setBrand(selected.brand);
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-fg">Your phone</p>
        <p className="text-caption text-fg-muted tabular-nums">Fits {models.length} models</p>
      </div>

      {unfitPhone && (
        <p
          role="note"
          className="flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg bg-surface-2 px-3 py-2 text-sm text-fg"
        >
          <InfoIcon className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
          <span>Doesn&apos;t fit your {unfitPhone.model}.</span>
          <Link
            href={phoneHref(unfitPhone)}
            className="rounded-sm font-medium underline underline-offset-4 outline-none hover:text-accent-text focus-visible:ring-3 focus-visible:ring-accent-2"
          >
            See covers that do
          </Link>
        </p>
      )}

      <Tabs value={brand} onValueChange={setBrand} className="gap-4">
        <TabsList
          variant="line"
          aria-label="Phone brand"
          className="-mx-1 h-auto w-full flex-wrap justify-start gap-1 px-1 pb-1.5 group-data-horizontal/tabs:h-auto sm:snap-x sm:flex-nowrap sm:scroll-px-1 sm:overflow-x-auto sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden"
        >
          {groups.map((group) => (
            <TabsTrigger
              key={group.brand}
              value={group.brand}
              className="h-auto min-h-11 flex-none snap-start gap-2 rounded-lg px-3 text-sm font-medium text-fg-muted after:bg-accent hover:text-fg focus-visible:border-transparent focus-visible:ring-accent-2/60 data-active:bg-transparent data-active:text-fg"
            >
              <BrandOutline islandStyle={group.models[0]?.islandStyle ?? 'square'} className="opacity-80" />
              {group.brand}
            </TabsTrigger>
          ))}
        </TabsList>

        {groups.map((group) => (
          <TabsContent key={group.brand} value={group.brand}>
            <div role="group" aria-label={`${group.brand} models`} className="flex flex-wrap gap-2">
              {group.models.map((model) => {
                const isSelected = model.slug === value;
                return (
                  <button
                    key={model.slug}
                    type="button"
                    data-model-chip
                    aria-pressed={isSelected}
                    onClick={() => onChange(model.slug)}
                    className={cn(
                      'min-h-11 rounded-pill px-4 text-sm font-medium transition-colors duration-(--dur-micro) outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg',
                      isSelected
                        ? 'bg-fg text-paper ring-2 ring-fg ring-offset-2 ring-offset-surface'
                        : 'bg-surface-2 text-fg hover:bg-border',
                    )}
                  >
                    {model.model}
                  </button>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default ModelSelector;
