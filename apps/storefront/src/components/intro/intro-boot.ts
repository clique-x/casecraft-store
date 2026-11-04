import { INTRO_COLOR, INTRO_COPY, INTRO_DOM, INTRO_EASE, INTRO_LOGO, INTRO_PATH, INTRO_SESSION_KEY, INTRO_TIMING, INTRO_Z } from './intro-config';

interface IntroApi {
  /** The overlay has hydrated: the rest of the page can now be made inert. */
  mount(el: HTMLElement): void;
  /** The overlay left the DOM (client navigation): end at once and restore the page. */
  release(): void;
  /** Development only: forget this session's visit and reload to watch the intro again. */
  replay?(): void;
}

declare global {
  interface Window {
    __ghIntro?: IntroApi;
  }
}

interface BootConfig {
  path: string;
  key: string;
  dev: boolean;
  state: string;
  slow: string;
  noLogo: string;
  overlayId: string;
  skip: string;
  status: string;
  logo: string;
  critical: string;
  min: number;
  minReduced: number;
  slowAt: number;
  hard: number;
  /** From "leave" to removing the overlay: the exit plus the last hero reveal. */
  tail: number;
  tailSkip: number;
  tailReduced: number;
  slowText: string;
  preload: { href: string; srcset: string; sizes: string };
  /** Injected before first paint: the curtain that covers the page until the overlay is parsed, plus timing variables. */
  css: string;
}

/**
 * Runs inline in <head>, before anything paints, so it must be self-contained: it is serialised with
 * toString() and may not touch imports or closures. Plays the intro once per tab session on the home page,
 * decides when the overlay leaves (choreography done and hero image ready, never after the hard maximum)
 * and restores the page on every way out. Any error ends the intro.
 */
