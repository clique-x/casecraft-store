import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  /** Seconds per loop of one copy. */
  duration?: number;
  gap?: string;
  reverse?: boolean;
  className?: string;
  label?: string;
}

/**
 * Infinite CSS marquee: two copies of the content slide by one copy's width and loop. Server-rendered,
 * pauses on hover, stops under reduced motion (globals.css `.marquee-track`); the second copy is
 * presentational so assistive tech reads the list once.
 */
export function Marquee({ children, duration = 40, gap = '3rem', reverse = false, className, label }: Props) {
  const style = { '--marquee-dur': `${duration}s`, '--marquee-gap': gap } as CSSProperties;
  return (
    <div
      aria-label={label}
      style={style}
      className={cn(
        'marquee group/marquee flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]',
        className,
      )}
    >
      <div className={cn('marquee-track flex shrink-0 items-center', reverse && '[animation-direction:reverse]')}>{children}</div>
      <div aria-hidden="true" className={cn('marquee-track flex shrink-0 items-center', reverse && '[animation-direction:reverse]')}>
        {children}
      </div>
    </div>
  );
}

export default Marquee;
