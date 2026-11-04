'use client';

import { useEffect, useRef } from 'react';
import { BRAND_NAME } from '@/lib/brand';
import { INTRO_COPY, INTRO_DOM, INTRO_LOGO } from './intro-config';
import './intro.css';

/** "GadgetsHub" splits into the two halves of the wordmark; any other brand name shows whole. */
const WORD = /^(.*?)(Hub)$/.exec(BRAND_NAME);

/**
 * The home page's brand intro overlay. It ships with display:none, so without JavaScript (or on a repeat
 * visit) it never shows; the controller in the root layout's <head> (intro-boot.ts) reveals it before
 * first paint, times it and removes it. This component only hands the hydrated overlay to the controller,
 * which then makes the rest of the page inert, and ends the intro if the overlay leaves the DOM.
 */
export function BrandIntro() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    window.__ghIntro?.mount(el);
    return () => {
      // Strict Mode re-runs effects on a live element; only a real unmount (client navigation away) ends it.
      requestAnimationFrame(() => {
        if (!el.isConnected) window.__ghIntro?.release();
      });
    };
  }, []);

  return (
    // Inline display:none keeps it out of sight, out of the accessibility tree and its lazy logo unfetched, even
    // if the stylesheet never loads; only the controller's <html> attribute plus intro.css can show it.
    <div ref={ref} id={INTRO_DOM.overlayId} className="gh-intro" style={{ display: 'none' }}>
      <div className="gh-intro-glow" aria-hidden="true" />

      <div className="gh-intro-stage">
        <div className="gh-intro-mark" aria-hidden="true">
          <svg className="gh-intro-orbit" viewBox="0 0 600 220" focusable="false">
            <defs>
              <linearGradient id="gh-intro-arc-stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#a6f0dc" stopOpacity="0" />
                <stop offset="0.24" stopColor="#a6f0dc" stopOpacity="0.5" />
                <stop offset="0.56" stopColor="#f6f1e8" stopOpacity="0.95" />
                <stop offset="0.86" stopColor="#a6f0dc" stopOpacity="0.6" />
                <stop offset="1" stopColor="#a6f0dc" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            {/* An ellipse round the wordmark, tilted: the back half sweeps in, the front half only glimmers. */}
            <g transform="rotate(-7 300 110)">
              <g className="gh-intro-orbit-turn">
                <path
                  className="gh-intro-arc gh-intro-arc-front"
                  d="M563.1 131.2A280 62 0 0 1 36.9 131.2"
                  pathLength={1}
                  fill="none"
                  stroke="url(#gh-intro-arc-stroke)"
                  strokeWidth={1.25}
                  strokeLinecap="round"
                />
                <path
                  className="gh-intro-arc gh-intro-arc-back"
                  d="M36.9 131.2A280 62 0 1 1 563.1 131.2"
                  pathLength={1}
                  fill="none"
                  stroke="url(#gh-intro-arc-stroke)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
                <g className="gh-intro-node">
                  <circle cx="563.1" cy="131.2" r="9" fill="#a6f0dc" opacity="0.16" />
                  <circle cx="563.1" cy="131.2" r="2.6" fill="#f6f1e8" />
                </g>
              </g>
            </g>
          </svg>
          <p className="gh-intro-word">
            <span className="gh-intro-mask">
              {WORD ? (
                <>
                  <span className="gh-intro-gadgets">{WORD[1]}</span>
                  <span className="gh-intro-hub">{WORD[2]}</span>
                </>
              ) : (
                <span className="gh-intro-gadgets">{BRAND_NAME}</span>
              )}
            </span>
          </p>
        </div>

        {/* Filled once, by the controller, only if the hero image is late. */}
        <p className="gh-intro-status" role="status" {...{ [INTRO_DOM.statusAttr]: '' }} suppressHydrationWarning />
      </div>

      <div className="gh-intro-foot" aria-hidden="true">
        <div className="gh-intro-credit">
          <p className="gh-intro-by">
            {INTRO_COPY.credit}
            <span className="gh-intro-by-name"> {INTRO_COPY.creditName}</span>
          </p>
          <span className="gh-intro-plate">
            {/* eslint-disable-next-line @next/next/no-img-element -- the supplied logo, trimmed, shipped as is */}
            <img
              {...{ [INTRO_DOM.logoAttr]: '' }}
              src={INTRO_LOGO.src}
              srcSet={INTRO_LOGO.srcSet}
              sizes={INTRO_LOGO.sizes}
              width={INTRO_LOGO.width}
              height={INTRO_LOGO.height}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </span>
        </div>
      </div>

      <button type="button" className="gh-intro-skip" {...{ [INTRO_DOM.skipAttr]: '' }}>
        {INTRO_COPY.skip}
      </button>
    </div>
  );
}

export default BrandIntro;