function introBoot(c: BootConfig): void {
  const w = window;
  const d = document;
  const root = d.documentElement;
  const noop = function () {};

  let store: Storage | null = null;
  try {
    store = w.sessionStorage;
    store.getItem(c.key);
  } catch {
    store = null;
  }
  const api: IntroApi = { mount: noop, release: noop };
  if (c.dev) {
    api.replay = function () {
      try {
        if (store) store.removeItem(c.key);
      } catch {}
      w.location.reload();
    };
  }
  w.__ghIntro = api;

  const hidden = d.visibilityState === 'hidden';
  const forced = c.dev && /[?&]intro(?:[=&]|$)/.test(w.location.search);
  // Without storage the visit cannot be remembered, so the intro stays off rather than replaying on every load.
  const seen = !store || store.getItem(c.key) === '1';
  // Any visible page load counts as the session's visit; a background tab does not.
  if (store && !hidden) {
    try {
      store.setItem(c.key, '1');
    } catch {}
  }
  if (w.location.pathname !== c.path || hidden || (seen && !forced)) return;

  const t0 = w.performance.now();
  const reduced = !!w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const minimum = reduced ? c.minReduced : c.min;
  const timers: number[] = [];
  const offs: Array<() => void> = [];
  const inerted: Element[] = [];
  let phase = 0; // 0 playing, 1 leaving, 2 done
  let ready = false;
  let watching = false;
  let locked = false;
  let overlay: HTMLElement | null = null;
  let prevOverflow = '';
  let prevGutter = '';
  let style: HTMLStyleElement | null = null;

  function elapsed() {
    return w.performance.now() - t0;
  }
  function later(fn: () => void, ms: number) {
    timers.push(w.setTimeout(fn, Math.max(0, ms)));
  }
  function on(target: EventTarget, type: string, fn: EventListener, capture?: boolean) {
    target.addEventListener(type, fn, capture);
    offs.push(function () {
      target.removeEventListener(type, fn, capture);
    });
  }

  function lockScroll() {
    if (locked) return;
    locked = true;
    prevOverflow = root.style.overflow;
    prevGutter = root.style.getPropertyValue('scrollbar-gutter');
    root.style.overflow = 'hidden';
    // Keeps the scrollbar's space while it is hidden, so the page does not shift sideways when it returns.
    root.style.setProperty('scrollbar-gutter', 'stable');
  }
  function makeInert(el: Element) {
    for (let n: Element = el; n !== d.body && n.parentElement; n = n.parentElement) {
      const siblings = n.parentElement.children;
      for (let i = 0; i < siblings.length; i++) {
        const s = siblings[i];
        if (s !== n && !s.hasAttribute('inert') && !/^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(s.tagName)) {
          s.setAttribute('inert', '');
          inerted.push(s);
        }
      }
    }
  }
  function restore() {
    while (inerted.length) inerted.pop()!.removeAttribute('inert');
    if (locked) {
      locked = false;
      root.style.overflow = prevOverflow;
      if (prevGutter) root.style.setProperty('scrollbar-gutter', prevGutter);
      else root.style.removeProperty('scrollbar-gutter');
    }
  }
  function skipButton(): HTMLElement | null {
    return overlay ? overlay.querySelector<HTMLElement>('[' + c.skip + ']') : null;
  }

  function finish() {
    if (phase === 2) return;
    phase = 2;
    while (timers.length) w.clearTimeout(timers.pop());
    while (offs.length) offs.pop()!();
    restore();
    root.removeAttribute(c.state);
    root.removeAttribute(c.slow);
    root.removeAttribute(c.noLogo);
    if (style && style.parentNode) style.parentNode.removeChild(style);
    api.mount = noop;
    api.release = noop;
  }

  function leave(fast: boolean) {
    if (phase !== 0) return;
    phase = 1;
    const active = d.activeElement;
    const focusInside = !!overlay && !!active && overlay.contains(active);
    root.setAttribute(c.state, fast ? 'skip' : 'leave');
    root.removeAttribute(c.slow);
    restore();
    // The skip button is about to disappear; hand focus to the content it was hiding.
    if (focusInside) {
      const main = d.getElementById('main');
      if (main) {
        if (!main.hasAttribute('tabindex')) {
          main.setAttribute('tabindex', '-1');
          main.setAttribute('data-gh-intro-focus', '');
          main.addEventListener(
            'blur',
            function () {
              main.removeAttribute('tabindex');
              main.removeAttribute('data-gh-intro-focus');
            },
            { once: true },
          );
        }
        main.focus({ preventScroll: true });
      }
    }
    later(finish, reduced ? c.tailReduced : fast ? c.tailSkip : c.tail);
  }

  function tryLeave() {
    if (phase === 0 && ready && elapsed() >= minimum) leave(false);
  }

  function watch() {
    if (watching || !overlay) return;
    watching = true;
    const images = Array.prototype.slice.call(d.querySelectorAll<HTMLImageElement>(c.critical)) as HTMLImageElement[];
    let pending = images.length + 1;
    const one = function () {
      pending -= 1;
      if (pending === 0) {
        ready = true;
        tryLeave();
      }
    };
    const decoded = function (img: HTMLImageElement) {
      if (img.decode) img.decode().then(one, one);
      else one();
    };
    images.forEach(function (img) {
      if (img.complete) decoded(img);
      else {
        img.addEventListener('load', function () { decoded(img); }, { once: true });
        img.addEventListener('error', one, { once: true });
      }
    });
    const fonts = d.fonts;
    if (fonts && fonts.ready) fonts.ready.then(one, one);
    else one();
  }

  function attach() {
    if (phase === 2) return;
    overlay = overlay || d.getElementById(c.overlayId);
    // No overlay on this page (an error page, a changed home): nothing to play.
    if (!overlay) finish();
    else watch();
  }

  try {
    root.setAttribute(c.state, 'play');
    style = d.createElement('style');
    style.textContent = c.css;
    d.head.appendChild(style);
    lockScroll();

    // The logo sits in a hidden, lazy image so repeat visits never download it; fetch it now that it will show.
    const link = d.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = c.preload.href;
    link.setAttribute('imagesrcset', c.preload.srcset);
    link.setAttribute('imagesizes', c.preload.sizes);
    d.head.appendChild(link);

    // Skip intro (and Escape) work before React hydrates.
    on(d, 'click', function (e) {
      const t = e.target as Element | null;
      if (phase === 0 && t && t.closest && t.closest('[' + c.skip + ']')) {
        e.preventDefault();
        leave(true);
      }
    }, true);
    on(d, 'keydown', function (e) {
      if (phase !== 0) return;
      const k = (e as KeyboardEvent).key;
      if (k === 'Escape') leave(true);
      else if (k === 'Tab') {
        // The skip button is the only control while the page is covered.
        const b = skipButton();
        if (b) {
          e.preventDefault();
          b.focus({ preventScroll: true });
        }
      }
    }, true);
    on(d, 'focusin', function (e) {
      if (phase !== 0 || !overlay) return;
      const t = e.target as Node | null;
      if (t && !overlay.contains(t)) {
        const b = skipButton();
        if (b) b.focus({ preventScroll: true });
      }
    }, true);
    // A logo that fails to load is hidden; the text credit stays.
    on(d, 'error', function (e) {
      const t = e.target as Element | null;
      if (t && t.hasAttribute && t.hasAttribute(c.logo)) root.setAttribute(c.noLogo, '');
    }, true);
    on(d, 'visibilitychange', function () {
      if (d.visibilityState !== 'visible') return;
      if (elapsed() >= c.hard) leave(false);
      else tryLeave();
    });
    on(w, 'pageshow', function (e) {
      if ((e as PageTransitionEvent).persisted) finish();
    });
    on(w, 'popstate', finish);

    api.mount = function (el: HTMLElement) {
      if (phase !== 0) return;
      overlay = el;
      makeInert(el);
      watch();
    };
    api.release = finish;

    if (d.readyState === 'loading') on(d, 'DOMContentLoaded', attach);
    else attach();

    later(tryLeave, minimum);
    later(function () {
      if (phase !== 0) return;
      root.setAttribute(c.slow, '');
      const status = overlay ? overlay.querySelector('[' + c.status + ']') : null;
      if (status) status.textContent = c.slowText;
    }, c.slowAt);
    later(function () {
      leave(false);
    }, c.hard);
  } catch {
    finish();
  }
}

