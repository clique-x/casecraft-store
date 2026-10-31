'use client';

import { useEffect, useRef, useState } from 'react';

export interface GyroTilt {
  /** Left/right (gamma), normalised −1..1 over ±25°. */
  x: number;
  /** Forward/back relative to the resting baseline (beta), normalised −1..1 over ±20°. */
  y: number;
}

export type GyroListener = (tilt: GyroTilt) => void;

/** Degree ranges the normalised values map from; consumers scale to their own caps. */
export const GYRO_RANGE = { gammaDeg: 25, betaDeg: 20 } as const;

const BASELINE_MS = 600;
const ALPHA = 0.12;

interface OrientationEventStatics {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

let granted = false;

function orientationStatics(): OrientationEventStatics | null {
  if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return null;
  return window.DeviceOrientationEvent as unknown as OrientationEventStatics;
}

/** iOS gates `deviceorientation` behind a prompt; Android fires it freely. */
function needsPermission(statics: OrientationEventStatics): boolean {
  return typeof statics.requestPermission === 'function';
}

/**
 * Call only from a user gesture (iOS shows a prompt). Resolves true when orientation events
 * will fire; the hook never calls this itself, so iOS visitors who are not asked see sway only.
 */
export async function requestGyroPermission(): Promise<boolean> {
  const statics = orientationStatics();
  if (!statics) return false;
  if (!needsPermission(statics) || !statics.requestPermission) {
    granted = true;
    return true;
  }
  try {
    granted = (await statics.requestPermission()) === 'granted';
  } catch {
    granted = false;
  }
  return granted;
}

export function gyroAvailable(): boolean {
  const statics = orientationStatics();
  if (!statics) return false;
  return !needsPermission(statics) || granted;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Device tilt as a live object: the same reference is mutated once per animation frame and
 * `onTilt` fires with it, so no React state changes per frame. Returns null while inactive
 * (disabled, no sensor, or iOS without a granted permission). The caller passes `enabled`
 * = tier full && !reducedMotion && !finePointer && hero in view.
 */
export function useGyroTilt(enabled: boolean, onTilt?: GyroListener): GyroTilt | null {
  const [live, setLive] = useState<GyroTilt | null>(null);
  const listener = useRef<GyroListener | undefined>(undefined);

  useEffect(() => {
    listener.current = onTilt;
  }, [onTilt]);

  useEffect(() => {
    if (!enabled || !gyroAvailable()) return;

    const tilt: GyroTilt = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const samples: number[] = [];
    const startedAt = performance.now();
    let baseline: number | null = null;
    let frame = 0;

    const onFrame = () => {
      frame = 0;
      tilt.x += (target.x - tilt.x) * ALPHA;
      tilt.y += (target.y - tilt.y) * ALPHA;
      listener.current?.(tilt);
      if (Math.abs(target.x - tilt.x) > 0.002 || Math.abs(target.y - tilt.y) > 0.002) {
        frame = requestAnimationFrame(onFrame);
      }
    };

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      if (baseline === null) {
        samples.push(e.beta);
        if (performance.now() - startedAt < BASELINE_MS) return;
        baseline = median(samples);
      }
      target.x = clamp(e.gamma / GYRO_RANGE.gammaDeg, -1, 1);
      target.y = clamp((e.beta - baseline) / GYRO_RANGE.betaDeg, -1, 1);
      if (!frame) frame = requestAnimationFrame(onFrame);
    };

    window.addEventListener('deviceorientation', onOrientation, { passive: true });
    setLive(tilt);

    return () => {
      window.removeEventListener('deviceorientation', onOrientation);
      if (frame) cancelAnimationFrame(frame);
      tilt.x = 0;
      tilt.y = 0;
      listener.current?.(tilt);
      setLive(null);
    };
  }, [enabled]);

  return live;
}
