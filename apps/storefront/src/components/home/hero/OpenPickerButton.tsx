'use client';

import type { ReactNode } from 'react';
import { OpenSheetButton } from '@/components/home/StickyPhoneCta.client';

interface Props {
  children?: ReactNode;
  className?: string;
}

/** Hero primary CTA: opens the phone picker sheet and warms its chunk on hover/focus. */
export function OpenPickerButton({ children = 'Select your phone', className }: Props) {
  return (
    <OpenSheetButton
      className={`pointer-events-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2 ${className ?? ''}`}
    >
      {children}
    </OpenSheetButton>
  );
}
