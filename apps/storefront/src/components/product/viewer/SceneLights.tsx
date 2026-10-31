'use client';

import { useMemo } from 'react';
import { Environment, Lightformer } from '@react-three/drei';
import type { Tier } from '@/lib/perf/device-tier';
import { tokenColor } from '@/lib/theme/read-token';

interface Props {
  tier: Exclude<Tier, 'none'>;
}

/**
 * Key + fill + rim and, above low tier, a one-shot Lightformer environment.
 * No shadows: depth is sold by the rim light and the env reflections.
 */
export function SceneLights({ tier }: Props) {
  const colors = useMemo(
    () => ({
      rim: tokenColor('--color-light-rim'),
      fill: tokenColor('--color-light-fill'),
    }),
    [],
  );

  const env = tier !== 'low';
  const resolution = tier === 'high' ? 64 : 32;

  return (
    <>
      <ambientLight intensity={tier === 'low' ? 0.6 : 0.4} />
      <directionalLight position={[4, 6, 6]} intensity={1.6} />
      <directionalLight position={[-5, -2, 4]} intensity={0.5} color={colors.fill} />
      <pointLight position={[0, 2, -4]} intensity={6} distance={14} color={colors.rim} />
      {env ? (
        <Environment resolution={resolution} frames={1}>
          <Lightformer form="rect" intensity={2} position={[0, 5, 0]} scale={[10, 1, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={1.2} color={colors.rim} position={[-6, 0, 2]} scale={[1, 6, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={1.2} color={colors.fill} position={[6, 0, 2]} scale={[1, 6, 1]} target={[0, 0, 0]} />
        </Environment>
      ) : null}
    </>
  );
}
