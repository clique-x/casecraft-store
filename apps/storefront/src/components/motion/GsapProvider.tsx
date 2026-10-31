'use client';

import { useEffect, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

let registered = false;

/** Idempotent; modules that create tweens call it instead of registering plugins themselves. */
export function registerGsap(): void {
  if (registered || typeof window === 'undefined') return;
  registered = true;
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

registerGsap();

export function GsapProvider({ children }: { children?: ReactNode }) {
  useEffect(() => {
    registerGsap();
    const refresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(refresh, () => undefined);
    window.addEventListener('orientationchange', refresh, { passive: true });
    return () => window.removeEventListener('orientationchange', refresh);
  }, []);

  return <>{children}</>;
}

export default GsapProvider;
