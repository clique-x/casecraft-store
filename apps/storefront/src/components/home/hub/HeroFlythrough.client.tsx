'use client';

import Link from 'next/link';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';

export interface HeroItem {
  href: string;
  /** A transparent cutout, so the product floats on its own. */
  src: string;
  srcSet?: string;
  /** Pixel size of the cutout, for its aspect. */
  w: number;
  h: number;
  title: string;
  price: string;
}

/**
 * Where each product hangs in the room: x in vw and y in vh from the centre, z in px into the screen.
 * The near ones keep clear of the headline; later ones sit at the edges so they pass beside the
 * department cards, not over them.
 */
const SLOTS: readonly [number, number, number][] = [
  [-30, -16, 100],
  [34, -20, 260],
  [-27, 27, 480],
  [34, 28, 660],
  [0, -46, 860],
  [-42, -2, 1040],
  [30, -32, 1240],
  [-16, 36, 1420],
  [40, 10, 1620],
  [-36, -28, 1820],
  [36, 28, 2020],
  [-38, 28, 2220],
];
const DEPTH = 2400;
/** The camera arrives here at this share of the scroll and holds, so the ending settles. */
const ARRIVE_AT = 0.82;
const PERSPECTIVE = 900;
const PARTICLES = 28;
const LERP = 0.09;
const MAX_TILT = 4;

/** A fixed scatter of dust so the server and client draw the same scene. */
const DUST = Array.from({ length: PARTICLES }, (_, i) => {
  const a = i * 2.399963; // golden angle, evenly spread
  return { x: Math.cos(a) * (18 + (i % 5) * 7), y: Math.sin(a) * (14 + (i % 4) * 8), z: (i / PARTICLES) * DEPTH, s: 2 + (i % 3) };
});

const CSS = `
.fly-stage{perspective:${PERSPECTIVE}px;perspective-origin:50% 50%}
.fly-world,.fly-layer{transform-style:preserve-3d;pointer-events:none}
.fly-item{pointer-events:auto}
.fly-item,.fly-dust,.fly-text{position:absolute;left:50%;top:50%;will-change:transform,opacity;backface-visibility:hidden}
.fly-item{width:calc(var(--w) * var(--k));margin-left:calc(var(--w) * var(--k) / -2);margin-top:calc(var(--w) * var(--k) / var(--ar) / -2)}
.fly-img{display:block;width:100%;height:auto;filter:drop-shadow(0 30px 40px rgba(0,0,0,.55));transition:transform .5s var(--ease-out-expo)}
.fly-glow{position:absolute;left:50%;top:50%;width:140%;height:140%;transform:translate(-50%,-50%);border-radius:50%;
  background:radial-gradient(closest-side,rgba(46,196,214,.28),transparent);z-index:-1;transition:opacity .5s var(--ease-out-expo);opacity:.55}
@media (hover:hover){.fly-item:hover .fly-img,.fly-item:focus-within .fly-img{transform:translateY(-6px) scale(1.05)}
  .fly-item:hover .fly-glow,.fly-item:focus-within .fly-glow{opacity:1}
  .fly-item:hover .fly-tag,.fly-item:focus-within .fly-tag{opacity:1;transform:translateY(0)}}
@keyframes fly-cue{0%{transform:scaleY(0);transform-origin:top}45%{transform:scaleY(1);transform-origin:top}55%{transform:scaleY(1);transform-origin:bottom}100%{transform:scaleY(0);transform-origin:bottom}}
.fly-cue{animation:fly-cue 1.8s var(--ease-in-out-quart) infinite}
@keyframes fly-breathe{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-46%,-54%) scale(1.15)}}
.fly-breathe{animation:fly-breathe 9s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.fly-cue,.fly-breathe{animation:none}}
`;

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * The first screen is a room you fly through. Products float in space at different depths around a
 * headline; scrolling moves the camera forward past them, with dust drifting by, until the department
 * cards and the call to action arrive at the far end and the camera comes to rest. The pointer tilts
 * the room a little. It opens as a straight studio shot with the camera still.
 */
