'use client';

import { useEffect, useLayoutEffect, useMemo, type MouseEvent, type PointerEvent } from 'react';
import type { PhotoEntry } from '@/lib/catalog/photos';
import { markInteraction } from './heroBus';
import type { GsapModule } from './useHeroBeats';

type Mode = 'pending' | 'swipe' | 'scroll' | 'hold' | 'scrub';

interface Gesture {
  id: number;
  x: number;
  y: number;
  t: number;
  mode: Mode;
  timer: number;
  frames: HTMLImageElement[];
  frameIndex: number;
}

export interface GestureHandlers<E extends Element> {
  onPointerDown: (e: PointerEvent<E>) => void;
  onPointerMove: (e: PointerEvent<E>) => void;
  onPointerUp: (e: PointerEvent<E>) => void;
  onPointerCancel: (e: PointerEvent<E>) => void;
  onPointerLeave: (e: PointerEvent<E>) => void;
  onLostPointerCapture: (e: PointerEvent<E>) => void;
  onClick: (e: MouseEvent<E>) => void;
}

export interface GestureOptions {
  beat: (dir: 1 | -1) => void;
  frontEntry: PhotoEntry;
  getFrontSlot: () => HTMLElement | null;
  gsap: GsapModule | null;
  /** Hold-to-angle needs the beat engine; off on the static tier and under reduced motion. */
  holdEnabled: boolean;
}

export interface StageGestures {
  front: GestureHandlers<HTMLAnchorElement>;
  back: GestureHandlers<HTMLButtonElement>;
  setOptions(next: GestureOptions): void;
  /** Ends any gesture in flight and clears its hold timer. */
  dispose(): void;
}

const SLOP_PX = 8;
const SWIPE_PX = 40;
const TAP_MS = 250;
const HOLD_MS = 300;
const AXIS_BIAS = 1.2;
const SCRUB_STEP_PX = 28;
const HOLD_DEG = 22;

function liftOf(slot: HTMLElement | null): HTMLElement | null {
  return slot?.querySelector<HTMLElement>('.hero-case-lift') ?? null;
}

