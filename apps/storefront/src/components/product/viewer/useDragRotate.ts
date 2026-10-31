'use client';

import { useEffect, useMemo } from 'react';

const RAD_PER_PX = 0.011;
const PITCH_MAX = 0.6;
const DAMP_LAMBDA = 6;
const INERTIA_DECAY = 3;
const INERTIA_MIN = 0.02;
const IDLE_AFTER_MS = 3000;
const IDLE_SPIN = 0.25;
const KEY_STEP = 0.3;
const SETTLE_EPS = 1e-4;

export interface RotatePose {
  yaw: number;
  pitch: number;
}

function expDamp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function clampPitch(v: number): number {
  return Math.max(-PITCH_MAX, Math.min(PITCH_MAX, v));
}

/**
 * Pointer drag (yaw unlimited, pitch clamped), inertia on release, Left/Right arrow keys,
 * and a slow idle spin that resumes 3 s after the last interaction. Pure state:
 * `step` is called from useFrame and reports whether anything is still moving.
 */
export class DragRotate {
  readonly pose: RotatePose = { yaw: 0, pitch: 0 };
  private onWake: (() => void) | null = null;
  private idleSpin = true;

  private targetYaw = 0;
  private targetPitch = 0;
  private spinVel = 0;
  private dragging = false;
  private pointerId = -1;
  private lastX = 0;
  private lastY = 0;
  private lastMoveAt = 0;
  private sampleVel = 0;
  private lastInteractionAt = 0;
  private spinning = false;

  /** Called whenever input arrives, so an on-demand loop can redraw. */
  setOnWake(cb: (() => void) | null): void {
    this.onWake = cb;
  }

  setIdleSpin(enabled: boolean): void {
    this.idleSpin = enabled;
  }

  attach(el: HTMLElement, finePointer: boolean): () => void {
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || this.dragging) return;
      if (!(e.target instanceof HTMLCanvasElement)) return;
      this.dragging = true;
      this.pointerId = e.pointerId;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.lastMoveAt = e.timeStamp;
      this.sampleVel = 0;
      this.spinVel = 0;
      this.touch();
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* pointer capture may be refused */
      }
      if (finePointer) el.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      if (!this.dragging || e.pointerId !== this.pointerId) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      const dt = Math.max(1, e.timeStamp - this.lastMoveAt) / 1000;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.lastMoveAt = e.timeStamp;
      this.targetYaw += dx * RAD_PER_PX;
      this.targetPitch = clampPitch(this.targetPitch + dy * RAD_PER_PX * 0.6);
      this.sampleVel = this.sampleVel * 0.6 + ((dx * RAD_PER_PX) / dt) * 0.4;
      this.touch();
    };
    const end = (e: PointerEvent, cancelled: boolean) => {
      if (!this.dragging || e.pointerId !== this.pointerId) return;
      this.dragging = false;
      this.pointerId = -1;
      // A sample older than ~100 ms means the finger stopped before lifting.
      this.spinVel = !cancelled && e.timeStamp - this.lastMoveAt < 100 ? Math.max(-8, Math.min(8, this.sampleVel)) : 0;
      this.touch();
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      if (finePointer) el.style.cursor = 'grab';
    };
    const onUp = (e: PointerEvent) => end(e, false);
    const onCancel = (e: PointerEvent) => end(e, true);
    // Left/Right only, as the stage's label promises; Up/Down keep scrolling the page.
    const onKey = (e: KeyboardEvent) => {
      if (e.target !== el) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      this.spinVel = 0;
      this.targetYaw += e.key === 'ArrowRight' ? KEY_STEP : -KEY_STEP;
      this.touch();
    };

    if (finePointer) el.style.cursor = 'grab';
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onCancel);
    el.addEventListener('lostpointercapture', onCancel);
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onCancel);
      el.removeEventListener('lostpointercapture', onCancel);
      el.removeEventListener('keydown', onKey);
      el.style.cursor = '';
      this.dragging = false;
      this.pointerId = -1;
    };
  }

  /** Advances the pose; returns true while a redraw is still needed. */
  step(dt: number, now: number): boolean {
    const delta = Math.min(dt, 0.1);

    if (!this.dragging && Math.abs(this.spinVel) > INERTIA_MIN) {
      this.targetYaw += this.spinVel * delta;
      this.spinVel *= Math.exp(-INERTIA_DECAY * delta);
    } else {
      this.spinVel = 0;
    }

    this.spinning = this.idleSpin && !this.dragging && this.spinVel === 0 && now - this.lastInteractionAt > IDLE_AFTER_MS;
    if (this.spinning) this.targetYaw += IDLE_SPIN * delta;

    this.pose.yaw = expDamp(this.pose.yaw, this.targetYaw, DAMP_LAMBDA, delta);
    this.pose.pitch = expDamp(this.pose.pitch, this.targetPitch, DAMP_LAMBDA, delta);

    return (
      this.spinning ||
      this.dragging ||
      this.spinVel !== 0 ||
      Math.abs(this.targetYaw - this.pose.yaw) > SETTLE_EPS ||
      Math.abs(this.targetPitch - this.pose.pitch) > SETTLE_EPS
    );
  }

  private touch(): void {
    this.lastInteractionAt = performance.now();
    this.onWake?.();
  }
}

interface Options {
  reducedMotion: boolean;
  finePointer: boolean;
}

/** One controller per stage element; listeners re-bind when the element or pointer kind changes. */
export function useDragRotate(stage: HTMLElement | null, { reducedMotion, finePointer }: Options): DragRotate {
  const rotate = useMemo(() => new DragRotate(), []);

  useEffect(() => {
    rotate.setIdleSpin(!reducedMotion);
  }, [rotate, reducedMotion]);

  useEffect(() => {
    if (!stage) return;
    return rotate.attach(stage, finePointer);
  }, [rotate, stage, finePointer]);

  return rotate;
}