export function HeroFlythrough({ items, headline, end }: { items: HeroItem[]; headline: ReactNode; end: ReactNode }) {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const tilt = useRef({ x: 0, y: 0 });
  const slots = items.slice(0, SLOTS.length);

  useEffect(() => {
    const section = sectionRef.current;
    const world = worldRef.current;
    if (!section || !world) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const itemEls = Array.from(world.querySelectorAll<HTMLElement>('.fly-item'));
    const dustEls = Array.from(world.querySelectorAll<HTMLElement>('.fly-dust'));
    const textEls = Array.from(world.querySelectorAll<HTMLElement>('.fly-text'));
    let cam = 0;
    let rx = 0;
    let ry = 0;
    let raf = 0;

    const render = (t: number) => {
      const r = section.getBoundingClientRect();
      const travel = Math.max(1, r.height - window.innerHeight);
      const progress = clamp(-r.top / travel / ARRIVE_AT, 0, 1);
      const target = progress * DEPTH;
      cam = reduced || Math.abs(target - cam) < 0.3 ? target : cam + (target - cam) * LERP;
      if (fine && !reduced) {
        rx += (tilt.current.x - rx) * 0.06;
        ry += (tilt.current.y - ry) * 0.06;
      }
      world.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;

      itemEls.forEach((el, i) => {
        const [x, y, z] = SLOTS[i]!;
        const rel = cam - z;
        if (rel > 640 || rel < -1650) {
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          return;
        }
        // Fades out as it sweeps past the camera; the far ones emerge from the dark as it nears them.
        const near = rel > 360 ? 1 - (rel - 360) / 280 : 1;
        const far = rel < -1150 ? clamp(1 - (-rel - 1150) / 500, 0, 1) : 1;
        const bob = reduced ? 0 : Math.sin(t / 1400 + i * 1.7) * 6;
        el.style.visibility = 'visible';
        el.style.opacity = (near * far).toFixed(3);
        el.style.transform = `translate3d(${x}vw, calc(${y}vh + ${bob.toFixed(1)}px), ${rel.toFixed(1)}px)`;
      });
      dustEls.forEach((el, i) => {
        const d = DUST[i]!;
        const rel = ((((cam - d.z) % DEPTH) + DEPTH) % DEPTH) - DEPTH + 420;
        const drift = reduced ? 0 : Math.sin(t / 2600 + i) * 2;
        el.style.opacity = rel > 300 ? ((420 - rel) / 120).toFixed(2) : clamp(1 + rel / 2200, 0.15, 1).toFixed(2);
        el.style.transform = `translate3d(${d.x + drift}vw, ${d.y}vh, ${rel.toFixed(0)}px)`;
      });
      textEls.forEach((el) => {
        const z = Number(el.dataset.z);
        const rel = cam - z;
        // The headline fades as the camera passes it; the ending fades in over the last stretch and lands at full size.
        const show = el.dataset.end !== undefined ? clamp(1 - (-rel - 140) / 560, 0, 1) : clamp(1 - rel / 330, 0, 1);
        el.style.opacity = show.toFixed(3);
        el.style.visibility = show > 0.01 ? 'visible' : 'hidden';
        el.style.pointerEvents = el.dataset.end !== undefined && show > 0.6 ? 'auto' : 'none';
        el.style.transform = `translate3d(-50%, -50%, ${clamp(rel, -3000, 700).toFixed(1)}px)`;
      });
      if (cueRef.current) cueRef.current.style.opacity = clamp(1 - cam / 160, 0, 1).toFixed(2);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [reduced, slots.length]);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    tilt.current = { y: nx * MAX_TILT, x: -ny * MAX_TILT * 0.6 };
  };
  const onPointerLeave = () => {
    tilt.current = { x: 0, y: 0 };
  };

  return (
    <div ref={sectionRef} className="relative h-[280svh] bg-[#06151a]" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="fly-stage sticky top-0 h-svh overflow-hidden text-paper [--w:clamp(11rem,22vw,22rem)]">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_55%,#10434c_0%,#0a2a31_40%,#06151a_75%)]" />
        <div aria-hidden="true" className="fly-breathe absolute top-1/2 left-1/2 size-[70vmin] rounded-full bg-[#2ec4d6]/20 blur-3xl" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgba(0,0,0,.55),transparent)]" />
        <div ref={worldRef} className="fly-world absolute inset-0">
          <div className="fly-layer absolute inset-0" aria-hidden="true">
            {DUST.map((d, i) => (
              <span key={i} className="fly-dust rounded-full bg-white/70" style={{ width: d.s, height: d.s }} />
            ))}
          </div>
          <div className="fly-text pointer-events-none w-[min(94vw,60rem)] text-center" data-z="0">
            <div aria-hidden="true" className="absolute inset-[-30%] -z-10 bg-[radial-gradient(closest-side,rgba(6,21,26,.75),transparent)]" />
            {headline}
          </div>
          <ul aria-label="Floating products" className="fly-layer absolute inset-0 list-none">
            {slots.map((it, i) => {
              const ar = it.w / it.h;
              // Tall cutouts (covers) take less width than squarish ones (audio), so they read at a similar size.
              const k = ar < 0.7 ? 0.62 : 1;
              return (
                <li key={it.href} className="fly-item" style={{ ['--ar' as string]: ar.toFixed(3), ['--k' as string]: k } as CSSProperties}>
                  <span aria-hidden="true" className="fly-glow" />
                  <Link
                    href={it.href}
                    aria-label={`${it.title}, ${it.price}`}
                    draggable={false}
                    className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#7fd3dc] focus-visible:ring-offset-8 focus-visible:ring-offset-[#06151a]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants */}
                    <img
                      src={it.src}
                      srcSet={it.srcSet}
                      sizes="(min-width: 1024px) 480px, 70vw"
                      alt=""
                      width={it.w}
                      height={it.h}
                      draggable={false}
                      loading={i < 6 ? 'eager' : 'lazy'}
                      fetchPriority={i === 0 ? 'high' : 'auto'}
                      className="fly-img"
                    />
                  </Link>
                  <span className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-pill bg-paper/95 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-fg tabular-nums shadow-lg sm:text-xs">
                    {it.price}
                  </span>
                  <span
                    aria-hidden="true"
                    className="fly-tag pointer-events-none absolute inset-x-[-40%] -bottom-10 hidden translate-y-2 truncate text-center text-xs font-semibold text-paper/90 opacity-0 transition-[opacity,transform] duration-300 sm:block"
                  >
                    {it.title}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="fly-text w-[min(94vw,52rem)]" data-z={DEPTH - 60} data-end="">
            {end}
          </div>
        </div>
        <div ref={cueRef} aria-hidden="true" className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 text-caption font-semibold tracking-[0.2em] text-paper/60 uppercase">
          Scroll
          <span className="fly-cue block h-10 w-px bg-paper/60" />
        </div>
      </div>
    </div>
  );
}
