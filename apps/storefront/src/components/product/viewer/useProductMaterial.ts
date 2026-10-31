'use client';

import { useEffect, useLayoutEffect, useMemo } from 'react';
import { CanvasTexture, Color, MeshPhysicalMaterial, MeshStandardMaterial, SRGBColorSpace } from 'three';
import type { ProcDesign } from '@/lib/designs/catalog';
import { getFeaturedTexture, getFlatThicknessMap, getThicknessMap, type FeaturedSize } from '@/lib/designs/featured-texture';
import type { CaseType } from '@/lib/medusa/fixtures';
import type { Tier } from '@/lib/perf/device-tier';
import { tokenColor } from '@/lib/theme/read-token';

export type ProductMaterial = MeshPhysicalMaterial | MeshStandardMaterial;

// three turns USE_CLEARCOAT / USE_IRIDESCENCE off at exactly 0, which would recompile
// the program on every case-type switch. These floors are invisible and keep one program.
const CLEARCOAT_FLOOR = 0.01;
const IRIDESCENCE_FLOOR = 0.02;

function createPlaceholderMap(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = tokenColor('--color-ink-2').getStyle();
    ctx.fillRect(0, 0, 2, 2);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/**
 * Shell material for one design. `apply(caseType)` retunes finish params in
 * place: soft = matte TPU, glass = clearcoated print with thin-film iridescence
 * on holo designs. Low tier gets a MeshStandardMaterial.
 */
export class ProductMaterialController {
  readonly material: ProductMaterial;
  /** Settles once the painted design is bound as `map` (or painting failed and the placeholder stays). */
  readonly ready: Promise<void>;
  private readonly placeholder: CanvasTexture;
  private disposed = false;

  constructor(design: ProcDesign, tier: Exclude<Tier, 'none'>, size: FeaturedSize) {
    this.placeholder = createPlaceholderMap();
    if (tier === 'low') {
      this.material = new MeshStandardMaterial({
        color: new Color(1, 1, 1),
        map: this.placeholder,
        roughness: 0.55,
        metalness: 0,
      });
    } else {
      const physical = new MeshPhysicalMaterial({
        color: new Color(1, 1, 1),
        map: this.placeholder,
        roughness: 0.55,
        metalness: 0,
        clearcoat: CLEARCOAT_FLOOR,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.4,
        iridescence: IRIDESCENCE_FLOOR,
        iridescenceIOR: 1.32,
        iridescenceThicknessMap: design.holo ? getThicknessMap() : getFlatThicknessMap(),
        sheen: 0.2,
        sheenColor: tokenColor('--color-accent-2'),
        sheenRoughness: 0.5,
      });
      physical.iridescenceThicknessMinimum = 120;
      physical.iridescenceThicknessMaximum = 480;
      this.material = physical;
    }
    this.ready = getFeaturedTexture(design, size).then(
      (tex) => {
        if (this.disposed) return;
        this.material.map = tex;
      },
      () => undefined,
    );
  }

  apply(design: ProcDesign, caseType: CaseType): void {
    const m = this.material;
    const glass = caseType === 'glass';
    if (m instanceof MeshPhysicalMaterial) {
      m.roughness = glass ? 0.18 : 0.55;
      m.clearcoat = glass ? 1 : CLEARCOAT_FLOOR;
      m.clearcoatRoughness = 0.08;
      m.metalness = 0;
      m.iridescence = glass ? (design.holo ? 1 : 0.15) : IRIDESCENCE_FLOOR;
      m.envMapIntensity = glass ? 1.4 : 0.9;
    } else {
      m.roughness = glass ? 0.25 : 0.55;
    }
  }

  dispose(): void {
    this.disposed = true;
    this.material.dispose();
    this.placeholder.dispose();
  }
}

export interface ProductShell {
  material: ProductMaterial;
  ready: Promise<void>;
}

/** `ready` settles when the painted design is bound, so callers can redraw and gate their ready signal on it. */
export function useProductMaterial(
  design: ProcDesign,
  caseType: CaseType,
  tier: Exclude<Tier, 'none'>,
  size: FeaturedSize,
): ProductShell {
  const controller = useMemo(() => new ProductMaterialController(design, tier, size), [design, tier, size]);
  useEffect(() => () => controller.dispose(), [controller]);
  // Layout effect: applied before the next animation frame, so the switch lands within one frame.
  useLayoutEffect(() => {
    controller.apply(design, caseType);
  }, [controller, design, caseType]);
  return { material: controller.material, ready: controller.ready };
}
