'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { cn } from '@/lib/utils';

export interface RingItem {
  href: string;
  src: string;
  srcSet?: string;
  title: string;
  price: string;
  /** Light product shots (audio) sit on a light card; studio cover shots fill a dark one. */
  tone: 'dark' | 'light';
}

const AUTO_DEG_PER_S = 9;
const DRAG_DEG_PER_PX = 0.32;
const FRICTION = 0.92;
const SNAP_EASE = 0.12;

const RING_CSS = `
.ring-stage{perspective:1100px;perspective-origin:50% 35%}
.ring-tilt{transform-style:preserve-3d;transform:rotateX(-7deg)}
.ring{transform-style:preserve-3d}
.ring-card{position:absolute;left:50%;top:0;width:var(--card-w);height:calc(var(--card-w)*1.25);margin-left:calc(var(--card-w)/-2);
  transform:translateZ(calc(var(--radius)*-1)) rotateY(calc(var(--i)*var(--step))) translateZ(var(--radius));backface-visibility:hidden;-webkit-backface-visibility:hidden}
.ring-card *{backface-visibility:hidden;-webkit-backface-visibility:hidden}
.ring-floor{background:radial-gradient(50% 50% at 50% 50%,color-mix(in srgb,#5fd0dc 22%,transparent),transparent 70%)}
`;

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

/**
 * A slowly turning 3D ring of products (CSS 3D, one transform per frame). Drag or swipe to spin it,
 * hover or touch to pause, arrows and keyboard focus bring a product to the front, and the product
 * facing the visitor is named below with its price and a link.
 */
