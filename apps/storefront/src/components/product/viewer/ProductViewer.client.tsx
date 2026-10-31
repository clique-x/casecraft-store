'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { CaseArt } from '@/components/phone-picker/BrandOutline';
import { DESIGNS, getDesign } from '@/lib/designs/catalog';
import { useFinePointer } from '@/lib/device/use-fine-pointer';
import { useReducedMotion } from '@/lib/device/use-reduced-motion';
import type { PhoneModel, ProductDetail } from '@/lib/medusa/fixtures';
import { EASE_OUT_EXPO } from '@/lib/motion/tokens';
import {
  demoteTier,
  detectTier,
  getCachedTier,
  persistTier,
  subscribeTier,
  TIER_SETTINGS,
  type Tier,
} from '@/lib/perf/device-tier';
import { useElementFrameloop } from '@/lib/product/use-element-frameloop';
import { useVariantSelection } from '@/lib/product/variant-store';
import type { IslandStyle } from '@/lib/three/case-geometry';
import { cn } from '@/lib/utils';
import { PhotoStage } from './PhotoStage.client';

const ProductStage = dynamic(() => import('./ProductStage'), { ssr: false, loading: () => null });

const CHUNK_TIMEOUT_MS = 8000;
const READY_TIMEOUT_MS = 8000;
const DPR_STEP = 0.25;
const FADE = `opacity 400ms var(--ease-out-expo, cubic-bezier(${EASE_OUT_EXPO.join(',')}))`;

interface Props {
  product: ProductDetail;
  models: PhoneModel[];
  className?: string;
}

function getServerTier(): Tier | null {
  return null;
}

