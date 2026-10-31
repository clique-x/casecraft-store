'use client';

import { ChevronDown, Smartphone } from 'lucide-react';
import { useMyPhone } from '@/lib/phone/use-my-phone';
import { pickerSheet } from '@/lib/phone/picker-sheet-store';
import { cn } from '@/lib/utils';

export function MyPhoneChip({ className }: { className?: string }) {
  const { phone } = useMyPhone();
  return (
    <button
      type="button"
      onClick={() => pickerSheet.open()}
      aria-haspopup="dialog"
      aria-label={phone ? `My phone: ${phone.model}. Change phone` : 'Select your phone'}
      className={cn(
        'inline-flex h-10 min-w-0 items-center gap-2 rounded-pill border border-fg-on-ink/15 bg-surface-glass px-3 text-sm font-medium text-fg-on-ink transition-colors duration-(--dur-micro) hover:border-fg-on-ink/30 hover:bg-fg-on-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2',
        phone && 'border-accent-2/60',
        className,
      )}
    >
      <Smartphone className="size-4 shrink-0" aria-hidden="true" />
      <span className="max-w-24 truncate sm:max-w-44">{phone ? phone.model : 'My phone'}</span>
      <ChevronDown className="hidden size-3.5 shrink-0 opacity-70 sm:block" aria-hidden="true" />
    </button>
  );
}

export default MyPhoneChip;
