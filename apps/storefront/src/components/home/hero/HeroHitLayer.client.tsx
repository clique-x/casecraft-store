'use client';

import { useCallback, useEffect, useState, useSyncExternalStore, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatInr } from '@/lib/catalog/photos';
import { useFinePointer } from '@/lib/device/use-fine-pointer';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { itemAt, useFeaturedIndex, useFeaturedItem } from '@/lib/hero-state';
import { getCachedSceneTier, subscribeSceneTier, type SceneTier } from '@/lib/perf/device-tier';
import { heroCommands } from './heroBus';
import { loadGsap, type GsapModule } from './useHeroBeats';
import { useStageGestures } from './useStageGestures';

function getServerTier(): SceneTier | null {
  return null;
}

function frontSlot(): HTMLElement | null {
  return document.querySelector<HTMLElement>('#hero .hero-case[data-role="front"]');
}

/**
 * Real controls over the case boxes: a link over the front cover, a button over the
 * backstage one. Same geometry source as the slots, no 3D, `touch-action: pan-y`.
 */
export function HeroHitLayer() {
  const item = useFeaturedItem();
  const index = useFeaturedIndex();
  const next = itemAt(index + 1);
  const router = useRouter();
  const tier = useSyncExternalStore(subscribeSceneTier, getCachedSceneTier, getServerTier);
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const [gsapMod, setGsapMod] = useState<GsapModule | null>(null);

  const motionTier = tier !== null && tier !== 'static' && !reduced;
  useEffect(() => {
    if (!motionTier) return;
    let live = true;
    loadGsap().then(
      (b) => {
        if (live) setGsapMod(b.gsap);
      },
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [motionTier]);

  useEffect(() => {
    router.prefetch(`/products/${item.slug}`);
  }, [item.slug, router]);

  const beat = useCallback((dir: 1 | -1) => heroCommands.beat(dir, 'user'), []);
  const gestures = useStageGestures({
    beat,
    frontEntry: item,
    getFrontSlot: frontSlot,
    gsap: gsapMod,
    holdEnabled: motionTier && gsapMod !== null,
  });

  const hoverLift = fine && tier === 'full' && !reduced;
  const setLift = (on: boolean) => {
    if (!hoverLift) return;
    const section = document.getElementById('hero');
    if (!section) return;
    if (on) {
      frontSlot()?.querySelector('.hero-case-lift')?.classList.add('is-lifted');
      section.dataset.hover = '';
      return;
    }
    // Every slot, not only the front: a beat mid-hover may have moved the lifted slot off the front role.
    for (const lift of section.querySelectorAll('.hero-case-lift')) lift.classList.remove('is-lifted');
    delete section.dataset.hover;
  };

  // The lift belongs to the front only: when the front changes mid-hover it moves with it.
  useEffect(() => {
    const section = document.getElementById('hero');
    if (!section) return;
    const front = frontSlot();
    for (const lift of section.querySelectorAll('.hero-case-lift')) {
      if (!front?.contains(lift)) lift.classList.remove('is-lifted');
    }
    if (hoverLift && section.dataset.hover !== undefined) front?.querySelector('.hero-case-lift')?.classList.add('is-lifted');
  }, [item.id, hoverLift]);

  const frontStyle = { '--ar': `${item.imageW / item.imageH}` } as CSSProperties;
  const backStyle = { '--ar': `${next.imageW / next.imageH}` } as CSSProperties;

  return (
    <div className="pointer-events-none absolute inset-0 z-[3]" data-hero-hit="">
      <Link
        href={`/products/${item.slug}`}
        prefetch={false}
        aria-label={`${item.design} · ${item.brand} ${item.series}, ${formatInr(item.priceInr)}, view cover`}
        className="hero-hit hero-hit-front pointer-events-auto"
        style={frontStyle}
        draggable={false}
        {...gestures.front}
        onPointerEnter={() => setLift(true)}
        onPointerLeave={(e) => {
          setLift(false);
          gestures.front.onPointerLeave(e);
        }}
      />
      {next.id !== item.id ? (
        <button
          type="button"
          aria-label={`Show next cover: ${next.design}`}
          className="hero-hit hero-hit-back pointer-events-auto"
          style={backStyle}
          {...gestures.back}
        />
      ) : null}
    </div>
  );
}
