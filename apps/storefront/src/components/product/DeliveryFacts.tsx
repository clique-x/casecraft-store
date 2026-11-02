import { BanknoteIcon, ClockIcon, RotateCcwIcon, ShieldCheckIcon, TruckIcon, WrenchIcon, type LucideIcon } from 'lucide-react';
import { warrantyLabel } from '@/components/gadget/GadgetAssurance';
import { COD_FEE_INR, DISPATCH_WINDOW, FREE_SHIPPING_THRESHOLD_INR, REPLACEMENT_DAYS } from '@/lib/brand';
import type { GadgetEntry } from '@/lib/catalog/gadgets';
import { cn } from '@/lib/utils';

interface Fact {
  Icon: LucideIcon;
  label: string;
}

// Every line derives from lib/brand.ts; nothing here promises policy the constants do not define.
const SHIPPING: readonly Fact[] = [
  { Icon: ClockIcon, label: `Dispatched in ${DISPATCH_WINDOW}` },
  { Icon: TruckIcon, label: `Free shipping over ₹${FREE_SHIPPING_THRESHOLD_INR}` },
  { Icon: BanknoteIcon, label: COD_FEE_INR > 0 ? `Cash on Delivery (+₹${COD_FEE_INR})` : 'Cash on Delivery' },
];
const FACTS: readonly Fact[] = [...SHIPPING, { Icon: RotateCcwIcon, label: `${REPLACEMENT_DAYS}-day replacement` }];

/** Sealed brand audio is covered by the maker's warranty instead of the shop's replacement window. */
function gadgetFacts(gadget: GadgetEntry): readonly Fact[] {
  const brand = gadget.original?.brand;
  if (!brand) return FACTS;
  return [
    ...SHIPPING,
    ...(gadget.warrantyMonths ? [{ Icon: WrenchIcon, label: `${warrantyLabel(gadget.warrantyMonths)} ${brand} warranty` }] : []),
    { Icon: ShieldCheckIcon, label: 'Sealed box, no returns' },
  ];
}

export function DeliveryFacts({ gadget, className }: { gadget?: GadgetEntry; className?: string }) {
  const facts = gadget ? gadgetFacts(gadget) : FACTS;
  const sealed = gadget?.original !== undefined;
  return (
    <section aria-labelledby="delivery-heading" className={cn('rounded-card border border-border bg-surface p-4 sm:p-5', className)}>
      <h2 id="delivery-heading" className="text-caption font-semibold tracking-wide text-fg-muted uppercase">
        {sealed ? 'Delivery and warranty' : 'Delivery and returns'}
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {facts.map(({ Icon, label }) => (
          <li key={label} className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-accent-text">
              <Icon className="size-4.5" aria-hidden="true" />
            </span>
            <p className="min-w-0 text-sm font-medium text-fg tabular-nums">{label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
