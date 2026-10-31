'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, MeshPhysicalMaterial, MeshStandardMaterial } from 'three';
import type { ProcDesign } from '@/lib/designs/catalog';
import type { FeaturedSize } from '@/lib/designs/featured-texture';
import type { CaseType } from '@/lib/medusa/fixtures';
import type { Tier } from '@/lib/perf/device-tier';
import { createFeaturedParts, type IslandStyle } from '@/lib/three/case-geometry';
import { tokenColor } from '@/lib/theme/read-token';
import type { DragRotate } from './useDragRotate';
import { useProductMaterial } from './useProductMaterial';

interface Props {
  design: ProcDesign;
  caseType: CaseType;
  islandStyle: IslandStyle;
  tier: Exclude<Tier, 'none'>;
  smoothness: number;
  textureSize: FeaturedSize;
  rotate: DragRotate;
  /** Fires once the painted design is bound to the shell (per material instance). */
  onMapReady: () => void;
}

/** Shell + island + glass + rings + phone: five draw calls, posed by the drag controller. */
export function ProductCase({ design, caseType, islandStyle, tier, smoothness, textureSize, rotate, onMapReady }: Props) {
  const group = useRef<Group>(null);
  const invalidate = useThree((s) => s.invalidate);

  const parts = useMemo(() => createFeaturedParts(smoothness, islandStyle), [smoothness, islandStyle]);
  const { material: shell, ready } = useProductMaterial(design, caseType, tier, textureSize);

  const materials = useMemo(() => {
    const island = new MeshStandardMaterial({ color: tokenColor('--color-island'), roughness: 0.2, metalness: 0.1 });
    const glass = new MeshPhysicalMaterial({
      color: tokenColor('--color-lens'),
      roughness: 0.04,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
    });
    const rings = new MeshStandardMaterial({ color: tokenColor('--color-metal'), metalness: 1, roughness: 0.3 });
    const phone = new MeshStandardMaterial({ color: tokenColor('--color-phone'), roughness: 0.6, metalness: 0.15 });
    return { island, glass, rings, phone };
  }, []);
  useEffect(
    () => () => {
      Object.values(materials).forEach((m) => m.dispose());
    },
    [materials],
  );

  // On-demand loops (reduced motion) redraw on input and on every prop change.
  useEffect(() => {
    rotate.setOnWake(() => invalidate());
    return () => rotate.setOnWake(null);
  }, [rotate, invalidate]);
  useEffect(() => {
    invalidate();
  }, [invalidate, parts, caseType, shell]);
  // The design map lands asynchronously (quote designs wait on a font): redraw and report it.
  useEffect(() => {
    let live = true;
    void ready.then(() => {
      if (!live) return;
      invalidate();
      onMapReady();
    });
    return () => {
      live = false;
    };
  }, [ready, invalidate, onMapReady]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const moving = rotate.step(dt, performance.now());
    g.rotation.set(rotate.pose.pitch, rotate.pose.yaw, 0);
    if (moving) invalidate();
  });

  return (
    <group ref={group}>
      <mesh geometry={parts.shell} material={shell} />
      <mesh geometry={parts.island} material={materials.island} />
      <mesh geometry={parts.glass} material={materials.glass} />
      <mesh geometry={parts.rings} material={materials.rings} />
      <mesh geometry={parts.phone} material={materials.phone} />
    </group>
  );
}
