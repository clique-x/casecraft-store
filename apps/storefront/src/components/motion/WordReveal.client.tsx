'use client';

import { m } from 'motion/react';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { EASE_OUT_EXPO } from '@/lib/motion/tokens';
import { cn } from '@/lib/utils';

interface Props {
  text: string;
  className?: string;
  /** Seconds before the first word rises. */
  delay?: number;
  /** `load` plays once on mount (above the fold); `view` plays the first time it scrolls into view. */
  trigger?: 'load' | 'view';
}

const STAGGER_S = 0.07;
const RISE_S = 0.9;
const EASE: [number, number, number, number] = [...EASE_OUT_EXPO];

/**
 * Masked word-by-word rise: each word sits in an overflow-hidden box and slides up out of it.
 * The server renders the words in place, so the text is readable before hydration; motion only
 * adds the slide. Transforms and opacity only, no filters.
 */
export function WordReveal({ text, className, delay = 0, trigger = 'load' }: Props) {
  const reduced = useReducedMotion();
  const words = text.split(' ');
  if (reduced) return <span className={className}>{text}</span>;

  const inView = trigger === 'view';
  return (
    <span className={cn('inline', className)}>
      <span className="sr-only">{text}</span>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} aria-hidden="true" className="inline-block overflow-hidden pb-[0.08em] align-top">
          <m.span
            className="inline-block will-change-transform"
            initial={{ y: '110%', opacity: 0 }}
            animate={inView ? undefined : { y: 0, opacity: 1 }}
            whileInView={inView ? { y: 0, opacity: 1 } : undefined}
            viewport={inView ? { once: true, margin: '0px 0px -12% 0px' } : undefined}
            transition={{ duration: RISE_S, ease: EASE, delay: delay + i * STAGGER_S }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </m.span>
        </span>
      ))}
    </span>
  );
}

export default WordReveal;
