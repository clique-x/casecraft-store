'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { m, useMotionValue, useMotionValueEvent, useSpring } from 'motion/react';
import { CaseCutout } from '@/components/home/hero/CaseCutout';
import { CaseSheen } from '@/components/home/hero/CaseSheen.client';
import { Ledge } from '@/components/home/hero/Ledge';
import type { PhotoEntry } from '@/lib/catalog/photos';
import { useFinePointer } from '@/lib/device/use-fine-pointer';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { SPRING_TILT } from '@/lib/motion/tokens';
import { detectSceneTier, getCachedSceneTier, subscribeSceneTier, type SceneTier } from '@/lib/perf/device-tier';
import { cn } from '@/lib/utils';

const MAX_YAW_DEG = 10;
const MAX_PITCH_DEG = 6;
const HOLD_YAW_DEG = 22;
const KEY_YAW_DEG = 22;
const HOLD_MS = 300;
const SLOP_PX = 8;
const AXIS_LOCK = 1.2;
const SCRUB_STEP_PX = 28;
const KEY_RETURN_MS = 900;
const SHEEN_RANGE_PCT = 18;
const SIZES = '(min-width: 64rem) 560px, 90vw';

type GestureMode = 'pending' | 'tilt' | 'hold' | 'scrub' | 'scroll';

interface Gesture {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  startFrame: number;
  mode: GestureMode;
  timer: number;
}

type StageVars = CSSProperties & Record<'--ar' | '--tuck' | '--ledge-y' | '--case-h', string>;

interface PhotoStageProps {
  entry: PhotoEntry;
  /** Product title for the accessible name. */
  title: string;
  className?: string;
}