/** The gesture machine, outside React: one pointer at a time, state in closure scope. */
function createStageGestures(initial: GestureOptions): StageGestures {
  let opts = initial;
  const getOpts = () => opts;
  let gesture: Gesture | null = null;
  let suppressClick = false;

  const clearTimer = (g: Gesture) => {
    if (g.timer) window.clearTimeout(g.timer);
    g.timer = 0;
  };

  const tiltTo = (deg: number, duration: number, clear: boolean) => {
    const { getFrontSlot, gsap } = getOpts();
    const slot = getFrontSlot();
    if (!slot || !gsap) return;
    gsap.to(slot, {
      '--cry': `${deg}deg`,
      duration,
      ease: 'power2.out',
      overwrite: 'auto',
      onComplete: clear ? () => slot.style.removeProperty('--cry') : undefined,
    });
  };

  const startScrub = (g: Gesture) => {
    const { getFrontSlot, frontEntry } = getOpts();
    const lift = liftOf(getFrontSlot());
    const angles = frontEntry.angles ?? [];
    if (!lift || angles.length === 0) return false;
    g.frames = angles.map((src) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      img.alt = '';
      img.className = 'hero-frame';
      lift.appendChild(img);
      return img;
    });
    lift.dataset.scrub = '';
    g.frameIndex = 0;
    g.frames[0]?.setAttribute('data-active', '');
    return true;
  };

  const endScrub = (g: Gesture) => {
    const lift = liftOf(getOpts().getFrontSlot());
    for (const img of g.frames) img.remove();
    g.frames = [];
    lift?.removeAttribute('data-scrub');
  };

  const setFrame = (g: Gesture, dx: number) => {
    const n = g.frames.length;
    if (n === 0) return;
    const next = Math.min(n - 1, Math.max(0, Math.round(dx / SCRUB_STEP_PX)));
    if (next === g.frameIndex) return;
    g.frames[g.frameIndex]?.removeAttribute('data-active');
    g.frames[next]?.setAttribute('data-active', '');
    g.frameIndex = next;
  };

  const finish = (g: Gesture) => {
    clearTimer(g);
    if (g.mode === 'hold') tiltTo(0, 0.3, true);
    if (g.mode === 'scrub') endScrub(g);
    gesture = null;
  };

  const capture = (el: Element, pointerId: number) => {
    try {
      el.setPointerCapture(pointerId);
    } catch {
      /* pointer capture is optional */
    }
  };

  // The pointer left or capture was lost before pointerup: end everything but a captured swipe.
  const abandon = (e: PointerEvent<Element>) => {
    const g = gesture;
    if (!g || g.id !== e.pointerId || g.mode === 'swipe') return;
    finish(g);
    suppressClick = true;
  };

  const make = <E extends HTMLElement>(kind: 'front' | 'back'): GestureHandlers<E> => ({
    onPointerDown: (e) => {
      if (gesture) return;
      suppressClick = false;
      const g: Gesture = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        t: e.timeStamp,
        mode: 'pending',
        timer: 0,
        frames: [],
        frameIndex: 0,
      };
      gesture = g;
      // Touch pointers are captured implicitly; mouse and pen need it so pointerup arrives off-target.
      if (e.pointerType !== 'touch') capture(e.currentTarget, e.pointerId);
      if (!getOpts().holdEnabled) return;
      g.timer = window.setTimeout(() => {
        g.timer = 0;
        if (gesture !== g || g.mode !== 'pending') return;
        markInteraction();
        if (startScrub(g)) {
          g.mode = 'scrub';
        } else {
          g.mode = 'hold';
          tiltTo(HOLD_DEG, 0.4, false);
        }
      }, HOLD_MS);
    },
    onPointerMove: (e) => {
      const g = gesture;
      if (!g || g.id !== e.pointerId) return;
      const dx = e.clientX - g.x;
      const dy = e.clientY - g.y;
      if (g.mode === 'scrub') {
        setFrame(g, dx);
        return;
      }
      if (g.mode !== 'pending') return;
      if (Math.hypot(dx, dy) <= SLOP_PX) return;
      clearTimer(g);
      if (Math.abs(dx) > Math.abs(dy) * AXIS_BIAS) {
        g.mode = 'swipe';
        capture(e.currentTarget, e.pointerId);
      } else {
        g.mode = 'scroll';
      }
    },
    onPointerUp: (e) => {
      const g = gesture;
      if (!g || g.id !== e.pointerId) return;
      const dx = e.clientX - g.x;
      const dy = e.clientY - g.y;
      const mode = g.mode;
      finish(g);
      if (mode === 'swipe') {
        suppressClick = true;
        if (Math.abs(dx) >= SWIPE_PX) {
          markInteraction();
          getOpts().beat(dx < 0 ? 1 : -1);
        }
        return;
      }
      if (mode === 'hold' || mode === 'scrub' || mode === 'scroll') {
        suppressClick = true;
        return;
      }
      const tap = e.timeStamp - g.t <= TAP_MS && Math.hypot(dx, dy) <= SLOP_PX;
      if (!tap) {
        suppressClick = true;
        return;
      }
      if (kind === 'back') {
        suppressClick = true;
        markInteraction();
        getOpts().beat(1);
      }
    },
    onPointerCancel: (e) => {
      const g = gesture;
      if (!g || g.id !== e.pointerId) return;
      finish(g);
      suppressClick = true;
    },
    onPointerLeave: abandon,
    onLostPointerCapture: abandon,
    onClick: (e) => {
      if (suppressClick) {
        e.preventDefault();
        suppressClick = false;
        return;
      }
      if (kind === 'back') {
        // Keyboard activation (no pointer sequence): advance.
        markInteraction();
        getOpts().beat(1);
      }
    },
  });

  return {
    front: make<HTMLAnchorElement>('front'),
    back: make<HTMLButtonElement>('back'),
    setOptions(next) {
      opts = next;
    },
    dispose() {
      if (gesture) finish(gesture);
    },
  };
}

/**
 * Swipe vs scroll vs hold on the hit layer. Horizontal drags beat, vertical drags scroll
 * (`touch-action: pan-y` plus an axis lock), a 300 ms hold tilts the flat photo or scrubs
 * angle frames, and a clean tap on the front link navigates.
 */
export function useStageGestures(opts: GestureOptions): StageGestures {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- created once; options are pushed in below
  const machine = useMemo(() => createStageGestures(opts), []);
  useLayoutEffect(() => {
    machine.setOptions(opts);
  });
  useEffect(() => () => machine.dispose(), [machine]);
  return machine;
}
