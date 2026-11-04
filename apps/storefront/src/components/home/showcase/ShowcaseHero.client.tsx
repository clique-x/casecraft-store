'use client';

import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useFinePointer } from '@/lib/device/use-fine-pointer';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import { chromeStore } from '@/lib/layout/chrome-store';
import { cn } from '@/lib/utils';
import { ORBIT, PLINTH, PRODUCT_ART, SLIDES, type ShowcaseArt, type ShowcaseSlide } from './showcase-data';
import './showcase.css';

/** Class names from showcase.css; all prefixed so they cannot collide with the rest of the site. */
const s = {
  arrow: 'sc-arrow',
  art: 'sc-art',
  backdrop: 'sc-backdrop',
  bar: 'sc-bar',
  bars: 'sc-bars',
  controlsLg: 'sc-controlsLg',
  copy: 'sc-copy',
  counter: 'sc-counter',
  cta: 'sc-cta',
  depth: 'sc-depth',
  dot: 'sc-dot',
  dots: 'sc-dots',
  dotsRow: 'sc-dotsRow',
  dragHint: 'sc-dragHint',
  eyebrow: 'sc-eyebrow',
  float: 'sc-float',
  glow: 'sc-glow',
  glowA: 'sc-glowA',
  glowB: 'sc-glowB',
  hero: 'sc-hero',
  hotspot: 'sc-hotspot',
  hotspotDot: 'sc-hotspotDot',
  hotspotLine: 'sc-hotspotLine',
  hotspotPill: 'sc-hotspotPill',
  layer: 'sc-layer',
  lede: 'sc-lede',
  orbit: 'sc-orbit',
  panel: 'sc-panel',
  panelCta: 'sc-panelCta',
  panelDepts: 'sc-panelDepts',
  panelTitle: 'sc-panelTitle',
  plinth: 'sc-plinth',
  stage: 'sc-stage',
  title: 'sc-title',
  titleLg: 'sc-titleLg',
  titleSm: 'sc-titleSm',
  track: 'sc-track',
  vignette: 'sc-vignette',
} as const;

/** Movement before a gesture counts as a drag rather than a tap. */
const SLOP_PX = 10;
/** Horizontal travel that changes the slide on release. */
const SWIPE_PX = 48;
/** Ambient float per product: duration and phase, so no two move in step. */
const FLOAT: Record<ShowcaseArt['id'], [string, string]> = {
  phone: ['7.5s', '0s'],
  buds: ['9s', '-3.2s'],
  guard: ['8.2s', '-5.4s'],
};

type Vars = CSSProperties & Record<`--${string}`, string | number>;

function poseVars(slide: ShowcaseSlide, art: ShowcaseArt): Vars {
  const sm = slide.sm[art.id];
  const lg = slide.lg[art.id];
  return {
    '--w-sm': art.width.sm,
    '--x-sm': sm.x,
    '--y-sm': sm.y,
    '--s-sm': sm.s,
    '--r-sm': sm.r,
    '--z-sm': sm.z,
    '--w-lg': art.width.lg,
    '--x-lg': lg.x,
    '--y-lg': lg.y,
    '--s-lg': lg.s,
    '--r-lg': lg.r,
    '--z-lg': lg.z,
  };
}

interface Drag {
  id: number;
  x: number;
  y: number;
  dx: number;
  /** null until the gesture's direction is known. */
  horizontal: boolean | null;
}

/**
 * Home hero: three curated states (Cases, Audio, Protection) of one product scene.
 * Arrows, indicators, keyboard arrows and horizontal swipes change the state; nothing advances on its own.
 */
