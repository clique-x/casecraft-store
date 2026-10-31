'use client';

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { m } from 'motion/react';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { DUR, EASE_OUT_EXPO, SPRING_UI } from '@/lib/motion/tokens';
import { cn } from '@/lib/utils';

export type NodeLineDraw = 'scroll' | 'tap' | 'static';

export interface NodeLineHandle {
  /** Draws the line (`draw="tap"` only). */
  draw(): void;
  reset(): void;
  isDrawn(): boolean;
}

interface NodeLineProps {
  /** Vertices in viewBox units: start, elbow(s), end. The end dots sit on the first and last. */
  points: [number, number][];
  /** `scroll`: GSAP scrub from 'top 85%' to 'center 55%'; `tap`: drawn on `draw()` or a tap; `static`: pre-drawn. */
  draw?: NodeLineDraw;
  className?: string;
  width?: number;
  height?: number;
  /** ScrollTrigger scrub for `draw="scroll"`; a number smooths it (seconds). */
  scrub?: boolean | number;
  preserveAspectRatio?: string;
  ref?: Ref<NodeLineHandle>;
}

const STROKE = 2;
const DOT_R = 4;
const EASE: [number, number, number, number] = [...EASE_OUT_EXPO];

function toPoints(points: readonly [number, number][]): string {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

/**
 * The brand's coral node line: a 2 px polyline with an elbow and a dot at each end. One per layout.
 * `scroll` and `static` render plain SVG (GSAP may own it); `tap` renders motion elements.
 */
export function NodeLine({
  points,
  draw = 'static',
  className,
  width = 100,
  height = 100,
  scrub = true,
  preserveAspectRatio = 'xMidYMid meet',
  ref,
}: NodeLineProps) {
  const reduced = useReducedMotion();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const lineRef = useRef<SVGPolylineElement | null>(null);
  const endDotRef = useRef<SVGCircleElement | null>(null);
  const [drawn, setDrawn] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      draw: () => setDrawn(true),
      reset: () => setDrawn(false),
      isDrawn: () => drawn,
    }),
    [drawn],
  );

  useEffect(() => {
    if (draw !== 'scroll') return;
    const svg = svgRef.current;
    const line = lineRef.current;
    const dot = endDotRef.current;
    if (!svg || !line || !dot) return;

    let cancelled = false;
    let media: { revert(): void } | null = null;

    void Promise.all([import('@/components/motion/GsapProvider'), import('gsap')]).then(
      ([{ registerGsap }, { default: gsap }]) => {
        if (cancelled) return;
        registerGsap();
        const mm = gsap.matchMedia();
        media = mm;
        mm.add('(prefers-reduced-motion: no-preference)', () => {
          gsap.fromTo(
            line,
            { strokeDashoffset: 1 },
            {
              strokeDashoffset: 0,
              ease: 'none',
              immediateRender: true,
              scrollTrigger: { trigger: svg, start: 'top 85%', end: 'center 55%', scrub },
            },
          );
          gsap.fromTo(
            dot,
            { scale: 0, transformOrigin: '50% 50%' },
            {
              scale: 1,
              duration: DUR.ui,
              ease: 'back.out(2)',
              immediateRender: true,
              scrollTrigger: { trigger: svg, start: 'center 58%', toggleActions: 'play none none reverse' },
            },
          );
        });
      },
    );

    return () => {
      cancelled = true;
      media?.revert();
    };
  }, [draw, scrub]);

  if (points.length < 2) return null;
  const [sx, sy] = points[0];
  const [ex, ey] = points[points.length - 1];
  const path = toPoints(points);

  if (draw === 'tap') {
    const lineTransition = reduced ? { duration: 0.15 } : { duration: 0.5, ease: EASE };
    const dotTransition = reduced ? { duration: 0.15 } : { ...SPRING_UI, type: 'spring' as const, delay: 0.4 };
    return (
      <svg
        ref={svgRef}
        aria-hidden="true"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio={preserveAspectRatio}
        className={cn('text-accent', className)}
        onClick={() => setDrawn(true)}
      >
        <circle cx={sx} cy={sy} r={DOT_R} fill="currentColor" />
        <m.polyline
          points={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: drawn ? 1 : 0 }}
          transition={lineTransition}
        />
        <m.circle
          cx={ex}
          cy={ey}
          r={DOT_R}
          fill="currentColor"
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          initial={{ scale: 0 }}
          animate={{ scale: drawn ? 1 : 0 }}
          transition={dotTransition}
        />
      </svg>
    );
  }

  // Pre-drawn in the markup: without JS, or under reduced motion, the line is simply there.
  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={preserveAspectRatio}
      className={cn('text-accent', className)}
    >
      <circle cx={sx} cy={sy} r={DOT_R} fill="currentColor" />
      <polyline
        ref={lineRef}
        points={path}
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ strokeDasharray: 1, strokeDashoffset: 0 }}
      />
      <circle ref={endDotRef} cx={ex} cy={ey} r={DOT_R} fill="currentColor" />
    </svg>
  );
}

export default NodeLine;
