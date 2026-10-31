'use client';

import { useLayoutEffect, useRef, useSyncExternalStore, type CSSProperties } from 'react';
import { photoSrc, srcSetFor, type PhotoEntry } from '@/lib/catalog/photos';
import { getCachedSceneTier, subscribeSceneTier, type SceneTier } from '@/lib/perf/device-tier';
import { CaseCutout } from './CaseCutout';
import { CaseSheen } from './CaseSheen.client';
import { HERO_SIZES } from './heroBus';

export type SlotRole = 'front' | 'backstage' | 'incoming';
export type SlotId = 'a' | 'b' | 'c';

interface Props {
  entry: PhotoEntry;
  role: SlotRole;
  slot: SlotId;
}

function getServerTier(): SceneTier | null {
  return null;
}

/**
 * One of the three rig slots: the cutout, its reflection (the same bitmap flipped under the floor,
 * so it costs no bytes) and a contact shadow. Markup is identical on the server and the first client
 * render; the controller later swaps `src`, `data-role` and `--ar` imperatively, which React leaves
 * alone because these props never change.
 */
export function HeroSlot({ entry, role, slot }: Props) {
  const liftRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const tier = useSyncExternalStore(subscribeSceneTier, getCachedSceneTier, getServerTier);

  useLayoutEffect(() => {
    imgRef.current = liftRef.current?.querySelector('img') ?? null;
  }, []);

  const style = { '--ar': `${entry.imageW / entry.imageH}` } as CSSProperties;
  const deferred = role === 'incoming';
  const src = photoSrc(entry.id, 480);
  const reflectSource = deferred ? { 'data-src': src, 'data-srcset': srcSetFor(entry) } : { src, srcSet: srcSetFor(entry) };

  return (
    <div className="hero-case" data-slot={slot} data-role={role} data-cut={entry.cut} data-id={entry.id} style={style}>
      <div ref={liftRef} className="hero-case-lift">
        <CaseCutout
          entry={entry}
          role="hero"
          sizes={HERO_SIZES}
          priority={role === 'front'}
          deferred={deferred}
          imgProps={role === 'backstage' ? { loading: 'eager' } : undefined}
        />
        <span className="hero-contact" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element -- same candidate as the cutout above, served from cache */}
        <img
          {...reflectSource}
          sizes={HERO_SIZES}
          width={entry.imageW}
          height={entry.imageH}
          alt=""
          aria-hidden="true"
          decoding="async"
          loading="lazy"
          fetchPriority="low"
          draggable={false}
          className="hero-reflect"
        />
        <CaseSheen imgRef={imgRef} enabled={tier === 'full'} />
      </div>
    </div>
  );
}
