'use client';

import { useEffect, useLayoutEffect, useMemo } from 'react';
import { getPhoto, photoSrc, srcSetFor, type PhotoEntry } from '@/lib/catalog/photos';
import { featuredStore, heroState, type ChangeSource } from '@/lib/hero-state';
import { cutoutAlt } from './CaseCutout';
import { BEAT_MS, HERO_SIZES } from './heroBus';
import type { SlotRole } from './HeroSlot.client';

export type GsapModule = typeof gsap;
export type ScrollTriggerClass = typeof import('gsap/ScrollTrigger').ScrollTrigger;

export interface GsapBundle {
  gsap: GsapModule;
  ScrollTrigger: ScrollTriggerClass;
}

let gsapPromise: Promise<GsapBundle> | null = null;

/** Lazy, shared with the provider's chunk; the static tier never calls it. */
export function loadGsap(): Promise<GsapBundle> {
  gsapPromise ??= Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
    import('@/components/motion/GsapProvider'),
  ]).then(([core, st, provider]) => {
    provider.registerGsap();
    return { gsap: core.gsap, ScrollTrigger: st.ScrollTrigger };
  });
  return gsapPromise;
}

interface Slot {
  el: HTMLElement;
  img: HTMLImageElement;
}

interface Rest {
  cx: number;
  cy: number;
  cz: number;
  cs: number;
  co: number;
  cry: number;
  cb: number;
}

interface Plan {
  nextIdx: number;
  entering: Slot;
  exiting: Slot;
  newBack: Slot;
  newIncoming: Slot;
  nextEntry: PhotoEntry;
  afterEntry: PhotoEntry | undefined;
  after2Entry: PhotoEntry | undefined;
  sign: 1 | -1;
}

interface Pending {
  index: number;
  source: ChangeSource;
  /** Move even when the store already sits at `index` (the DOM is catching up with it). */
  force: boolean;
  crossfade: boolean;
}

export interface BeatsOptions {
  section: HTMLElement | null;
  gsap: GsapModule | null;
  /** False on the static tier, under reduced motion and before GSAP arrives: role swaps crossfade in CSS. */
  animated: boolean;
  /** Tier full: blur, sheen sweep and halo shift join the beat. */
  full: boolean;
  isLg: boolean;
  onSettle?: (source: ChangeSource) => void;
}

export interface BeatsApi {
  beat(dir: 1 | -1, source: ChangeSource): void;
  goTo(index: number, source: ChangeSource): void;
  /** Moves the DOM to the store's current index when something else changed the store. */
  sync(source: ChangeSource): void;
  /** Replaces the cast: the front stays if it belongs to the new cast, else the stage moves to item 0. */
  setCast(ids: number[], source: ChangeSource, crossfade: boolean): void;
  /** Gives the incoming slot its deferred URLs and returns the ids still worth warming, in cast order. */
  warm(): number[];
}

const INLINE_VARS = ['--cx', '--cy', '--cz', '--cry', '--cs', '--co', '--cb', '--sweep'] as const;
const SEC = BEAT_MS / 1000;

function wrap(i: number): number {
  const n = Math.max(1, featuredStore.limit());
  return ((i % n) + n) % n;
}

function roleOf(slot: Slot): SlotRole {
  const r = slot.el.dataset.role;
  return r === 'front' || r === 'backstage' || r === 'incoming' ? r : 'incoming';
}

function idOf(slot: Slot): number | null {
  const v = Number(slot.el.dataset.id);
  return Number.isFinite(v) && v > 0 ? v : null;
}

/** The reflection under the cutout shows the same bitmap, so it follows every source swap. */
function reflectOf(slot: Slot): HTMLImageElement | null {
  return slot.el.querySelector<HTMLImageElement>('.hero-reflect');
}

function assign(slot: Slot, entry: PhotoEntry): void {
  if (idOf(slot) === entry.id && slot.img.getAttribute('src')) return;
  const { img, el } = slot;
  for (const target of [img, reflectOf(slot)]) {
    if (!target) continue;
    target.sizes = HERO_SIZES;
    target.srcset = srcSetFor(entry);
    target.src = photoSrc(entry.id, 480);
    target.width = entry.imageW;
    target.height = entry.imageH;
    target.removeAttribute('data-src');
    target.removeAttribute('data-srcset');
  }
  img.alt = cutoutAlt(entry);
  img.dataset.cut = entry.cut;
  el.dataset.id = String(entry.id);
  el.dataset.cut = entry.cut;
  el.style.setProperty('--ar', `${entry.imageW / entry.imageH}`);
}

