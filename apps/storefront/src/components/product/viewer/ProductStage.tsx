'use client';

import { Component, useCallback, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import { PerformanceMonitor, PerspectiveCamera } from '@react-three/drei';
import { Canvas, useFrame, useThree, type RootState } from '@react-three/fiber';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { SceneLights } from './SceneLights';
import type { ProcDesign } from '@/lib/designs/catalog';
import type { CaseType } from '@/lib/medusa/fixtures';
import { TIER_SETTINGS, type Tier } from '@/lib/perf/device-tier';
import type { ElementFrameloop } from '@/lib/product/use-element-frameloop';
import type { IslandStyle } from '@/lib/three/case-geometry';
import { ProductCase } from './ProductCase';
import { useDragRotate } from './useDragRotate';

export interface ProductStageProps {
  design: ProcDesign;
  caseType: CaseType;
  islandStyle: IslandStyle;
  tier: Exclude<Tier, 'none'>;
  /** Current DPR ceiling; the viewer lowers it one notch before demoting the tier. */
  dprCap: number;
  frameloop: ElementFrameloop;
  reducedMotion: boolean;
  finePointer: boolean;
  /** The focusable stage element: pointer and keyboard input bind here. */
  stage: HTMLElement;
  onReady: () => void;
  onFail: () => void;
  onDecline: () => void;
}

// Decline only: drei counts inclines toward `flipflops` too, so a reachable upper bound
// would retire a healthy scene. The ladder only steps down.
const DECLINE_ONLY_BOUNDS = (): [number, number] => [40, Infinity];

/** Fires `onReady` on the first frame drawn after `armed` turns true, once per mount. */
function ReadySignal({ armed, onReady }: { armed: boolean; onReady: () => void }) {
  const fired = useRef(false);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(
    () => () => {
      fired.current = false;
    },
    [],
  );
  // On-demand loops need a frame after arming, or the signal would wait for input.
  useEffect(() => {
    if (armed) invalidate();
  }, [armed, invalidate]);
  useFrame(() => {
    if (fired.current || !armed) return;
    fired.current = true;
    onReady();
  });
  return null;
}

interface BoundaryProps {
  onFail: () => void;
  children: ReactNode;
}

class StageBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV !== 'production') console.error('ProductStage failed', error, info.componentStack);
    this.props.onFail();
  }
  render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

/** The 3D chunk: one case under the hero's lights. No shadows, no postprocessing, five draw calls. */
export default function ProductStage({
  design,
  caseType,
  islandStyle,
  tier,
  dprCap,
  frameloop,
  reducedMotion,
  finePointer,
  stage,
  onReady,
  onFail,
  onDecline,
}: ProductStageProps) {
  const settings = TIER_SETTINGS[tier];
  const rotate = useDragRotate(stage, { reducedMotion, finePointer });
  const [mapReady, setMapReady] = useState(false);
  const onMapReady = useCallback(() => setMapReady(true), []);

  // R3F force-loses the context when the root unmounts, so a loss only counts while mounted.
  const alive = useRef(true);
  const detachContextLost = useRef<(() => void) | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      detachContextLost.current?.();
      detachContextLost.current = null;
    };
  }, []);

  // Paused and on-demand loops produce sparse frames that read as low fps.
  const monitorLive = useRef(frameloop === 'always');
  useEffect(() => {
    monitorLive.current = frameloop === 'always';
  }, [frameloop]);
  const handleDecline = useCallback(() => {
    if (monitorLive.current) onDecline();
  }, [onDecline]);

  const onCreated = useCallback(
    (state: RootState) => {
      const { gl, scene, camera } = state;
      gl.toneMapping = ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.1;
      gl.outputColorSpace = SRGBColorSpace;
      gl.compile(scene, camera);
      detachContextLost.current?.();
      const canvas = gl.domElement;
      const onContextLost = (e: Event) => {
        if (!alive.current) return;
        e.preventDefault();
        onFail();
      };
      canvas.addEventListener('webglcontextlost', onContextLost, { once: true });
      detachContextLost.current = () => canvas.removeEventListener('webglcontextlost', onContextLost);
    },
    [onFail],
  );

  return (
    <StageBoundary onFail={onFail}>
      <Canvas
        aria-hidden="true"
        frameloop={frameloop}
        dpr={[1, Math.min(dprCap, settings.dpr[1])]}
        gl={{
          antialias: settings.antialias,
          alpha: true,
          stencil: false,
          depth: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: true,
        }}
        onCreated={onCreated}
        style={{ touchAction: 'pan-y' }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 4.2]} near={0.1} far={30} fov={32} />
        <SceneLights tier={tier} />
        <PerformanceMonitor bounds={DECLINE_ONLY_BOUNDS} onDecline={handleDecline}>
          <ProductCase
            design={design}
            caseType={caseType}
            islandStyle={islandStyle}
            tier={tier}
            smoothness={settings.smoothness}
            textureSize={settings.featured}
            rotate={rotate}
            onMapReady={onMapReady}
          />
        </PerformanceMonitor>
        <ReadySignal armed={mapReady} onReady={onReady} />
      </Canvas>
    </StageBoundary>
  );
}