export function HeroRing({ items }: { items: RingItem[] }) {
  const n = items.length;
  const step = 360 / n;
  const reduced = useReducedMotion();
  const ringRef = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const velocity = useRef(0);
  const target = useRef<number | null>(null);
  const paused = useRef(false);
  const drag = useRef<{ x: number; moved: number; last: number; t: number } | null>(null);
  const [front, setFront] = useState(0);
  const justDragged = useRef(false);

  const apply = useCallback(() => {
    const el = ringRef.current;
    if (el) {
      // Each card's angle from the viewer: the far side is hidden outright, the sides dim for depth.
      const cards = el.querySelectorAll<HTMLElement>('.ring-card');
      cards.forEach((card, i) => {
        const a = i * step + angle.current;
        const off = Math.abs(mod(a + 180, 360) - 180);
        const shown = off < 95;
        card.style.visibility = shown ? 'visible' : 'hidden';
        if (shown) {
          card.style.opacity = String(Math.max(0, Math.min(1, 1.15 - off / 100)));
          card.style.transform = `translateZ(calc(var(--radius) * -1)) rotateY(${a}deg) translateZ(var(--radius))`;
        }
      });
    }
    const idx = mod(Math.round(-angle.current / step), n);
    setFront((f) => (f === idx ? f : idx));
  }, [n, step]);

  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (!drag.current) {
        if (target.current !== null) {
          const d = target.current - angle.current;
          angle.current += d * SNAP_EASE;
          if (Math.abs(d) < 0.05) {
            angle.current = target.current;
            target.current = null;
          }
        } else if (Math.abs(velocity.current) > 0.02) {
          angle.current += velocity.current;
          velocity.current *= FRICTION;
        } else if (!paused.current && !reduced) {
          angle.current -= AUTO_DEG_PER_S * dt;
        }
      }
      apply();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [apply, reduced]);

  const goTo = (i: number) => {
    // Nearest equivalent angle for item i, so the ring turns the short way round.
    const base = -i * step;
    const turns = Math.round((angle.current - base) / 360);
    velocity.current = 0;
    target.current = base + turns * 360;
  };
  const nudge = (dir: 1 | -1) => goTo(mod(front + dir, n));

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, moved: 0, last: e.clientX, t: performance.now() };
    target.current = null;
    velocity.current = 0;
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.last;
    d.moved += Math.abs(dx);
    if (d.moved > 6) e.currentTarget.setPointerCapture?.(e.pointerId);
    angle.current += dx * DRAG_DEG_PER_PX;
    velocity.current = dx * DRAG_DEG_PER_PX * 0.6;
    d.last = e.clientX;
  };
  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    if (d && d.moved > 6) {
      justDragged.current = true;
      window.setTimeout(() => (justDragged.current = false), 60);
      // Let it coast, then settle on the nearest product.
      const coast = velocity.current / (1 - FRICTION);
      const landing = mod(Math.round(-(angle.current + coast) / step), n);
      window.setTimeout(() => goTo(landing), 420);
    }
  };

  const current = items[front];

  return (
    <div className="flex flex-col items-center">
      <style href="hero-ring" precedence="default">
        {RING_CSS}
      </style>
      <div
        className="ring-stage relative w-full touch-pan-y select-none [--card-w:8.75rem] [--radius:15.5rem] sm:[--card-w:11rem] sm:[--radius:20rem] lg:[--card-w:12.5rem] lg:[--radius:23rem]"
        style={{ ['--step' as string]: `${step}deg` } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') paused.current = true;
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') paused.current = false;
          if (drag.current) endDrag();
        }}
      >
        <div aria-hidden="true" className="ring-floor pointer-events-none absolute inset-x-[10%] bottom-[-1.5rem] h-16" />
        <div className="ring-tilt relative mx-auto h-[calc(var(--card-w)*1.25+1rem)] w-full">
          {/* Zero-size, untransformed pivot: each card carries its own transform, since a transformed plane here gets its edges drawn as faint lines. */}
          <div ref={ringRef} className="ring absolute top-0 left-1/2 size-0">
            <ul aria-label="Featured products" className="size-0 [transform-style:preserve-3d]">
              {items.map((it, i) => (
                <li key={it.href + i} className="ring-card" style={{ ['--i' as string]: i } as CSSProperties}>
                  <Link
                    href={it.href}
                    draggable={false}
                    onClick={(e) => {
                      if (justDragged.current) {
                        e.preventDefault();
                        return;
                      }
                      if (front !== i) {
                        e.preventDefault();
                        goTo(i);
                      }
                    }}
                    onFocus={() => goTo(i)}
                    aria-label={`${it.title}, ${it.price}`}
                    className={cn(
                      'block size-full overflow-hidden rounded-[22px] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)] ring-1 outline-none focus-visible:ring-2 focus-visible:ring-[#7fd3dc]',
                      it.tone === 'dark' ? 'bg-[#0b2b33] ring-white/10' : 'bg-surface-2 ring-white/40',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants */}
                    <img
                      src={it.src}
                      srcSet={it.srcSet}
                      sizes="(min-width: 1024px) 200px, 140px"
                      alt=""
                      width={480}
                      height={600}
                      draggable={false}
                      loading={i < 4 || i > n - 3 ? 'eager' : 'lazy'}
                      fetchPriority={i === 0 ? 'high' : 'auto'}
                      className="size-full object-cover"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {current && (
        <div className="mt-8 flex w-full max-w-sm items-center gap-2 sm:mt-10">
          <button
            type="button"
            onClick={() => nudge(-1)}
            aria-label="Previous product"
            className="grid size-11 shrink-0 place-items-center rounded-pill text-paper/80 ring-1 ring-white/20 transition-colors hover:bg-white/10 hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fd3dc]"
          >
            <ChevronLeftIcon className="size-5" aria-hidden="true" />
          </button>
          <Link
            href={current.href}
            className="group/front flex min-w-0 flex-1 items-center justify-between gap-3 rounded-pill bg-paper py-1.5 pr-1.5 pl-5 text-fg shadow-xl outline-none focus-visible:ring-2 focus-visible:ring-[#7fd3dc]"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{current.title}</span>
              <span className="block text-caption text-fg-muted tabular-nums">{current.price}</span>
            </span>
            <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-pill bg-fg px-4 text-sm font-bold text-paper transition-colors group-hover/front:bg-brand">
              View <ArrowRightIcon className="size-4" aria-hidden="true" />
            </span>
          </Link>
          <button
            type="button"
            onClick={() => nudge(1)}
            aria-label="Next product"
            className="grid size-11 shrink-0 place-items-center rounded-pill text-paper/80 ring-1 ring-white/20 transition-colors hover:bg-white/10 hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fd3dc]"
          >
            <ChevronRightIcon className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
