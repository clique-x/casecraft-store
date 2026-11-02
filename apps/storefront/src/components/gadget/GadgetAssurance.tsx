import { BadgeCheckIcon, PackageCheckIcon, ShieldCheckIcon, WrenchIcon, type LucideIcon } from 'lucide-react';
import type { GadgetEntry } from '@/lib/catalog/gadgets';
import { cn } from '@/lib/utils';

interface Line {
  Icon: LucideIcon;
  title: string;
  body: string;
}

/** How a warranty length reads: "1-year" or "18-month". */
export function warrantyLabel(months: number): string {
  return months % 12 === 0 ? `${months / 12}-year` : `${months}-month`;
}

/** The lines shown on sealed brand audio; nothing here promises more than the brand and the shop do. */
export function assuranceLines(gadget: GadgetEntry): Line[] {
  const brand = gadget.original?.brand;
  if (!brand) return [];
  const lines: Line[] = [
    {
      Icon: BadgeCheckIcon,
      title: `100% original ${brand}`,
      body: `Bought from ${brand}'s authorised distributor and sold in the sealed ${brand} box, with our GST invoice.`,
    },
  ];
  if (gadget.warrantyMonths) {
    lines.push({
      Icon: WrenchIcon,
      title: `${warrantyLabel(gadget.warrantyMonths)} ${brand} warranty`,
      body: `Claimed at any ${brand} service centre with the invoice; ${brand} repairs or replaces the unit under its warranty terms.`,
    });
  }
  lines.push(
    {
      Icon: ShieldCheckIcon,
      title: 'Sealed box, no returns',
      body: 'Once the seal is broken the item cannot be returned or exchanged. A wrong or transit-damaged item is replaced; tell us within 48 hours with your unboxing video.',
    },
    {
      Icon: PackageCheckIcon,
      title: 'Packed to travel',
      body: 'Boxed inside a padded outer carton and shipped with tracking, so it arrives the way it left the shop.',
    },
  );
  return lines;
}

/** Original, warranty, returns and packing, under the buy box of sealed brand audio. */
export function GadgetAssurance({ gadget, className }: { gadget: GadgetEntry; className?: string }) {
  const lines = assuranceLines(gadget);
  if (lines.length === 0) return null;
  return (
    <ul aria-label="Original, warranty and returns" className={cn('flex flex-col gap-3 rounded-card bg-brand/8 p-4', className)}>
      {lines.map(({ Icon, title, body }) => (
        <li key={title} className="flex items-start gap-3">
          <Icon className="mt-0.5 size-4.5 shrink-0 text-brand" aria-hidden="true" />
          <p className="text-sm text-fg">
            <strong className="font-bold">{title}.</strong> <span className="text-fg-muted">{body}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