function clearInline(slot: Slot): void {
  for (const name of INLINE_VARS) slot.el.style.removeProperty(name);
}

function setRole(slot: Slot, role: SlotRole): void {
  slot.el.dataset.role = role;
}

function dropLift(slot: Slot): void {
  slot.el.querySelector('.hero-case-lift')?.classList.remove('is-lifted');
}

/** The scroll scrub's live backstage lift, so a beat can hand it between slots without a jump. */
function readBackY(section: HTMLElement | null): number {
  return section ? parseFloat(section.style.getPropertyValue('--scroll-y2')) || 0 : 0;
}

function restFor(role: SlotRole, backX: number, blur: number, backY: number): Rest {
  if (role === 'front') return { cx: 0, cy: 0, cz: 0, cs: 1, co: 1, cry: 0, cb: 0 };
  const backstage = role === 'backstage';
  return { cx: backX, cy: backstage ? backY : 0, cz: -220, cs: 0.78, co: backstage ? 0.55 : 0, cry: 0, cb: blur };
}

function restVars(r: Rest): Record<string, string | number> {
  return {
    '--cx': `${r.cx}%`,
    '--cy': `${r.cy}px`,
    '--cz': `${r.cz}px`,
    '--cs': r.cs,
    '--co': r.co,
    '--cry': `${r.cry}deg`,
    '--cb': `${r.cb}px`,
  };
}

function entryAt(index: number): PhotoEntry | undefined {
  const cast = featuredStore.cast();
  if (cast.length === 0) return undefined;
  const id = cast[((index % cast.length) + cast.length) % cast.length];
  return id === undefined ? undefined : getPhoto(id);
}

function readSlots(section: HTMLElement): Slot[] {
  const slots: Slot[] = [];
  for (const el of section.querySelectorAll<HTMLElement>('.hero-case')) {
    const img = el.querySelector('img');
    if (img) slots.push({ el, img });
  }
  return slots;
}

interface Engine extends BeatsApi {
  setOptions(next: BeatsOptions): void;
  options(): BeatsOptions;
  /** Jumps a running beat to its end state. */
  flush(): void;
}