export function ShowcaseHero() {
  const [index, setIndex] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const rootRef = useRef<HTMLElement>(null);
  const drag = useRef<Drag | null>(null);
  const swallowClick = useRef(false);
  const finePointer = useFinePointer();
  const reducedMotion = useReducedMotion();
  const count = SLIDES.length;
  const slide = SLIDES[index];

  const go = useCallback(
    (to: number) => {
      const next = (to + count) % count;
      setIndex(next);
      setAnnouncement(`${SLIDES[next].department}, ${next + 1} of ${count}`);
    },
    [count],
  );

  // The page chrome follows the hero: the header floats over it and the WhatsApp button waits below it on
  // phones. Activity runs this cleanup when the page is hidden, so the marker never outlives a visible hero.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.setAttribute('data-home-hero', '');
    chromeStore.setHeroPresent(true);
    return () => {
      el.removeAttribute('data-home-hero');
      chromeStore.setHeroPresent(false);
    };
  }, []);

  // Ambient motion pauses while the hero is off screen or the tab is hidden.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let onScreen = true;
    const apply = () => el.toggleAttribute('data-paused', !onScreen || document.hidden);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      apply();
    });
    io.observe(el);
    document.addEventListener('visibilitychange', apply);
    apply();
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', apply);
    };
  }, []);

  // Pointer parallax for mice only; touch screens get the swipe instead.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !finePointer || reducedMotion) return;
    let raf = 0;
    let px = 0;
    let py = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width) * 2 - 1;
      py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (el.hasAttribute('data-paused')) return;
        el.style.setProperty('--px', px.toFixed(3));
        el.style.setProperty('--py', py.toFixed(3));
      });
    };
    const reset = () => {
      el.style.setProperty('--px', '0');
      el.style.setProperty('--py', '0');
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', reset);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', reset);
      reset();
    };
  }, [finePointer, reducedMotion]);

  // ---- Swipe: horizontal drags change the slide; taps and vertical scrolls pass through untouched. ----

  const endDrag = (commit: boolean) => {
    const d = drag.current;
    drag.current = null;
    const el = rootRef.current;
    if (!d || !d.horizontal || !el) return;
    el.removeAttribute('data-dragging');
    el.style.setProperty('--drag', '0px');
    // A click can follow the pointerup of a drag; it must not open the link the finger started on.
    swallowClick.current = true;
    window.setTimeout(() => (swallowClick.current = false), 0);
    if (commit && Math.abs(d.dx) > SWIPE_PX) go(index + (d.dx < 0 ? 1 : -1));
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    // Mice drag only on the artwork, so the copy stays selectable.
    if (e.pointerType === 'mouse' && !(e.target as Element).closest('[data-stage]')) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, horizontal: null };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    const el = rootRef.current;
    if (!d || d.id !== e.pointerId || !el) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (d.horizontal === null) {
      if (Math.abs(dx) < SLOP_PX && Math.abs(dy) < SLOP_PX) return;
      d.horizontal = Math.abs(dx) > Math.abs(dy) * 1.2;
      if (!d.horizontal) {
        // Vertical intent: leave it to the page scroll.
        drag.current = null;
        return;
      }
      el.setPointerCapture(e.pointerId);
      el.setAttribute('data-dragging', '');
    }
    d.dx = dx;
    // Rubber band: the scene follows the finger, a little behind it.
    const follow = Math.max(-90, Math.min(90, dx * 0.35));
    el.style.setProperty('--drag', `${follow.toFixed(1)}px`);
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(index - 1);
    }
  };

  const indicator = (cls: string) =>
    SLIDES.map((sl, i) => (
      <button
        key={sl.id}
        type="button"
        className={cls}
        aria-label={`Show ${sl.department}`}
        aria-current={i === index ? 'true' : undefined}
        onClick={() => go(i)}
      >
        <span aria-hidden="true" />
      </button>
    ));

  return (
    <section
      ref={rootRef}
      id="hero"
      data-home-hero=""
      aria-roledescription="carousel"
      aria-label="Featured departments"
      className={s.hero}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => endDrag(true)}
      onPointerCancel={() => endDrag(false)}
      onClickCapture={(e) => {
        if (!swallowClick.current) return;
        swallowClick.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div aria-hidden="true" className={s.backdrop}>
        <div className={cn(s.glow, s.glowA)} />
        <div className={cn(s.glow, s.glowB)} />
        <div className={s.vignette} />
      </div>

      <div className={s.copy}>
        <p className={s.eyebrow}>Your world. Upgraded.</p>
        <h1 className={s.title}>
          <span className={s.titleSm}>
            Everyday tech.
            <br />
            Extraordinary
            <br />
            <em>style.</em>
          </span>
          <span className={s.titleLg}>
            Small upgrades.
            <br />
            <em>Extraordinary everyday.</em>
          </span>
        </h1>
        <p className={s.lede}>Discover accessories made for your world.</p>
        <Link href={slide.href} className={s.cta} aria-label={`Explore the collection: ${slide.department}`}>
          Explore the collection <ArrowUpRight className="size-5" strokeWidth={2.25} aria-hidden="true" />
        </Link>
      </div>

      <div className={s.stage} data-stage="">
        <div aria-hidden="true" className={s.art}>
          <div className={s.orbit} style={{ '--or-sm': slide.orbit.sm, '--or-lg': slide.orbit.lg } as Vars}>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static variants, no optimizer */}
              <img src={ORBIT.src} srcSet={ORBIT.srcSet} sizes={ORBIT.sizes} width={ORBIT.w} height={ORBIT.h} alt="" decoding="async" draggable={false} />
            </div>
          </div>
          <div className={s.plinth}>
            {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static variants, no optimizer */}
            <img src={PLINTH.src} srcSet={PLINTH.srcSet} sizes={PLINTH.sizes} width={PLINTH.w} height={PLINTH.h} alt="" decoding="async" draggable={false} />
          </div>
          <div className={s.track}>
            {PRODUCT_ART.map((art) => (
              <div key={art.id} className={s.layer} style={poseVars(slide, art)} data-layer={art.id}>
                <div className={s.depth} style={{ '--d': art.depth } as Vars}>
                  <div className={s.float} style={{ '--float-dur': FLOAT[art.id][0], '--float-delay': FLOAT[art.id][1] } as Vars}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static variants, no optimizer */}
                    <img
                      src={art.src}
                      srcSet={art.srcSet}
                      sizes={art.sizes}
                      width={art.w}
                      height={art.h}
                      alt=""
                      decoding="async"
                      fetchPriority={art.id === 'phone' ? 'high' : 'auto'}
                      draggable={false}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link key={slide.id} href={slide.hotspot.href} className={s.hotspot} style={{ '--hx': slide.hotspot.x, '--hy': slide.hotspot.y } as Vars}>
          <span className={s.hotspotPill}>
            {slide.hotspot.label} <ArrowUpRight className="size-4" strokeWidth={2.25} aria-hidden="true" />
          </span>
          <span aria-hidden="true" className={s.hotspotLine} />
          <span aria-hidden="true" className={s.hotspotDot} />
        </Link>
      </div>

      <div className={s.controlsLg} role="group" aria-label="Choose a department" onKeyDown={onKeyDown}>
        <p className={s.counter} aria-hidden="true">
          <b>{String(index + 1).padStart(2, '0')}</b> / {String(count).padStart(2, '0')}
        </p>
        <button type="button" className={s.arrow} aria-label="Previous department" onClick={() => go(index - 1)}>
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <div className={s.bars}>{indicator(s.bar)}</div>
        <button type="button" className={s.arrow} aria-label="Next department" onClick={() => go(index + 1)}>
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className={s.panel}>
        <div className="min-w-0">
          <p className={s.panelTitle}>{slide.edit}</p>
          <ul className={s.panelDepts} aria-label="Departments">
            {SLIDES.map((sl, i) => (
              <li key={sl.id} aria-current={i === index ? 'true' : undefined}>
                {sl.department}
              </li>
            ))}
          </ul>
        </div>
        <Link href={slide.href} className={s.panelCta} aria-label={`Explore collection: ${slide.department}`}>
          Explore collection <ArrowUpRight className="size-4" strokeWidth={2.25} aria-hidden="true" />
        </Link>
      </div>

      <div className={s.dotsRow}>
        <div className={s.dots} role="group" aria-label="Choose a department" onKeyDown={onKeyDown}>
          {indicator(s.dot)}
        </div>
        <p className={s.dragHint} aria-hidden="true">
          Drag to explore <MoveHorizontal className="size-5" strokeWidth={1.5} />
        </p>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </section>
  );
}

export default ShowcaseHero;
