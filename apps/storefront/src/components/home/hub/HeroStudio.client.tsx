'use client';

import Link from 'next/link';
import { useEffect, useRef, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';

export interface ShelfItem {
  href: string;
  src: string;
  srcSet?: string;
  title: string;
  price: string;
  /** Light product shots (audio) sit on a light card; studio cover shots fill a dark one. */
  tone: 'dark' | 'light';
}

const PER_SHELF = 4;
const MAX_TILT_Y = 7;
const MAX_TILT_X = 4;
const LERP = 0.08;

const STUDIO_CSS = `
.studio{perspective:1400px;perspective-origin:50% 40%}
.studio-room{transform-style:preserve-3d;will-change:transform}
.studio-wall{transform:translateZ(calc(var(--depth) * -1))}
.studio-shelf{transform-style:preserve-3d}
.studio-plank{transform-style:preserve-3d}
.studio-plank::before{content:"";position:absolute;inset-inline:0;bottom:100%;height:var(--depth);transform-origin:bottom;transform:rotateX(90deg);
  background:linear-gradient(to top,#0f353d,#0a262c)}
.studio-plank::after{content:"";position:absolute;inset-inline:-2%;top:100%;height:3rem;
  background:linear-gradient(to bottom,rgba(0,0,0,.45),transparent)}
.studio-item{transform-style:preserve-3d;transform:translateZ(calc(var(--depth) * -0.45))}
.studio-card{transition:transform .5s var(--ease-out-expo),box-shadow .5s var(--ease-out-expo)}
@media (hover:hover){
  .studio-item:hover .studio-card,.studio-item:focus-within .studio-card{transform:translateZ(3rem) scale(1.04);box-shadow:0 40px 60px -24px rgba(0,0,0,.9)}
  .studio-item:hover .studio-tag,.studio-item:focus-within .studio-tag{opacity:1;transform:translateY(0)}
}
@keyframes studio-rise{from{opacity:0;transform:translateY(1.5rem) translateZ(calc(var(--depth) * -0.45))}}
@keyframes studio-plank-in{from{opacity:0;transform:scaleX(.6)}}
@keyframes studio-sway{0%,100%{transform:rotateY(-2.5deg) rotateX(1deg)}50%{transform:rotateY(2.5deg) rotateX(-1deg)}}
.studio-item{animation:studio-rise .9s var(--ease-out-expo) both;animation-delay:calc(.15s + var(--d) * 60ms)}
.studio-plank{animation:studio-plank-in .9s var(--ease-out-expo) both;animation-delay:calc(var(--r) * 90ms)}
.studio-room[data-sway]{animation:studio-sway 14s ease-in-out 1.6s infinite}
@media (prefers-reduced-motion:reduce){.studio-item,.studio-plank,.studio-room[data-sway]{animation:none}}
`;

/**
 * A shop wall of shelves in CSS 3D: planks with real depth, products standing on them, a spotlit back
 * wall. It opens straight on, as a studio shot, then follows the pointer with a gentle tilt on desktop
 * and sways slowly on touch screens. Hovering a product lifts it off the shelf and names it.
 */
export function HeroStudio({ items }: { items: ShelfItem[] }) {
  const reduced = useReducedMotion();
  const roomRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const fine = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    fine.current = mq.matches;
    const room = roomRef.current;
    if (!room) return;
    if (!mq.matches || reduced) {
      if (!reduced) room.dataset.sway = '';
      return;
    }
    let raf = 0;
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * LERP;
      current.current.y += (target.current.y - current.current.y) * LERP;
      room.style.transform = `rotateX(${current.current.x.toFixed(3)}deg) rotateY(${current.current.y.toFixed(3)}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!fine.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    target.current = { y: nx * MAX_TILT_Y, x: -ny * MAX_TILT_X };
  };
  const onPointerLeave = () => {
    target.current = { x: 0, y: 0 };
  };

  const shelves: ShelfItem[][] = [];
  for (let i = 0; i < items.length; i += PER_SHELF) shelves.push(items.slice(i, i + PER_SHELF));

  return (
    <div
      className="studio relative w-full [--depth:3.5rem] sm:[--depth:4.5rem]"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <style dangerouslySetInnerHTML={{ __html: STUDIO_CSS }} />
      <div ref={roomRef} className="studio-room relative">
        <div
          aria-hidden="true"
          className="studio-wall absolute -inset-x-[5%] -top-[7%] -bottom-[5%] rounded-[2rem] sm:rounded-[2.5rem] bg-[radial-gradient(70%_55%_at_50%_30%,#134650_0%,#0b2d34_45%,#071b20_100%)] shadow-[inset_0_0_120px_rgba(0,0,0,.6)]"
        />
        <ul aria-label="On the shelves" className="relative flex flex-col gap-7 sm:gap-9">
          {shelves.map((row, r) => (
            <li key={r} className="studio-shelf relative" style={{ ['--r' as string]: r } as CSSProperties}>
              <ul className="relative z-10 mx-[4%] grid grid-cols-3 items-end gap-3 px-1 sm:mx-[5%] sm:grid-cols-4 sm:gap-5">
                {row.map((it, i) => (
                  <li
                    key={it.href}
                    className={cn('studio-item relative', i === PER_SHELF - 1 && 'hidden sm:block')}
                    style={{ ['--d' as string]: r * PER_SHELF + i } as CSSProperties}
                  >
                    <Link
                      href={it.href}
                      aria-label={`${it.title}, ${it.price}`}
                      draggable={false}
                      className={cn(
                        'studio-card relative block aspect-[4/5] overflow-hidden rounded-[14px] shadow-[0_24px_40px_-20px_rgba(0,0,0,.8)] ring-1 outline-none focus-visible:ring-2 focus-visible:ring-[#7fd3dc] sm:rounded-[18px]',
                        it.tone === 'dark' ? 'bg-[#0b2b33] ring-white/10' : 'bg-surface-2 ring-white/40',
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized variants */}
                      <img
                        src={it.src}
                        srcSet={it.srcSet}
                        sizes="(min-width: 1024px) 180px, (min-width: 640px) 22vw, 28vw"
                        alt=""
                        width={480}
                        height={600}
                        draggable={false}
                        loading={r === 0 ? 'eager' : 'lazy'}
                        fetchPriority={r === 0 && i === 0 ? 'high' : 'auto'}
                        className="size-full object-cover"
                      />
                      <span className="absolute bottom-1.5 left-1.5 rounded-pill bg-paper/95 px-2 py-0.5 text-[11px] font-bold text-fg tabular-nums shadow sm:bottom-2 sm:left-2 sm:text-xs">
                        {it.price}
                      </span>
                    </Link>
                    <span
                      aria-hidden="true"
                      className="studio-tag pointer-events-none absolute inset-x-0 -bottom-9 hidden translate-y-2 truncate text-center text-xs font-semibold text-paper/90 opacity-0 transition-[opacity,transform] duration-300 sm:block"
                    >
                      {it.title}
                    </span>
                  </li>
                ))}
              </ul>
              <div
                aria-hidden="true"
                className="studio-plank relative mt-0 h-2.5 rounded-b-sm bg-[linear-gradient(to_bottom,#1a4c56,#0e3239)] shadow-[0_2px_0_rgba(255,255,255,.06)_inset] sm:h-3"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
