'use client';

import { Check, X } from 'lucide-react';
import type { GadgetEntry } from '@/lib/catalog/gadgets';
import { phoneFit } from '@/lib/catalog/phone-fit';
import { useMyPhone } from '@/lib/phone/use-my-phone';
import { cn } from '@/lib/utils';

/** "Fits your Galaxy S25" under a charger or cable, from the visitor's saved or detected phone. */
export function PhoneFitNote({ gadget, className }: { gadget: Pick<GadgetEntry, 'phoneEnd' | 'fastFor'>; className?: string }) {
  const { phone } = useMyPhone();
  const fit = phoneFit(gadget, phone);
  if (!fit) return null;
  const Icon = fit.ok ? Check : X;
  return (
    <p className={cn('flex items-start gap-1.5 text-caption font-semibold', fit.ok ? 'text-success' : 'text-fg-muted', className)}>
      <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{fit.text}</span>
    </p>
  );
}
