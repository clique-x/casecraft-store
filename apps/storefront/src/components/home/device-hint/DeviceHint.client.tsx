'use client';

import { Smartphone } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { pickerSheet } from '@/lib/phone/picker-sheet-store';
import { useMyPhone } from '@/lib/phone/use-my-phone';
import './device-hint.css';

/** Once per tab session, and never once a phone is picked. */
const SEEN_KEY = 'gh:device-hint';
/** After the brand intro has gone (or after landing, when it does not play). */
const SHOW_DELAY_MS = 700;
const AUTO_HIDE_MS = 9000;
const LEAVE_MS = 260;
/** Scrolling past this hides the hint: the header moves and the visitor has moved on. */
const SCROLL_HIDE_PX = 24;
const EDGE_PX = 12;
/** The bubble's width in intro CSS terms: min(19rem, 100vw - 1.5rem). */
const BUBBLE_MAX_PX = 304;

interface Place {
  top: number;
  right: number;
  /** Arrow centre, measured from the bubble's right edge. */
  arrow: number;
  ring: { top: number; left: number; width: number; height: number };
}

function chip(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-device-chip]');
}

function measure(): Place | null {
  const el = chip();
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return null;
  const vw = document.documentElement.clientWidth;
  const width = Math.min(BUBBLE_MAX_PX, vw - 2 * EDGE_PX);
  // Right-aligned just past the button, but never past either edge of the screen.
  const right = Math.min(Math.max(EDGE_PX, vw - r.right - 4), vw - width - EDGE_PX);
  return {
    top: r.bottom + 12,
    right,
    arrow: vw - right - (r.left + r.width / 2),
    ring: { top: r.top, left: r.left, width: r.width, height: r.height },
  };
}

/**
 * A one-time pointer to "Find my device" in the header: a soft ring round the button and a small bubble with
 * Select device and Not now. Home page only. It never covers the page, never takes focus, and goes away on
 * any sign the visitor has seen it or moved on.
 */
export function DeviceHint() {
  const { phone } = useMyPhone();
  const [place, setPlace] = useState<Place | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [announce, setAnnounce] = useState('');
  const shown = useRef(false);

  const hide = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => {
      setPlace(null);
      setLeaving(false);
    }, LEAVE_MS);
  }, []);

  // Decide whether to show, once the intro (if any) has finished.
  useEffect(() => {
    if (phone || shown.current) return;
    try {
      if (sessionStorage.getItem(SEEN_KEY) === '1') return;
    } catch {
      return;
    }
    const root = document.documentElement;
    let timer = 0;
    let observer: MutationObserver | null = null;
    const show = () => {
      if (window.scrollY > SCROLL_HIDE_PX || pickerSheet.isOpen()) return;
      const p = measure();
      if (!p) return;
      shown.current = true;
      try {
        sessionStorage.setItem(SEEN_KEY, '1');
      } catch {}
      setPlace(p);
      setAnnounce('Tip: select your device to see what fits your phone.');
    };
    const start = () => {
      timer = window.setTimeout(show, SHOW_DELAY_MS);
    };
    if (root.hasAttribute('data-gh-intro')) {
      observer = new MutationObserver(() => {
        if (root.hasAttribute('data-gh-intro')) return;
        observer?.disconnect();
        observer = null;
        start();
      });
      observer.observe(root, { attributes: true, attributeFilter: ['data-gh-intro'] });
    } else start();
    return () => {
      observer?.disconnect();
      window.clearTimeout(timer);
    };
  }, [phone]);

  // While visible: follow resizes, and leave on scroll, Escape, a tap on the device button, or after a while.
  useLayoutEffect(() => {
    if (!place || leaving) return;
    const onResize = () => {
      const p = measure();
      if (p) setPlace(p);
      else hide();
    };
    const onScroll = () => {
      if (window.scrollY > SCROLL_HIDE_PX) hide();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };
    const el = chip();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('keydown', onKey);
    el?.addEventListener('click', hide);
    // The picker opened (and a phone may be picked there): the hint has done its job.
    const offSheet = pickerSheet.subscribe(() => {
      if (pickerSheet.isOpen()) hide();
    });
    const timer = window.setTimeout(hide, AUTO_HIDE_MS);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('keydown', onKey);
      el?.removeEventListener('click', hide);
      offSheet();
      window.clearTimeout(timer);
    };
  }, [place, leaving, hide]);

  return (
    <>
      <p className="sr-only" role="status">
        {announce}
      </p>
      {place && (
        <>
          <span
            aria-hidden="true"
            className="dh-ring"
            data-leaving={leaving ? '' : undefined}
            style={{ top: place.ring.top, left: place.ring.left, width: place.ring.width, height: place.ring.height }}
          />
          <div
            className="dh-bubble"
            data-leaving={leaving ? '' : undefined}
            role="group"
            aria-label="Tip"
            style={{ top: place.top, right: place.right, '--dh-arrow': `${place.arrow}px` } as CSSProperties}
          >
            <span aria-hidden="true" className="dh-arrow" />
            <div className="dh-body">
              <span aria-hidden="true" className="dh-icon">
                <Smartphone className="size-4" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="dh-title">Select your device</p>
                <p className="dh-text">We&rsquo;ll show the covers and protection that fit it.</p>
              </div>
            </div>
            <div className="dh-actions">
              <button type="button" className="dh-later" onClick={hide}>
                Not now
              </button>
              <button
                type="button"
                className="dh-go"
                onClick={() => {
                  hide();
                  pickerSheet.open();
                }}
              >
                Select device
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default DeviceHint;
