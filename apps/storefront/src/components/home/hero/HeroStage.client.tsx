'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useMotionValue, useMotionValueEvent, useSpring } from 'motion/react';
import { castFor, getPhoto, photoSrc, srcSetFor } from '@/lib/catalog/photos';
import { useFinePointer } from '@/lib/device/use-fine-pointer';
import { useGyroTilt } from '@/lib/device/use-gyro-tilt';
import { useInView } from '@/lib/device/use-in-view';
import { useMediaQuery } from '@/lib/device/use-media-query';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { autoAdvance, featuredStore, heroState, type ChangeSource } from '@/lib/hero-state';
import { chromeStore } from '@/lib/layout/chrome-store';
import { SPRING_TILT } from '@/lib/motion/tokens';
import { detectSceneTier, getCachedSceneTier, subscribeSceneTier, type SceneTier } from '@/lib/perf/device-tier';
import { useMyPhone } from '@/lib/phone/use-my-phone';
import {
  AUTO_ADVANCE_MS,
  autoLive,
  HERO_COUNT_LG,
  HERO_COUNT_SM,
  HERO_SIZES,
  heroCommands,
  IDLE_AFTER_INTERACTION_MS,
  IDLE_SWAY_MS,
  LG_QUERY,
  markInteraction,
  readAutoOff,
  useChipSelection,
} from './heroBus';
import { loadGsap, useHeroBeats, type GsapBundle } from './useHeroBeats';
import { useHeroScroll } from './useHeroScroll';

interface Props {
  /** Server cast ids, so the store matches the SSR slots before anything moves. */
  castIds: number[];
  /** Model slugs that have a chip on phones; `my_phone` pre-selects one when it matches. */
  chipSlugs: string[];
}

const POINTER_YAW_DEG = 10;
const POINTER_PITCH_DEG = 6;
const GYRO_YAW_DEG = 8;
const GYRO_PITCH_DEG = 5;
const SHEEN_SHIFT_PCT = 18;
const HALO_SHIFT_PCT = 6;
const TICK_MS = 250;

function getServerTier(): SceneTier | null {
  return null;
}

