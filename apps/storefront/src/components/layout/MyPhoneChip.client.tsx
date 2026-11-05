'use client';

import { Smartphone } from 'lucide-react';
import { useMyPhone } from '@/lib/phone/use-my-phone';
import { pickerSheet } from '@/lib/phone/picker-sheet-store';
import { cn } from '@/lib/utils';

/**
 * "Find my device": opens the phone picker sheet. A pill with its label from lg, a round icon below lg.
 * Once a phone is picked, the pill shows that model instead.
 */
export function MyPhoneChip({ className }: { className?: string }) {
  const { phone } = useMyPhone();
  return (
    <button
      type="button"
      onClick={() => pickerSheet.open()}
      aria-haspopup="dialog"
      data-device-chip=""
      aria-label={phone ? `My phone: ${phone.model}. Change phone` : 'Find my device'}
      className={cn(
        'relative inline-flex size-11 min-w-0 shrink-0 items-center justify-center gap-2 rounded-pill text-sm font-semibold transition-colors duration-(--dur-micro) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:w-auto lg:border lg:px-4',
        'text-gh-ink hover:bg-gh-ink/5 lg:border-gh-ink/20 lg:hover:border-gh-ink/35',
        'over-hero:text-white over-hero:hover:bg-white/10',
        className,
      )}
    >
      <Smartphone className="size-5 shrink-0 lg:size-4" aria-hidden="true" />
      <span className="hidden max-w-40 truncate lg:inline">{phone ? phone.model : 'Find my device'}</span>
      {phone && <span aria-hidden="true" className="absolute top-2 right-2 size-2 rounded-full bg-brand ring-2 ring-gh-ivory lg:hidden" />}
    </button>
  );
}

export default MyPhoneChip;