/** The beat engine, outside React: slot bookkeeping, the timeline and the one-deep queue. */
function createBeatEngine(initial: BeatsOptions): Engine {
  let opts = initial;
  const getOpts = () => opts;
  let timeline: gsap.core.Timeline | null = null;
  let pending: Pending | null = null;
  let runningTarget: number | null = null;
  let settingCast = false;

  const slotsOf = (): Slot[] => {
    const section = getOpts().section;
    return section ? readSlots(section) : [];
  };

  const byRole = (slots: Slot[], role: SlotRole): Slot | undefined => slots.find((s) => roleOf(s) === role);

  const plan = (nextIdx: number, dir: 1 | -1): Plan | null => {
    const slots = slotsOf();
    if (slots.length < 3) return null;
    const front = byRole(slots, 'front') ?? slots[0];
    const back = byRole(slots, 'backstage') ?? slots[1];
    const incoming = slots.find((s) => s !== front && s !== back) ?? slots[2];
    const nextEntry = entryAt(nextIdx);
    if (!nextEntry) return null;
    const afterEntry = entryAt(nextIdx + 1);
    const after2Entry = entryAt(nextIdx + 2);

    const entering = idOf(back) === nextEntry.id ? back : incoming;
    const other = entering === back ? incoming : back;
    const newBack = afterEntry && idOf(front) === afterEntry.id && entering !== front ? front : other;
    const newIncoming = newBack === front ? other : front;
    const sign: 1 | -1 = entering === back ? 1 : dir;
    return { nextIdx, entering, exiting: front, newBack, newIncoming, nextEntry, afterEntry, after2Entry, sign };
  };

  const run = (job: Pending): void => {
    const n = featuredStore.limit();
    if (n < 1) return;
    const current = featuredStore.index();
    const nextIdx = wrap(job.index);
    if (nextIdx === current && !job.force) return;
    const forward = (nextIdx - current + n) % n <= n / 2;
    const p = plan(nextIdx, forward ? 1 : -1);
    if (!p) {
      featuredStore.set(nextIdx, job.source);
      return;
    }
    if (idOf(p.exiting) === p.nextEntry.id) return;
    const { gsap: g, animated } = getOpts();
    if (g && animated && !job.crossfade) animate(g, p, job.source);
    else applyStatic(p, job.source);
  };

  const finish = (p: Plan, source: ChangeSource) => {
    const { section, onSettle } = getOpts();
    setRole(p.entering, 'front');
    setRole(p.newBack, 'backstage');
    setRole(p.newIncoming, 'incoming');
    for (const s of [p.entering, p.newBack, p.newIncoming]) clearInline(s);
    for (const s of [p.exiting, p.newBack, p.newIncoming]) dropLift(s);
    section?.style.removeProperty('--halo-bx');
    if (p.after2Entry) assign(p.newIncoming, p.after2Entry);
    section?.setAttribute('data-front-cut', p.nextEntry.cut);
    heroState.beatActive = false;
    runningTarget = null;
    timeline = null;
    onSettle?.(source);
    const queued = pending;
    pending = null;
    if (queued) run(queued);
  };

  const applyStatic = (p: Plan, source: ChangeSource) => {
    // Busy until finish(), so the store subscription does not re-enter run() from featuredStore.set.
    heroState.beatActive = true;
    runningTarget = p.nextIdx;
    assign(p.entering, p.nextEntry);
    if (p.afterEntry) assign(p.newBack, p.afterEntry);
    if (featuredStore.index() !== p.nextIdx) featuredStore.set(p.nextIdx, source);
    finish(p, source);
  };

  const animate = (g: GsapModule, p: Plan, source: ChangeSource) => {
    const { isLg, full, section } = getOpts();
    const backX = isLg ? 64 : 72;
    const blur = isLg && full ? 2 : 0;
    const backY = readBackY(section);
    const { sign, entering: E, exiting: F, newBack: NB, newIncoming: NI } = p;
    const slots = [F, NB, NI, E].filter((s, i, arr) => arr.indexOf(s) === i);

    // Pin every slot to its resting values so the role swap mid-beat changes nothing visible.
    for (const s of slots) g.set(s.el, restVars(restFor(roleOf(s), backX, blur, backY)));
    if (roleOf(E) === 'incoming') {
      assign(E, p.nextEntry);
      g.set(E.el, { '--cx': `${sign * backX}%`, '--co': 0 });
    }

    heroState.beatActive = true;
    runningTarget = p.nextIdx;
    const tl = g.timeline({
      paused: true,
      defaults: { ease: 'power3.inOut' },
      onComplete: () => finish(p, source),
    });

    // TURN
    tl.to(F.el, { '--cry': `${-sign * 28}deg`, '--cx': `${-sign * (isLg ? 12 : 6)}%`, '--cs': 0.92, duration: 0.3 * SEC }, 0);
    tl.to(E.el, { '--cry': `${sign * 30}deg`, duration: 0.3 * SEC }, 0);
    if (roleOf(E) === 'incoming') tl.to(E.el, { '--co': 0.55, duration: 0.3 * SEC }, 0);

    // SWAP
    tl.to(F.el, { '--cx': `${-sign * 120}%`, '--cry': `${-sign * 45}deg`, '--cz': '-60px', duration: 0.4 * SEC }, 0.3 * SEC);
    tl.to(F.el, { '--co': 0, duration: 0.22 * SEC }, 0.48 * SEC);
    tl.to(E.el, { '--cx': '0%', '--cy': '0px', '--cz': '0px', '--cs': 1, '--co': 1, duration: 0.4 * SEC }, 0.3 * SEC);
    tl.to(E.el, { '--cry': '0deg', ease: 'expo.out', duration: 0.4 * SEC }, 0.3 * SEC);
    if (blur) tl.to(E.el, { '--cb': '0px', duration: 0.4 * SEC }, 0.3 * SEC);
    // A visible backstage that is neither entering nor the exiting front (prev beats, far goTo)
    // slides out before the new backstage fades in at 0.7 s, instead of popping at settle.
    for (const s of [NB, NI]) {
      if (s !== F && roleOf(s) === 'backstage') {
        tl.to(s.el, { '--co': 0, '--cx': `${backX * 1.5}%`, duration: 0.3 * SEC }, 0.3 * SEC);
      }
    }
    tl.call(
      () => {
        featuredStore.set(p.nextIdx, source);
        setRole(E, 'front');
        setRole(NB, 'backstage');
        setRole(NI, 'incoming');
      },
      [],
      0.5 * SEC,
    );

    // New backstage rises in behind
    tl.call(
      () => {
        if (p.afterEntry) assign(NB, p.afterEntry);
        g.set(NB.el, { ...restVars(restFor('backstage', backX, blur, backY)), '--co': 0 });
      },
      [],
      0.7 * SEC,
    );
    tl.to(NB.el, { '--co': 0.55, duration: 0.3 * SEC }, 0.7 * SEC);

    // SETTLE
    if (full) {
      tl.fromTo(E.el, { '--sweep': -1 }, { '--sweep': 0, ease: 'sine.out', duration: 0.3 * SEC }, 0.7 * SEC);
      if (section) {
        tl.fromTo(section, { '--halo-bx': `${sign * 6}%` }, { '--halo-bx': '0%', ease: 'sine.out', duration: 0.3 * SEC }, 0.7 * SEC);
      }
    }

    timeline = tl;
    tl.play();
  };

  const request = (index: number, source: ChangeSource, force = false, crossfade = false) => {
    const job: Pending = { index, source, force, crossfade };
    if (heroState.beatActive) {
      pending = job;
      return;
    }
    run(job);
  };

  return {
    beat(dir, source) {
      if (featuredStore.limit() < 2) return;
      const base = pending ? pending.index : (runningTarget ?? featuredStore.index());
      request(base + dir, source);
    },
    goTo(index, source) {
      request(index, source);
    },
    sync(source) {
      if (settingCast) return;
      const front = byRole(slotsOf(), 'front');
      if (front && idOf(front) === featuredStore.itemId()) return;
      request(featuredStore.index(), source, true);
    },
    setCast(ids, source, crossfade) {
      settingCast = true;
      try {
        featuredStore.setCast(ids);
      } finally {
        settingCast = false;
      }
      const slots = slotsOf();
      const front = byRole(slots, 'front');
      if (!front) return;
      const cast = featuredStore.cast();
      const frontId = idOf(front);
      const at = frontId === null ? -1 : cast.indexOf(frontId);
      if (at >= 0) {
        if (featuredStore.index() !== at) featuredStore.set(at, 'auto');
        const back = byRole(slots, 'backstage');
        const incoming = byRole(slots, 'incoming');
        const afterEntry = entryAt(at + 1);
        const after2Entry = entryAt(at + 2);
        if (back && afterEntry && cast.length > 1) assign(back, afterEntry);
        if (incoming && after2Entry && cast.length > 2 && incoming.img.getAttribute('src')) assign(incoming, after2Entry);
        return;
      }
      if (cast.length === 0) return;
      request(0, source, true, crossfade);
    },
    warm() {
      const slots = slotsOf();
      for (const s of slots) {
        for (const target of [s.img, reflectOf(s)]) {
          if (!target) continue;
          const { src, srcset } = target.dataset;
          if (!src) continue;
          target.sizes = HERO_SIZES;
          if (srcset) target.srcset = srcset;
          target.src = src;
          target.removeAttribute('data-src');
          target.removeAttribute('data-srcset');
        }
      }
      const shown = new Set(slots.map(idOf));
      return featuredStore.cast().filter((id) => !shown.has(id));
    },
    flush() {
      timeline?.progress(1);
    },
    setOptions(next) {
      opts = next;
    },
    options() {
      return opts;
    },
  };
}

/**
 * Owns which slot shows which cover. A beat is a paused GSAP timeline played once;
 * without GSAP the same role swap runs as a CSS crossfade. Only `data-role` and
 * inline custom properties are written, never React state.
 */
export function useHeroBeats(opts: BeatsOptions): BeatsApi {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- created once; options are pushed in below
  const engine = useMemo(() => createBeatEngine(opts), []);
  useLayoutEffect(() => {
    engine.setOptions(opts);
  });

  // Changes made to the store by anyone else (fallback paths) still move the DOM.
  useEffect(() => {
    return featuredStore.subscribe(() => {
      if (heroState.beatActive) return;
      const section = engine.options().section;
      if (!section) return;
      const front = readSlots(section).find((s) => roleOf(s) === 'front');
      if (!front || idOf(front) === featuredStore.itemId()) return;
      engine.sync(featuredStore.lastSource());
    });
  }, [engine]);

  // Finish any running beat if the section goes away or the mode flips under it.
  const animated = opts.animated;
  const section = opts.section;
  useEffect(() => () => engine.flush(), [engine, animated, section]);

  return engine;
}
