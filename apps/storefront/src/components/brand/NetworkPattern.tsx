import { cn } from '@/lib/utils';

type Corner = 'tl' | 'tr' | 'bl' | 'br';

interface NetworkPatternProps {
  corner?: Corner;
  opacity?: number;
  className?: string;
}

const WIDTH = 320;
const HEIGHT = 220;

// Nine nodes, ten lines, hand-placed so no two lines cross.
const NODES: readonly [number, number][] = [
  [40, 40],
  [120, 24],
  [210, 52],
  [290, 30],
  [70, 120],
  [160, 110],
  [250, 130],
  [110, 190],
  [230, 196],
];
const CORAL_NODE = 5;
const LINES: readonly [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [0, 4],
  [1, 5],
  [2, 6],
  [4, 5],
  [5, 6],
  [4, 7],
  [6, 8],
];

const CORNER_CLASS: Record<Corner, string> = {
  tl: 'top-0 left-0',
  tr: 'top-0 right-0',
  bl: 'bottom-0 left-0',
  br: 'right-0 bottom-0',
};

/** Decorative node network in Teal Bright with one coral node; 320×220, pointer-transparent. */
export function NetworkPattern({ corner = 'tr', opacity = 0.3, className }: NetworkPatternProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      className={cn('net-pattern', CORNER_CLASS[corner], className)}
      style={{ opacity }}
    >
      <g stroke="currentColor" strokeWidth="1" fill="none">
        {LINES.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} />
        ))}
      </g>
      {NODES.map(([x, y], i) =>
        i === CORAL_NODE ? (
          <circle key={i} cx={x} cy={y} r="4" fill="var(--color-accent)" />
        ) : (
          <circle key={i} cx={x} cy={y} r="3" fill="var(--color-ink-2)" stroke="currentColor" strokeWidth="1" />
        ),
      )}
    </svg>
  );
}

export default NetworkPattern;
