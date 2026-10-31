'use client';

import dynamic from 'next/dynamic';

const GsapProvider = dynamic(() => import('./GsapProvider'), { ssr: false, loading: () => null });

/** Loads GSAP after hydration so routes without scroll animation never pay for it up front. */
export function GsapMount() {
  return <GsapProvider />;
}

export default GsapMount;