function sameIds(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function requestIdle(cb: () => void, timeout: number): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(() => cb(), { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(cb, 200);
  return () => window.clearTimeout(id);
}

function afterLoadAndIdle(cb: () => void): () => void {
  let cancelIdle: (() => void) | null = null;
  const onLoad = () => {
    cancelIdle = requestIdle(cb, 1500);
  };
  if (document.readyState === 'complete') onLoad();
  else window.addEventListener('load', onLoad, { once: true });
  return () => {
    window.removeEventListener('load', onLoad);
    cancelIdle?.();
  };
}

function gyroAvailable(): boolean {
  if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return false;
  const ctor = window.DeviceOrientationEvent as unknown as { requestPermission?: unknown };
  return typeof ctor.requestPermission !== 'function';
}

function subscribeNoop(): () => void {
  return () => {};
}

function gyroServer(): boolean {
  return false;
}

function haptic(): void {
  try {
    if (/Android/i.test(navigator.userAgent)) navigator.vibrate?.(8);
  } catch {
    /* no haptics */
  }
}

/**
 * The single hero controller. Renders nothing; owns the tier, the cast, beats, scroll,
 * tilt, idle sway, auto-advance, keyboard and image warming over the server markup.
 */
export function HeroStage({ castIds, chipSlugs }: Props) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [section, setSection] = useState<HTMLElement | null>(null);
  const [bundle, setBundle] = useState<GsapBundle | null>(null);

  const attach = useCallback((node: HTMLElement | null) => {
    const el = node?.closest('section') ?? null;
    sectionRef.current = el;
    setSection(el);
  }, []);

  const tier = useSyncExternalStore(subscribeSceneTier, getCachedSceneTier, getServerTier);
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const isLg = useMediaQuery(LG_QUERY);
  const inView = useInView('#hero');
  const { phone } = useMyPhone();
  const chipSel = useChipSelection();

  const motionTier = tier !== null && tier !== 'static' && !reduced;
  const animated = motionTier && bundle !== null;
  const full = tier === 'full' && !reduced;

  useLayoutEffect(() => {
    featuredStore.setCast(castIds);
    chromeStore.setHeroPresent(true);
    return () => chromeStore.setHeroPresent(false);
  }, [castIds]);

  useEffect(() => {
    detectSceneTier();
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!section || !el) return;
    if (tier) el.dataset.tier = tier;
    el.classList.toggle('is-static', !animated);
  }, [section, tier, animated]);

  useEffect(() => {
    if (!motionTier) return;
    let live = true;
    loadGsap().then(
      (b) => {
        if (live) setBundle(b);
      },
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [motionTier]);

  useEffect(() => {
    heroState.inView = inView ?? true;
  }, [inView]);

  const onSettle = useCallback((source: ChangeSource) => {
    if (source === 'user') haptic();
  }, []);

  const beats = useHeroBeats({ section, gsap: bundle?.gsap ?? null, animated, full, isLg, onSettle });
  useHeroScroll(section, bundle, motionTier);

  useEffect(() => heroCommands.register({ beat: beats.beat, goTo: beats.goTo }), [beats]);

  // The DOM may lag a store kept alive across navigations.
  useEffect(() => {
    if (section) beats.sync('auto');
  }, [section, beats]);

  // Cast: desktop follows my_phone, phones follow the chip strip (pre-selected from my_phone).
  const phoneSlug = phone?.slug ?? null;
  const chipDefault = phoneSlug && chipSlugs.includes(phoneSlug) ? phoneSlug : null;
  const filterSlug = isLg ? phoneSlug : chipSel === undefined ? chipDefault : chipSel;
  const prevFilter = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!section) return;
    const ids = castFor(filterSlug)
      .slice(0, isLg ? HERO_COUNT_LG : HERO_COUNT_SM)
      .map((e) => e.id);
    const filterChanged = prevFilter.current !== undefined && prevFilter.current !== filterSlug;
    prevFilter.current = filterSlug;
    if (sameIds(ids, featuredStore.cast())) return;
    beats.setCast(ids, filterChanged ? 'user' : 'auto', !filterChanged);
  }, [section, filterSlug, isLg, beats]);

  // Pointer / gyro tilt through one spring pair; the only writer of --px/--py/--sheen-x/--halo-x.
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const sx = useSpring(tx, SPRING_TILT);
  const sy = useSpring(ty, SPRING_TILT);
  const yawDeg = useRef(POINTER_YAW_DEG);
  const pitchDeg = useRef(POINTER_PITCH_DEG);
  useMotionValueEvent(sx, 'change', (v) => {
    const el = sectionRef.current;
    if (!el) return;
    el.style.setProperty('--py', `${(v * yawDeg.current).toFixed(3)}deg`);
    el.style.setProperty('--sheen-x', `${(v * SHEEN_SHIFT_PCT).toFixed(2)}%`);
    if (full) el.style.setProperty('--halo-x', `${(-0.5 * v * HALO_SHIFT_PCT).toFixed(2)}%`);
  });
  useMotionValueEvent(sy, 'change', (v) => {
    sectionRef.current?.style.setProperty('--px', `${(-v * pitchDeg.current).toFixed(3)}deg`);
  });

  const gyroOk = useSyncExternalStore(subscribeNoop, gyroAvailable, gyroServer);
  const gyroEnabled = !fine && gyroOk && full && inView === true;
  const onTilt = useCallback(
    (tilt: { x: number; y: number }) => {
      tx.set(tilt.x);
      ty.set(tilt.y);
    },
    [tx, ty],
  );
  useGyroTilt(gyroEnabled, onTilt);
  useEffect(() => {
    if (!gyroEnabled) return;
    yawDeg.current = GYRO_YAW_DEG;
    pitchDeg.current = GYRO_PITCH_DEG;
    return () => {
      yawDeg.current = POINTER_YAW_DEG;
      pitchDeg.current = POINTER_PITCH_DEG;
      tx.set(0);
      ty.set(0);
    };
  }, [gyroEnabled, tx, ty]);

  // Fine pointer: tilt toward the cursor; two idle seconds hand the stage to the sway.
  const pointerTilt = fine && motionTier;
  useEffect(() => {
    if (!section || !pointerTilt) return;
    const sway = section.querySelector<HTMLElement>('.hero-sway');
    let idleTimer = 0;
    const armIdle = () => {
      window.clearTimeout(idleTimer);
      if (!full) return;
      idleTimer = window.setTimeout(() => sway?.classList.add('is-idle'), IDLE_SWAY_MS);
    };
    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      heroState.pointer.x = nx;
      heroState.pointer.y = -ny;
      tx.set(Math.max(-1, Math.min(1, nx)));
      ty.set(Math.max(-1, Math.min(1, ny)));
      sway?.classList.remove('is-idle');
      armIdle();
    };
    const onLeave = () => {
      heroState.pointer.x = 0;
      heroState.pointer.y = 0;
      tx.set(0);
      ty.set(0);
      armIdle();
    };
    section.addEventListener('pointermove', onMove, { passive: true });
    section.addEventListener('pointerleave', onLeave, { passive: true });
    armIdle();
    return () => {
      window.clearTimeout(idleTimer);
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      sway?.classList.remove('is-idle');
    };
  }, [section, pointerTilt, full, tx, ty]);

  // Touch without gyro (iOS): the sway alone keeps the light moving.
  const touchSway = !fine && !gyroEnabled && full && inView === true;
  useEffect(() => {
    if (!section || !touchSway) return;
    const sway = section.querySelector<HTMLElement>('.hero-sway');
    sway?.classList.add('is-idle');
    return () => sway?.classList.remove('is-idle');
  }, [section, touchSway]);

  // Auto-advance: self-cancelling for the session on the first deliberate interaction.
  useEffect(() => {
    autoLive.set(motionTier && !readAutoOff());
  }, [motionTier]);
  useEffect(() => {
    if (!section || !motionTier) return;
    let lastAdvance = performance.now();
    const id = window.setInterval(() => {
      if (!autoLive.get()) return;
      const now = performance.now();
      if (!heroState.inView || document.visibilityState !== 'visible') return;
      if (autoAdvance.paused() || heroState.beatActive) return;
      if (now - heroState.lastInteractionAt < IDLE_AFTER_INTERACTION_MS) return;
      if (fine && section.matches(':hover')) return;
      if (section.matches(':focus-within')) return;
      if (now - lastAdvance < AUTO_ADVANCE_MS) return;
      lastAdvance = now;
      beats.beat(1, 'auto');
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [section, motionTier, fine, beats]);

  // Keyboard on the focusable section.
  useEffect(() => {
    if (!section) return;
    const onKey = (e: KeyboardEvent) => {
      // Only the section itself, the hit layer and the dots drive the stage; arrows inside the
      // picker tabs, its model-chip groups, the chips radiogroup or any field keep their own meaning.
      const target = e.target instanceof Element ? e.target : null;
      if (target !== section && !target?.closest('[data-hero-hit], [data-hero-dots]')) return;
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          heroCommands.beat(1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          heroCommands.beat(-1);
          break;
        case 'Home':
          e.preventDefault();
          heroCommands.goTo(0);
          break;
        case 'End':
          e.preventDefault();
          heroCommands.goTo(featuredStore.limit() - 1);
          break;
        case 'Enter': {
          if (e.target !== section) return;
          const item = getPhoto(featuredStore.itemId());
          if (!item) return;
          markInteraction();
          router.push(`/products/${item.slug}`);
          break;
        }
        default:
      }
    };
    section.addEventListener('keydown', onKey);
    return () => section.removeEventListener('keydown', onKey);
  }, [section, router]);

  // Warming: the incoming slot after load + idle, then the rest of the cast in order.
  useEffect(() => {
    if (!section) return;
    return afterLoadAndIdle(() => {
      const rest = beats.warm();
      for (const id of rest) {
        const entry = getPhoto(id);
        if (!entry) continue;
        const img = new Image();
        img.sizes = HERO_SIZES;
        img.srcset = srcSetFor(entry);
        img.src = photoSrc(id, 480);
      }
    });
  }, [section, beats]);

  return <span ref={attach} hidden data-hero-stage="" />;
}
