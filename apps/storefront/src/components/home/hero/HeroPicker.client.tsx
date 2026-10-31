'use client';

import { PhonePicker } from '@/components/phone-picker/PhonePicker';
import type { PhoneModel } from '@/lib/medusa/fixtures';
import { cn } from '@/lib/utils';

interface Props {
  models: PhoneModel[];
  className?: string;
}

const ROOT = '[data-hero-picker]';

/** Focuses the active brand tab of the inline picker and pulses its panel once. */
export function focusHeroPicker(): boolean {
  const root = document.querySelector<HTMLElement>(ROOT);
  if (!root || root.offsetParent === null) return false;
  const target =
    root.querySelector<HTMLElement>('[role="tab"][data-state="active"]') ??
    root.querySelector<HTMLElement>('[role="tab"]') ??
    root.querySelector<HTMLElement>('button');
  target?.focus({ preventScroll: true });
  root.classList.remove('is-pulsed');
  root.addEventListener('animationend', () => root.classList.remove('is-pulsed'), { once: true });
  requestAnimationFrame(() => root.classList.add('is-pulsed'));
  return true;
}

/** Desktop: the phone picker inline in the copy column. */
export function HeroPicker({ models, className }: Props) {
  return (
    <div data-hero-picker="" className={cn('hero-picker rounded-card bg-surface-glass p-4', className)}>
      <PhonePicker models={models} variant="hero" />
    </div>
  );
}
