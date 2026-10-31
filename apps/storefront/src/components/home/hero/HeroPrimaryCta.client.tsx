'use client';

import Link from 'next/link';
import { m } from 'motion/react';
import { ArrowRightIcon } from 'lucide-react';
import { phoneHref } from '@/components/phone-picker/BrandOutline';
import { useMediaQuery } from '@/lib/device/use-media-query';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { DUR, EASE_OUT_EXPO } from '@/lib/motion/tokens';
import { pickerSheet } from '@/lib/phone/picker-sheet-store';
import { useMyPhone } from '@/lib/phone/use-my-phone';
import { cn } from '@/lib/utils';
import { LG_QUERY } from './heroBus';
import { focusHeroPicker } from './HeroPicker.client';
import { OpenPickerButton } from './OpenPickerButton';

interface Props {
  className?: string;
}

export const PRIMARY_CTA =
  'inline-flex min-h-13 items-center justify-center gap-2 rounded-pill bg-accent px-6 py-2 text-center font-sans text-[1.1875rem] leading-tight font-bold whitespace-normal text-on-accent transition-colors duration-(--dur-micro) hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2';

/**
 * The coral button. Phones open the picker sheet, desktop focuses the inline picker;
 * once `my_phone` exists every instance becomes "Covers for {model} →".
 */
export function HeroPrimaryCta({ className }: Props) {
  const { phone } = useMyPhone();
  const isLg = useMediaQuery(LG_QUERY);
  const reduced = useReducedMotion();

  if (phone) {
    return (
      <m.span
        key={phone.slug}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, scale: reduced ? 1 : [1, 1.04, 1] }}
        transition={{ duration: DUR.ui, ease: [...EASE_OUT_EXPO] }}
        className={cn('inline-flex', className)}
      >
        <Link href={phoneHref(phone)} className={cn(PRIMARY_CTA, 'w-full')}>
          Covers for {phone.model}
          <ArrowRightIcon className="size-5" aria-hidden="true" />
        </Link>
      </m.span>
    );
  }

  if (isLg) {
    return (
      <button
        type="button"
        className={cn(PRIMARY_CTA, className)}
        onClick={() => {
          if (!focusHeroPicker()) pickerSheet.open();
        }}
      >
        Select your phone
      </button>
    );
  }

  return <OpenPickerButton className={cn(PRIMARY_CTA, className)} />;
}