function requestIdle(cb: () => void, timeout: number): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(() => cb(), { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(cb, 200);
  return () => window.clearTimeout(id);
}

/** Resolves once, after an idle slot and the element being in view. */
function whenIdleAndInView(el: HTMLElement, cb: () => void): () => void {
  let cancelled = false;
  let io: IntersectionObserver | null = null;
  const cancelIdle = requestIdle(() => {
    if (cancelled) return;
    io = new IntersectionObserver((entries) => {
      if (cancelled || !entries.some((e) => e.isIntersecting)) return;
      io?.disconnect();
      cb();
    });
    io.observe(el);
  }, 1500);
  return () => {
    cancelled = true;
    cancelIdle();
    io?.disconnect();
  };
}

/** The selected model, else the first model this design fits: the server renders that island. */
function resolveIslandStyle(product: ProductDetail, models: PhoneModel[], modelSlug: string | null): IslandStyle {
  const fits = new Set(product.fitsModels);
  const selected = modelSlug ? models.find((m) => m.slug === modelSlug) : undefined;
  const model = selected ?? models.find((m) => fits.has(m.slug));
  return model?.islandStyle ?? 'square';
}

/** Photographed covers get the CSS stage; procedural designs keep the 3D viewer below. */
export function ProductViewer({ product, models, className }: Props) {
  if (product.photo) return <PhotoStage entry={product.photo} title={product.title} className={className} />;
  return <ProceduralViewer product={product} models={models} className={className} />;
}

/**
 * Owns the viewer lifecycle: tier → idle → in view → chunk → crossfade.
 * The CSS case underneath is server-rendered and stays on tier `none`, on
 * failure, or until the first 3D frame is drawn.
 */
function ProceduralViewer({ product, models, className }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<HTMLElement | null>(null);

  const { modelSlug, caseType } = useVariantSelection();
  const design = getDesign(product.designId) ?? DESIGNS[0];
  const islandStyle = resolveIslandStyle(product, models, modelSlug);

  const tier = useSyncExternalStore(subscribeTier, getCachedTier, getServerTier);
  const [dprCap, setDprCap] = useState(2);
  const [gateOpen, setGateOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();

  useLayoutEffect(() => {
    setStage(stageRef.current);
  }, []);

  useEffect(() => {
    detectTier();
  }, []);

  const active = tier !== null && tier !== 'none';
  const { frameloop } = useElementFrameloop(stageRef, { reducedMotion, enabled: active });

  const tierRef = useRef<Tier | null>(null);
  const dprRef = useRef(2);
  useEffect(() => {
    tierRef.current = tier;
    dprRef.current = dprCap;
  }, [tier, dprCap]);

  // Gate: idle slot → stage in view; opens once.
  useEffect(() => {
    if (!stage || !active || gateOpen) return;
    return whenIdleAndInView(stage, () => {
      const current = getCachedTier();
      if (current && current !== 'none') setGateOpen(true);
    });
  }, [stage, active, gateOpen]);

  const fail = useCallback(() => {
    stageRef.current?.style.setProperty('--viewer-opacity', '0');
    setReady(false);
    persistTier('none');
  }, []);

  // Times only the chunk download.
  useEffect(() => {
    if (!gateOpen) return;
    let settled = false;
    const id = window.setTimeout(() => {
      if (!settled) fail();
    }, CHUNK_TIMEOUT_MS);
    import('./ProductStage').then(
      () => {
        settled = true;
        window.clearTimeout(id);
      },
      () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(id);
        fail();
      },
    );
    return () => {
      settled = true;
      window.clearTimeout(id);
    };
  }, [gateOpen, fail]);

  const showCanvas = active && gateOpen && stage !== null;

  // First-frame deadline, counted only while the loop may run.
  useEffect(() => {
    if (!showCanvas || ready || frameloop === 'never') return;
    const id = window.setTimeout(fail, READY_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [showCanvas, ready, frameloop, fail]);

  const onReady = useCallback(() => {
    stageRef.current?.style.setProperty('--viewer-opacity', '1');
    setReady(true);
  }, []);

  // Ladder: one DPR notch at a time, then the tier; never upgrades.
  const onDecline = useCallback(() => {
    const current = tierRef.current;
    if (!current || current === 'none') return;
    const cap = Math.min(dprRef.current, TIER_SETTINGS[current].dpr[1]);
    if (cap - DPR_STEP >= 1) {
      setDprCap(cap - DPR_STEP);
      return;
    }
    const next = demoteTier(current);
    if (next === 'none') fail();
    else persistTier(next);
  }, [fail]);

  return (
    <div
      ref={stageRef}
      id="product-viewer"
      tabIndex={ready ? 0 : -1}
      role={ready ? 'group' : 'img'}
      aria-label={ready ? `${product.title} case preview. Use the left and right arrow keys to rotate.` : `${product.title} case preview`}
      className={cn(
        'stage-backdrop relative isolate aspect-[4/5] max-h-[60svh] w-full overflow-hidden rounded-card text-fg-on-ink outline-none select-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-2 lg:aspect-[7/8] lg:max-h-none',
        className,
      )}
      style={{ touchAction: 'pan-y' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(60%_50%_at_50%_100%,color-mix(in_srgb,var(--color-light-rim)_18%,transparent),transparent_70%)]"
      />

      <div
        aria-hidden={ready}
        className="absolute inset-0 z-[1] grid place-items-center"
        style={{ opacity: 'calc(1 - var(--viewer-opacity, 0))', transition: FADE }}
      >
        <CaseArt
          design={design}
          islandStyle={islandStyle}
          lip
          className="h-[66%] drop-shadow-[0_32px_48px_color-mix(in_srgb,var(--color-shadow)_18%,transparent)]"
        />
      </div>

      <div
        className={cn('absolute inset-0 z-[2]', showCanvas ? 'pointer-events-auto' : 'pointer-events-none')}
        style={{ opacity: 'var(--viewer-opacity, 0)', transition: FADE }}
      >
        {showCanvas && stage ? (
          <ProductStage
            design={design}
            caseType={caseType}
            islandStyle={islandStyle}
            tier={tier}
            dprCap={dprCap}
            frameloop={frameloop}
            reducedMotion={reducedMotion}
            finePointer={finePointer}
            stage={stage}
            onReady={onReady}
            onFail={fail}
            onDecline={onDecline}
          />
        ) : null}
      </div>

      <p
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-3 z-[3] text-center text-caption text-fg-on-ink-muted"
        style={{ opacity: 'var(--viewer-opacity, 0)', transition: FADE }}
      >
        {finePointer ? 'Drag to rotate' : 'Swipe to rotate'}
      </p>
    </div>
  );
}