function getServerTier(): SceneTier | null {
  return null;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * CSS stage for photographed covers: the cutout stands behind a ledge on the ink glow,
 * tilts with the pointer (hover on fine pointers, press-and-drag on touch), turns to an
 * angle on hold, scrubs turntable frames when the entry has `angles`, and answers the
 * arrow keys. Flat layers only; nothing here imports three.
 */
export function PhotoStage({ entry, title, className }: PhotoStageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const caseRef = useRef<HTMLDivElement>(null);
  const imgBoxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const keyTimer = useRef(0);

  const finePointer = useFinePointer();
  const reducedMotion = useReducedMotion();
  const tier = useSyncExternalStore(subscribeSceneTier, getCachedSceneTier, getServerTier);
  useEffect(() => {
    detectSceneTier();
  }, []);

  const angles = useMemo(() => entry.angles ?? [], [entry.angles]);
  const hasAngles = angles.length > 1;
  const [frame, setFrame] = useState(-1);
  const [framesWarm, setFramesWarm] = useState(false);

  // Adjust state on prop change during render: a new entry starts on its front view.
  const [trackedId, setTrackedId] = useState(entry.id);
  if (trackedId !== entry.id) {
    setTrackedId(entry.id);
    setFrame(-1);
    setFramesWarm(false);
  }
  const tiltEnabled = !reducedMotion;
  const sheenEnabled = tier === 'full' && !reducedMotion && frame < 0;

  const yaw = useMotionValue(0);
  const pitch = useMotionValue(0);
  const rotateY = useSpring(yaw, SPRING_TILT);
  const rotateX = useSpring(pitch, SPRING_TILT);
  useMotionValueEvent(rotateY, 'change', (v) => {
    caseRef.current?.style.setProperty('--sheen-x', `${((v / MAX_YAW_DEG) * SHEEN_RANGE_PCT).toFixed(2)}%`);
  });

  // CaseSheen wants the image element; the cutout owns the <img>, so it is looked up once per entry.
  useLayoutEffect(() => {
    imgRef.current = imgBoxRef.current?.querySelector('img') ?? null;
  }, [entry.id]);

  const rest = useCallback(() => {
    yaw.set(0);
    pitch.set(0);
  }, [yaw, pitch]);

  const warmFrames = useCallback(() => {
    if (framesWarm) return;
    for (const src of angles) {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
    }
    setFramesWarm(true);
  }, [angles, framesWarm]);

  const showFrame = useCallback(
    (index: number) => {
      setFrame(clamp(index, 0, angles.length - 1));
    },
    [angles.length],
  );

  const clearGesture = useCallback(() => {
    const g = gesture.current;
    if (!g) return;
    window.clearTimeout(g.timer);
    try {
      rootRef.current?.releasePointerCapture(g.id);
    } catch {
      /* already released */
    }
    gesture.current = null;
  }, []);

  useEffect(
    () => () => {
      clearGesture();
      window.clearTimeout(keyTimer.current);
    },
    [clearGesture],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || gesture.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const startFrame = frame >= 0 ? frame : Math.floor((angles.length - 1) / 2);
    const timer = window.setTimeout(() => {
      const g = gesture.current;
      if (!g || g.mode !== 'pending') return;
      if (hasAngles) {
        g.mode = 'scrub';
        g.startFrame = startFrame;
        warmFrames();
        showFrame(startFrame);
        try {
          rootRef.current?.setPointerCapture(g.id);
        } catch {
          /* capture may be refused */
        }
      } else {
        g.mode = 'hold';
        if (tiltEnabled) yaw.set(HOLD_YAW_DEG);
      }
    }, HOLD_MS);
    gesture.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height,
      startFrame,
      mode: 'pending',
      timer,
    };
    // Mouse and pen: capture now so a release outside the stage still ends the gesture. Touch is captured implicitly.
    if (e.pointerType !== 'touch') {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* capture may be refused */
      }
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g) {
      if (!finePointer || !tiltEnabled) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      yaw.set(clamp(nx, -1, 1) * MAX_YAW_DEG);
      pitch.set(-clamp(ny, -1, 1) * MAX_PITCH_DEG);
      return;
    }
    if (g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;

    if (g.mode === 'pending') {
      if (Math.hypot(dx, dy) <= SLOP_PX) return;
      window.clearTimeout(g.timer);
      if (Math.abs(dx) > Math.abs(dy) * AXIS_LOCK) {
        g.mode = hasAngles ? 'scrub' : 'tilt';
        if (g.mode === 'scrub') {
          warmFrames();
          showFrame(g.startFrame);
        }
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* capture may be refused */
        }
      } else {
        g.mode = 'scroll';
      }
      return;
    }
    if (g.mode === 'tilt' && tiltEnabled) {
      yaw.set(clamp(dx / (g.width * 0.5), -1, 1) * MAX_YAW_DEG);
      pitch.set(-clamp(dy / (g.height * 0.5), -1, 1) * MAX_PITCH_DEG);
    } else if (g.mode === 'scrub') {
      showFrame(g.startFrame + Math.round(dx / SCRUB_STEP_PX));
    }
  };

  const endGesture = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const mode = g.mode;
    clearGesture();
    if (mode === 'tilt' || mode === 'hold') rest();
  };

  // Capture moving from the cutout <img> to the stage fires lostpointercapture on the child; only the stage's own loss ends the gesture.
  const onLostPointerCapture = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) endGesture(e);
  };

  const onPointerLeave = () => {
    if (gesture.current) return;
    rest();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    if (hasAngles) {
      warmFrames();
      const current = frame >= 0 ? frame : Math.floor((angles.length - 1) / 2);
      showFrame(current + dir);
      return;
    }
    if (!tiltEnabled) return;
    yaw.set(dir * KEY_YAW_DEG);
    window.clearTimeout(keyTimer.current);
    keyTimer.current = window.setTimeout(rest, KEY_RETURN_MS);
  };

  const ar = entry.imageW / entry.imageH;
  const faded = entry.cut === 'faded';
  // Container units: the case fills 72% of the stage height unless its width would pass 86% of the stage.
  const vars: StageVars = {
    '--ar': ar.toFixed(4),
    '--ledge-y': '84cqh',
    '--case-h': 'min(72cqh, calc(86cqw / var(--ar)))',
    '--tuck': faded ? 'calc(var(--case-h) * 0.07)' : 'calc(var(--case-h) * -0.015)',
    touchAction: 'pan-y',
  };

  const hint = hasAngles
    ? finePointer
      ? 'Drag to turn'
      : 'Hold and drag to turn'
    : finePointer
      ? 'Move to tilt'
      : 'Press and drag to tilt';
  const label = hasAngles
    ? `${title} photo. Use the left and right arrow keys to turn it.`
    : `${title} photo. Use the left and right arrow keys to tilt it.`;

  return (
    <div
      ref={rootRef}
      id="product-viewer"
      tabIndex={0}
      role="group"
      aria-label={label}
      data-tier={tier ?? undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onLostPointerCapture={onLostPointerCapture}
      onPointerLeave={onPointerLeave}
      onKeyDown={onKeyDown}
      className={cn(
        'stage-glow relative isolate aspect-[4/5] max-h-[60svh] w-full overflow-hidden rounded-card bg-ink text-fg-on-ink outline-none select-none [container-type:size] [perspective:1200px] [perspective-origin:50%_40%] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-2 lg:aspect-[7/8] lg:max-h-none',
        className,
      )}
      style={vars}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute z-0 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-accent-2)_28%,transparent),transparent)]"
        style={{
          left: '50%',
          top: 'calc(var(--ledge-y) - var(--case-h) * 0.5)',
          width: 'calc(var(--case-h) * var(--ar) * 1.4)',
        }}
      />

      {!faded && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-[1] h-3 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(50%_50%_at_50%_50%,color-mix(in_srgb,var(--color-ink)_75%,transparent),transparent_70%)]"
          style={{ left: '50%', top: 'var(--ledge-y)', width: 'calc(var(--case-h) * var(--ar) * 0.7)' }}
        />
      )}

      <m.div
        ref={caseRef}
        aria-hidden="true"
        className="absolute z-[1] origin-bottom will-change-transform"
        style={{
          left: '50%',
          top: 'calc(var(--ledge-y) + var(--tuck) - var(--case-h))',
          height: 'var(--case-h)',
          aspectRatio: 'var(--ar)',
          x: '-50%',
          rotateX,
          rotateY,
        }}
      >
        <div
          ref={imgBoxRef}
          className="relative size-full transition-opacity duration-(--dur-micro)"
          style={{ opacity: frame >= 0 ? 0 : 1 }}
        >
          <CaseCutout
            entry={entry}
            role="upclose"
            sizes={SIZES}
            priority
            className="size-full"
            imgProps={{ draggable: false, className: 'size-full object-contain' }}
          />
          <CaseSheen imgRef={imgRef} enabled={sheenEnabled} />
        </div>

        {hasAngles && framesWarm
          ? angles.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- turntable frames are a fixed URL list swapped by index; no optimiser, no srcset.
              <img
                key={src}
                src={src}
                alt=""
                width={entry.imageW}
                height={entry.imageH}
                decoding="async"
                draggable={false}
                className="pointer-events-none absolute inset-0 size-full object-contain"
                style={{ opacity: i === frame ? 1 : 0 }}
              />
            ))
          : null}
      </m.div>

      <Ledge top="var(--ledge-y)" className="z-[2]" />

      <p
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-3 z-[3] text-center text-caption text-fg-on-ink-muted"
      >
        {hint}
      </p>
    </div>
  );
}

export default PhotoStage;
