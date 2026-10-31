'use client';

import { useMemo, useRef } from 'react';

export interface TapEvent {
  clientX: number;
  clientY: number;
  pointerId: number;
  timeStamp: number;
}

export interface TapOptions {
  slop?: number;
  maxMs?: number;
}

export interface TapHandlers<E extends TapEvent> {
  onPointerDown: (e: E) => void;
  onPointerMove: (e: E) => void;
  onPointerUp: (e: E) => void;
  onPointerCancel: (e: E) => void;
}

interface TapStart {
  id: number;
  x: number;
  y: number;
  t: number;
  moved: boolean;
}

export function useTap<E extends TapEvent = PointerEvent>(
  onTap: (e: E) => void,
  opts: TapOptions = {},
): TapHandlers<E> {
  const { slop = 8, maxMs = 250 } = opts;
  const start = useRef<TapStart | null>(null);

  return useMemo<TapHandlers<E>>(() => {
    const reset = () => {
      start.current = null;
    };
    return {
      onPointerDown: (e) => {
        start.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, moved: false };
      },
      onPointerMove: (e) => {
        const s = start.current;
        if (!s || s.id !== e.pointerId || s.moved) return;
        if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > slop) s.moved = true;
      },
      onPointerUp: (e) => {
        const s = start.current;
        reset();
        if (!s || s.id !== e.pointerId || s.moved) return;
        if (e.timeStamp - s.t > maxMs) return;
        if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > slop) return;
        onTap(e);
      },
      onPointerCancel: reset,
    };
  }, [onTap, slop, maxMs]);
}
