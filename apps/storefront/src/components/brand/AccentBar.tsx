import { cn } from '@/lib/utils';

interface AccentBarProps {
  className?: string;
}

/** The 48×3 coral rule that sits 16 px under an h1/h2. */
export function AccentBar({ className }: AccentBarProps) {
  return <span aria-hidden="true" className={cn('accent-bar', className)} />;
}

export default AccentBar;
