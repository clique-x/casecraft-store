'use client';

import Link from 'next/link';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';

export interface HeroItem {
  href: string;
  src: string;
  srcSet?: string;
  title: string;
  price: string;
  /** Light product shots (audio) sit on a light card; studio cover shots fill a dark one. */
  tone: 'dark' | 'light';
}

/** Where each product hangs in the room: x in vw and y in vh from the centre, z in px into the screen. The camera flies in; later ones sit at the edges so they pass beside the shortcuts, not over them. */
const SLOTS: readonly [number, number, number][] = [
  [-31, -20, 100],
  [31, -16, 300],
  [-27, 21, 500],
  [33, 22, 680],
  [2, -31, 880],
  [-36, 1, 1060],
  [29, -25, 1260],
  [-17, 30, 1440],
  [36, 8, 1640],
  [-33, -24, 1840],
  [34, 26, 2040],
  [-36, 26, 2240],
];
const DEPTH = 2400;
const END_Z = 2550;
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
.fly-world,.fly-layer{transform-style:preserve-3d}
.fly-item,.fly-dust,.fly-text{position:absolute;left:50%;top:50%;will-change:transform,opacity;backface-visibility:hidden}
.fly-item{width:clamp(7.5rem,15vw,15rem);margin:calc(clamp(7.5rem,15vw,15rem) * -0.625) 0 0 calc(clamp(7.5rem,15vw,15rem) / -2)}
.fly-card{transition:transform .5s var(--ease-out-expo),box-shadow .5s var(--ease-out-expo)}
@media (hover:hover){.fly-item:hover .fly-card,.fly-item:focus-within .fly-card{transform:scale(1.06);box-shadow:0 50px 80px -30px rgba(0,0,0,.95)}
  .fly-item:hover .fly-tag,.fly-item:focus-within .fly-tag{opacity:1;transform:translateY(0)}}
@keyframes fly-cue{0%{transform:scaleY(0);transform-origin:top}45%{transform:scaleY(1);transform-origin:top}55%{transform:scaleY(1);transform-origin:bottom}100%{transform:scaleY(0);transform-origin:bottom}}
.fly-cue{animation:fly-cue 1.8s var(--ease-in-out-quart) infinite}
@keyframes fly-glow{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-46%,-54%) scale(1.15)}}
.fly-glow{animation:fly-glow 9s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.fly-cue,.fly-glow{animation:none}}
`;

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * The first screen is a room you fly through. Products hang in space at different depths around a
 * headline; scrolling moves the camera forward past them, with dust drifting by, until the shortcuts
 * and the call to action arrive at the far end. The pointer tilts the room a little. It opens as a
 * straight studio shot with the camera at rest.
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
      const target = clamp(-r.top / travel, 0, 1) * DEPTH;
      cam = reduced ? target : cam + (target - cam) * LERP;
      if (fine && !reduced) {
        rx += (tilt.current.x - rx) * 0.06;
        ry += (tilt.current.y - ry) * 0.06;
      }
      world.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;

      itemEls.forEach((el, i) => {
        const [x, y, z] = SLOTS[i]!;
        const rel = cam - z;
        if (rel > 760) {
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          return;
        }
        const near = rel > 420 ? 1 - (rel - 420) / 340 : 1;
        const fog = rel < -1100 ? clamp(1 - (-rel - 1100) / 1100, 0.12, 1) : 1;
        const bob = reduced ? 0 : Math.sin(t / 1400 + i * 1.7) * 6;
        el.style.visibility = 'visible';
        el.style.opacity = (near * fog).toFixed(3);
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
        const show = el.dataset.end !== undefined ? clamp(1 - (-rel - 300) / 700, 0, 1) : clamp(1 - rel / 330, 0, 1);
        el.style.opacity = show.toFixed(3);
        el.style.visibility = show > 0.01 ? 'visible' : 'hidden';
        el.style.pointerEvents = show > 0.5 ? 'auto' : 'none';
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
    <div ref={sectionRef} className="relative h-[260svh] bg-[#06151a]" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="fly-stage sticky top-0 h-svh overflow-hidden text-paper">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_55%,#10434c_0%,#0a2a31_40%,#06151a_75%)]" />
        <div aria-hidden="true" className="fly-glow absolute top-1/2 left-1/2 size-[70vmin] rounded-full bg-[#2ec4d6]/20 blur-3xl" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgba(0,0,0,.55),transparent)]" />
        <div ref={worldRef} className="fly-world absolute inset-0">
          <div className="fly-layer absolute inset-0" aria-hidden="true">
            {DUST.map((d, i) => (
              <span key={i} className="fly-dust rounded-full bg-white/70" style={{ width: d.s, height: d.s }} />
            ))}
          </div>
          <div className="fly-text w-[min(92vw,56rem)] text-center" data-z="0">
            {headline}
          </div>
          <ul aria-label="Floating products" className="fly-layer absolute inset-0 list-none">
            {slots.map((it, i) => (
              <li key={it.href} className="fly-item" style={{ ['--i' as string]: i } as CSSProperties}>
                <Link
                  href={it.href}
                  aria-label={`${it.title}, ${it.price}`}
                  draggable={false}
                  className={cn(
                    'fly-card relative block aspect-[4/5] overflow-hidden rounded-[16px] shadow-[0_40px_70px_-30px_rgba(0,0,0,.9)] ring-1 outline-none focus-visible:ring-2 focus-visible:ring-[#7fd3dc] sm:rounded-[22px]',
                    it.tone === 'dark' ? 'bg-[#0b2b33] ring-white/10' : 'bg-surface-2 ring-white/40',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants */}
                  <img
                    src={it.src}
                    srcSet={it.srcSet}
                    sizes="(min-width: 1024px) 240px, 40vw"
                    alt=""
                    width={480}
                    height={600}
                    draggable={false}
                    loading={i < 6 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                    className="size-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 rounded-pill bg-paper/95 px-2 py-0.5 text-[11px] font-bold text-fg tabular-nums shadow sm:text-xs">
                    {it.price}
                  </span>
                </Link>
                <span
                  aria-hidden="true"
                  className="fly-tag pointer-events-none absolute inset-x-0 -bottom-8 hidden translate-y-2 truncate text-center text-xs font-semibold text-paper/90 opacity-0 transition-[opacity,transform] duration-300 sm:block"
                >
                  {it.title}
                </span>
              </li>
            ))}
          </ul>
          <div className="fly-text w-[min(92vw,40rem)] text-center" data-z={END_Z} data-end="">
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