function ms(n: number) {
  return `${n}ms`;
}

/** The inline <head> script: the controller above, called with values from intro-config.ts. */
export function introBootScript(): string {
  const t = INTRO_TIMING;
  const lastReveal = t.revealDelays[t.revealDelays.length - 1] + t.revealDuration;
  const lastRevealSkip = t.revealDelaysSkip[t.revealDelaysSkip.length - 1] + t.revealDurationSkip;
  const vars: Record<string, string> = {
    '--gi-glow': ms(t.glowIn),
    '--gi-arc-delay': ms(t.arcDelay),
    '--gi-arc-dur': ms(t.arcDuration),
    '--gi-word-delay': ms(t.wordDelay),
    '--gi-word-dur': ms(t.wordDuration),
    '--gi-hub-lag': ms(t.hubLag),
    '--gi-credit-delay': ms(t.creditDelay),
    '--gi-credit-dur': ms(t.creditDuration),
    '--gi-logo-delay': ms(t.logoDelay),
    '--gi-logo-dur': ms(t.logoDuration),
    '--gi-exit': ms(t.exit),
    '--gi-exit-skip': ms(t.exitSkip),
    '--gi-r1': ms(t.revealDelays[0]),
    '--gi-r2': ms(t.revealDelays[1]),
    '--gi-r3': ms(t.revealDelays[2]),
    '--gi-reveal': ms(t.revealDuration),
    '--gi-r1-skip': ms(t.revealDelaysSkip[0]),
    '--gi-r2-skip': ms(t.revealDelaysSkip[1]),
    '--gi-r3-skip': ms(t.revealDelaysSkip[2]),
    '--gi-reveal-skip': ms(t.revealDurationSkip),
    '--gi-ease-out': INTRO_EASE.out,
    '--gi-ease-sweep': INTRO_EASE.sweep,
    '--gi-ease-exit': INTRO_EASE.exit,
    '--gi-night': INTRO_COLOR.night,
    '--gi-teal': INTRO_COLOR.teal,
    '--gi-ivory': INTRO_COLOR.ivory,
    '--gi-mint': INTRO_COLOR.mint,
    '--gi-aqua': INTRO_COLOR.aqua,
    '--gi-z': String(INTRO_Z),
  };
  const state = INTRO_DOM.stateAttr;
  // One backdrop for the overlay and for <html>, so the scrollbar's reserved gutter (classic scrollbars) matches it.
  const backdrop = `radial-gradient(90% 70% at 50% 44%, ${INTRO_COLOR.teal} 0%, #001d21 48%, ${INTRO_COLOR.night} 100%)`;
  vars['--gi-backdrop'] = `${backdrop}, ${INTRO_COLOR.night}`;
  // Fail-safe: should the controller ever stall, the curtain gives way on its own after 4.6 s.
  const css =
    `html[${state}]{background:${backdrop} fixed,${INTRO_COLOR.night};${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')}}` +
    `html[${state}="play"] body::before{content:"";position:fixed;top:0;right:0;bottom:0;left:0;z-index:${INTRO_Z - 1};background:${INTRO_COLOR.night};animation:gh-intro-failsafe .3s linear ${t.hardMaximum + 600}ms forwards}` +
    `@keyframes gh-intro-failsafe{to{opacity:0;visibility:hidden}}`;

  const config: BootConfig = {
    path: INTRO_PATH,
    key: INTRO_SESSION_KEY,
    dev: process.env.NODE_ENV !== 'production',
    state,
    slow: INTRO_DOM.slowAttr,
    noLogo: INTRO_DOM.noLogoAttr,
    overlayId: INTRO_DOM.overlayId,
    skip: INTRO_DOM.skipAttr,
    status: INTRO_DOM.statusAttr,
    logo: INTRO_DOM.logoAttr,
    critical: INTRO_DOM.critical,
    min: t.minimum,
    minReduced: t.minimumReduced,
    slowAt: t.slowNotice,
    hard: t.hardMaximum,
    tail: Math.max(t.exit, lastReveal) + 60,
    tailSkip: Math.max(t.exitSkip, lastRevealSkip) + 60,
    tailReduced: 380,
    slowText: INTRO_COPY.slow,
    preload: { href: INTRO_LOGO.src, srcset: INTRO_LOGO.srcSet, sizes: INTRO_LOGO.sizes },
    css,
  };
  return `(${introBoot.toString()})(${JSON.stringify(config).replace(/</g, '\\u003c')})`;
}
