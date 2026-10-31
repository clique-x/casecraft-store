import { cn } from '@/lib/utils';

type Band = 'ink' | 'paper';

interface AngledDividerProps {
  /** The band above the seam. */
  from: Band;
  /** The band below it. */
  to: Band;
  className?: string;
}

const FILL: Record<Band, string> = {
  ink: 'var(--color-ink-2)',
  paper: 'var(--color-paper)',
};

/**
 * The 6° coral seam between a dark band and the white store: a full-width SVG whose top-right
 * triangle continues the band above, with the diagonal drawn in coral at a constant 3 px.
 */
export function AngledDivider({ from, to, className }: AngledDividerProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 10.5"
      preserveAspectRatio="none"
      className={cn('block w-full', className)}
      style={{ height: 'min(10.5vw, 120px)', backgroundColor: FILL[to] }}
    >
      <polygon points="0,0 100,0 100,10.5" fill={FILL[from]} />
      <line
        x1="0"
        y1="0"
        x2="100"
        y2="10.5"
        stroke="var(--color-accent)"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default AngledDivider;
