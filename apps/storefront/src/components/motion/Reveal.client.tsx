'use client';

import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li';
}

// Elements already inside the first viewport never get hidden, so the SSR paint
// is untouched and there is no flash before hydration.
export function Reveal({ children, delay = 0, className, as = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const setRef = useCallback((node: HTMLElement | null) => {
    ref.current = node;
  }, []);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    el.classList.add('reveal');
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        el.classList.add('reveal-in');
        io.disconnect();
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.classList.remove('reveal', 'reveal-in');
    };
  }, [reduced]);

  const style: CSSProperties | undefined = delay ? { transitionDelay: `${delay}s` } : undefined;
  const Tag = as;
  return (
    <Tag ref={setRef} className={className} style={style} data-reveal="">
      {children}
    </Tag>
  );
}

export default Reveal;
