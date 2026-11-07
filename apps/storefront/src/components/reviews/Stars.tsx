import { StarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const SLOTS = [0, 1, 2, 3, 4] as const;

/** "4 out of 5 stars", "4.3 out of 5 stars". */
export function ratingLabel(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} out of 5 stars`;
}

interface StarsProps {
  /** 0 to 5; a fraction fills part of the last star. */
  value: number;
  size?: 'sm' | 'md';
  /** Hidden from assistive tech, for when the same rating is already written out next to it. */
  decorative?: boolean;
  className?: string;
}

/** Five outline stars with a coral fill clipped to the rating; announced as "N out of 5 stars". */
export function Stars({ value, size = 'sm', decorative = false, className }: StarsProps) {
  const fill = (Math.min(5, Math.max(0, value)) / 5) * 100;
  const icon = size === 'md' ? 'size-5' : 'size-4';
  return (
    <span
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : ratingLabel(value)}
      aria-hidden={decorative || undefined}
      className={cn('relative inline-flex shrink-0 align-middle', className)}
    >
      <span className="flex gap-0.5 text-fg-muted/50">
        {SLOTS.map((i) => (
          <StarIcon key={i} className={cn(icon, 'shrink-0')} strokeWidth={1.75} aria-hidden="true" />
        ))}
      </span>
      <span className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden text-brand-coral" style={{ width: `${fill}%` }}>
        {SLOTS.map((i) => (
          <StarIcon key={i} className={cn(icon, 'shrink-0 fill-current')} strokeWidth={1.75} aria-hidden="true" />
        ))}
      </span>
    </span>
  );
}
