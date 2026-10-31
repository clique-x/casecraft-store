'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { m } from 'motion/react';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { EASE_OUT_EXPO } from '@/lib/motion/tokens';
import { useMyPhone } from '@/lib/phone/use-my-phone';
import { kickerOverride, useKickerOverride } from './heroBus';

interface FlipProps {
  /** The server face, e.g. "your phone." */
  base: string;
}

const FLIP_S = 0.45;
const FADE_S = 0.15;
const FACE = 'absolute inset-x-0 top-0 block whitespace-nowrap [backface-visibility:hidden]';
const EASE: [number, number, number, number] = [...EASE_OUT_EXPO];

/**
 * Line 2 of the h1. Flips once to "your {model}." when `my_phone` resolves and the
 * text fits one line; otherwise the kicker carries the personalisation instead.
 */
export function HeadlineFlip({ base }: FlipProps) {
  const { phone } = useMyPhone();
  const reduced = useReducedMotion();
  const boxRef = useRef<HTMLSpanElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<string | null>(null);

  const modelFace = phone ? `your ${phone.model}.` : null;
  const modelName = phone?.model ?? null;

  useLayoutEffect(() => {
    if (!modelFace || !modelName) {
      kickerOverride.set(null);
      return;
    }
    const box = boxRef.current;
    const probe = probeRef.current;
    const h1 = box?.closest('h1');
    if (!box || !probe || !h1) return;
    let cancelled = false;
    // Measured in a frame callback: the probe has laid out and the flip is an animation anyway.
    const measure = () => {
      if (cancelled) return;
      if (probe.offsetWidth <= h1.clientWidth) {
        setShown(modelFace);
        kickerOverride.set(null);
      } else {
        setShown(null);
        kickerOverride.set(`Covers for your ${modelName}`);
      }
    };
    const frame = requestAnimationFrame(measure);
    document.fonts?.ready.then(measure, () => undefined);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [modelFace, modelName]);

  const showModel = modelFace !== null && shown === modelFace;
  const transition = { duration: reduced ? FADE_S : FLIP_S, ease: EASE };

  return (
    <span ref={boxRef} className="relative block h-[1.05em] [perspective:600px] [transform-style:preserve-3d]">
      <m.span
        className={FACE}
        style={{ transformOrigin: '50% 100%' }}
        initial={false}
        animate={{ rotateX: showModel && !reduced ? -90 : 0, opacity: showModel ? 0 : 1 }}
        transition={transition}
        aria-hidden={showModel ? true : undefined}
      >
        {base}
      </m.span>
      {modelFace ? (
        <m.span
          key={modelFace}
          className={FACE}
          style={{ transformOrigin: '50% 0%' }}
          initial={{ rotateX: reduced ? 0 : 90, opacity: 0 }}
          animate={{ rotateX: showModel || reduced ? 0 : 90, opacity: showModel ? 1 : 0 }}
          transition={transition}
          aria-hidden={showModel ? undefined : true}
        >
          {modelFace}
        </m.span>
      ) : null}
      <span ref={probeRef} aria-hidden="true" className="invisible absolute top-0 left-0 whitespace-nowrap">
        {modelFace ?? base}
      </span>
    </span>
  );
}

interface KickerProps {
  fallback: string;
}

/** The kicker line; reads "Covers for your {model}" when the flip had to be skipped. */
export function HeroKicker({ fallback }: KickerProps) {
  const override = useKickerOverride();
  return <>{override ?? fallback}</>;
}
