'use client';

import { useEffect, useState, type CSSProperties, type RefObject } from 'react';

interface Props {
  imgRef: RefObject<HTMLImageElement | null>;
  enabled: boolean;
}

interface Mask {
  url: string;
  cut: string;
}

const LIGHT_CSS = `
.hero-light{position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;
-webkit-mask-size:contain;mask-size:contain;-webkit-mask-position:center;mask-position:center;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;
background-image:linear-gradient(115deg,transparent 38%,rgb(255 255 255 / 0.30) 48%,rgb(255 255 255 / 0.08) 52%,transparent 64%);
background-size:250% 100%;background-repeat:no-repeat;
background-position:calc(50% + var(--sheen-x,0%) + var(--scroll-sheen,0%) + var(--sweep,0) * 100%) 0;
transition:background-position 120ms linear}
.hero-light[data-cut=faded]{-webkit-mask-composite:source-in;mask-composite:intersect}
@media (prefers-reduced-motion:reduce){.hero-light{transition:none}}
`;

const FADE_MASK = 'linear-gradient(to bottom, black 88%, transparent 100%)';

function supportsMask(): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return false;
  return CSS.supports('mask-image', 'url("data:,")') || CSS.supports('-webkit-mask-image', 'url("data:,")');
}

/** Whether `url` is one of the element's current `src` / `srcset` candidates (not a stale `currentSrc`). */
function isCurrentSource(img: HTMLImageElement, url: string): boolean {
  const resolve = (raw: string): string | null => {
    try {
      return new URL(raw, img.baseURI).href;
    } catch {
      return null;
    }
  };
  const src = img.getAttribute('src');
  if (src && resolve(src) === url) return true;
  for (const candidate of img.srcset.split(',')) {
    const raw = candidate.trim().split(/\s+/)[0];
    if (raw && resolve(raw) === url) return true;
  }
  return false;
}

/**
 * The masked light layer (sheen band + two rim lights) over a cutout. Mounted only
 * after the image decodes and masked by its own `currentSrc`, so it costs no bytes.
 * Follows `src` swaps on the same element.
 */
export function CaseSheen({ imgRef, enabled }: Props) {
  const [mask, setMask] = useState<Mask | null>(null);

  useEffect(() => {
    if (!enabled || !supportsMask()) return;
    const img = imgRef.current;
    if (!img) return;

    let cancelled = false;
    let token = 0;
    let frame = 0;
    let onLoad: (() => void) | null = null;

    const dropLoad = () => {
      if (onLoad) img.removeEventListener('load', onLoad);
      onLoad = null;
    };

    const inspect = (mine: number) => {
      if (cancelled || mine !== token) return;
      dropLoad();
      const apply = () => {
        if (cancelled || mine !== token) return;
        const url = img.currentSrc || img.src;
        if (!url) return;
        if (!isCurrentSource(img, url)) {
          // The pending request has not replaced currentSrc yet; its load will.
          onLoad = () => inspect(mine);
          img.addEventListener('load', onLoad, { once: true });
          return;
        }
        setMask({ url, cut: img.dataset.cut ?? 'faded' });
      };
      if (!img.complete || !img.currentSrc || !isCurrentSource(img, img.currentSrc)) {
        onLoad = () => inspect(mine);
        img.addEventListener('load', onLoad, { once: true });
        return;
      }
      img.decode().then(apply, apply);
    };

    inspect(++token);
    // The observer fires before the image-update step runs, so look one frame later.
    const observer = new MutationObserver(() => {
      const mine = ++token;
      dropLoad();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => inspect(mine));
    });
    observer.observe(img, { attributes: true, attributeFilter: ['src', 'srcset'] });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      dropLoad();
      observer.disconnect();
    };
  }, [imgRef, enabled]);

  if (!enabled || !mask) return null;

  const layers = mask.cut === 'faded' ? `url("${mask.url}"), ${FADE_MASK}` : `url("${mask.url}")`;
  const style: CSSProperties = { WebkitMaskImage: layers, maskImage: layers };

  return (
    <>
      <style href="hero-light" precedence="default">
        {LIGHT_CSS}
      </style>
      <div className="hero-light" data-cut={mask.cut} style={style} aria-hidden="true" />
    </>
  );
}
