'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useHeroPresent } from '@/lib/layout/chrome-store';

interface HeaderScrollStateProps {
  solid?: boolean;
  className?: string;
  children: ReactNode;
}

const THRESHOLD_PX = 24;

/** Sets data-scrolled (solid styling) and data-past (the announcement bar has scrolled away). */
export function HeaderScrollState({ solid = false, className, children }: HeaderScrollStateProps) {
  const [scrolled, setScrolled] = useState(false);
  const heroPresent = useHeroPresent(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > THRESHOLD_PX);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      data-site-header=""
      data-scrolled={scrolled || solid || !heroPresent ? '' : undefined}
      data-past={scrolled ? '' : undefined}
      className={className}
    >
      {children}
    </header>
  );
}

export default HeaderScrollState;
