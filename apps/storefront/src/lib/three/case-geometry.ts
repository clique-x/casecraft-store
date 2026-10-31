import {
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  PlaneGeometry,
  Shape,
  TorusGeometry,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** 1 unit ≈ 10 cm. +z is the design side, facing the camera. */
export const CASE_W = 0.74;
export const CASE_H = 1.52;
export const CASE_D = 0.085;

export const FEATURED_W = 0.78;
export const FEATURED_H = 1.6;
export const FEATURED_D = 0.11;

/** Abstract camera-island layouts shared by many brands; none copies a brand's proportions. */
export type IslandStyle = 'square' | 'pills' | 'circle';

const fieldCache = new Map<number, BufferGeometry>();
const featuredCache = new Map<string, FeaturedParts>();

function merge(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error('case-geometry: mergeGeometries failed (attribute mismatch)');
  for (const p of parts) p.dispose();
  merged.computeBoundingSphere();
  return merged;
}

/**
 * One merged body + camera island shared by the field InstancedMesh.
 * `aPart` = 0 on body vertices, 1 on island vertices (the shader paints
 * the island with a flat token colour instead of the atlas).
 */
export function createFieldGeometry(smoothness: number): BufferGeometry {
  const hit = fieldCache.get(smoothness);
  if (hit) return hit;

  const body = new RoundedBoxGeometry(CASE_W, CASE_H, CASE_D, smoothness, 0.1);
  const island = new RoundedBoxGeometry(0.3, 0.3, 0.03, 2, 0.06);
  island.translate(-0.17, 0.52, 0.0575);

  const bodyCount = body.attributes.position.count;
  const islandCount = island.attributes.position.count;
  body.setAttribute('aPart', new Float32BufferAttribute(new Float32Array(bodyCount), 1));
  island.setAttribute('aPart', new Float32BufferAttribute(new Float32Array(islandCount).fill(1), 1));

  const geometry = merge([body, island]);
  fieldCache.set(smoothness, geometry);
  return geometry;
}

/** Binds the per-instance atlas rect (u, v, su, sv) the field shader reads as `aTile`. */
export function setTileAttribute(geometry: BufferGeometry, tiles: InstancedBufferAttribute): BufferGeometry {
  geometry.setAttribute('aTile', tiles);
  return geometry;
}

export interface FeaturedParts {
  shell: BufferGeometry;
  island: BufferGeometry;
  /** Lenses, flash and the screen: one glossy black material. */
  glass: BufferGeometry;
  rings: BufferGeometry;
  phone: BufferGeometry;
}

const ISLAND_Z = 0.07;
const ISLAND_D = 0.03;
const LENS_Z = 0.088;
const FLASH_Z = 0.086;
const RING_Z = 0.093;

function lens(radius: number, x: number, y: number, height = 0.014, z = LENS_Z): CylinderGeometry {
  const g = new CylinderGeometry(radius, radius, height, radius < 0.03 ? 16 : 32);
  g.rotateX(Math.PI / 2);
  g.translate(x, y, z);
  return g;
}

function ring(radius: number, x: number, y: number): TorusGeometry {
  const g = new TorusGeometry(radius, 0.004, 8, 32);
  g.translate(x, y, RING_Z);
  return g;
}

function screen(): PlaneGeometry {
  const g = new PlaneGeometry(0.7, 1.52);
  g.rotateY(Math.PI);
  g.translate(0, 0, -0.0635);
  return g;
}

function stadium(w: number, h: number): Shape {
  const r = Math.min(w, h) / 2;
  const x = -w / 2;
  const y = -h / 2;
  const s = new Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/**
 * A fully rounded vertical pill, bevelled, sitting proud of the +z face. RoundedBox cannot: it clamps the radius to the depth.
 * ExtrudeGeometry grows the body outward by bevelSize, so the outline is drawn `bevel` smaller to land at w × h.
 */
function pill(w: number, h: number, x: number, y: number): ExtrudeGeometry {
  const bevel = 0.006;
  const g = new ExtrudeGeometry(stadium(w - bevel * 2, h - bevel * 2), {
    depth: ISLAND_D - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 14,
  });
  g.translate(x, y, ISLAND_Z - ISLAND_D / 2 + bevel);
  return g;
}

interface IslandBuild {
  island: BufferGeometry;
  lenses: BufferGeometry[];
  rings: BufferGeometry[];
}

function squareIsland(): IslandBuild {
  const island = new RoundedBoxGeometry(0.3, 0.3, ISLAND_D, 3, 0.07);
  island.translate(-0.17, 0.55, ISLAND_Z);
  return {
    island,
    lenses: [lens(0.052, -0.23, 0.61), lens(0.052, -0.11, 0.49), lens(0.018, -0.11, 0.61, 0.01, FLASH_Z)],
    rings: [ring(0.056, -0.23, 0.61), ring(0.056, -0.11, 0.49)],
  };
}

function pillsIsland(): IslandBuild {
  const island = merge([pill(0.15, 0.46, -0.245, 0.5), pill(0.11, 0.46, -0.095, 0.5)]);
  return {
    island,
    lenses: [
      lens(0.048, -0.245, 0.62),
      lens(0.048, -0.245, 0.38),
      lens(0.036, -0.095, 0.62),
      lens(0.016, -0.095, 0.4, 0.01, FLASH_Z),
    ],
    rings: [ring(0.052, -0.245, 0.62), ring(0.052, -0.245, 0.38), ring(0.04, -0.095, 0.62)],
  };
}

function circleIsland(): IslandBuild {
  const island = new CylinderGeometry(0.17, 0.17, ISLAND_D, 48);
  island.rotateX(Math.PI / 2);
  island.translate(0, 0.55, ISLAND_Z);
  return {
    island,
    lenses: [lens(0.075, 0, 0.55), lens(0.016, 0.11, 0.65, 0.01, FLASH_Z)],
    rings: [ring(0.082, 0, 0.55)],
  };
}

const ISLANDS: Record<IslandStyle, () => IslandBuild> = {
  square: squareIsland,
  pills: pillsIsland,
  circle: circleIsland,
};

/** The featured case assembly: five geometries, five draw calls. The island follows `PhoneModel.islandStyle`. */
export function createFeaturedParts(smoothness: number, islandStyle: IslandStyle = 'square'): FeaturedParts {
  const key = `${smoothness}:${islandStyle}`;
  const hit = featuredCache.get(key);
  if (hit) return hit;

  const s = Math.max(2, smoothness);

  const shell = new RoundedBoxGeometry(FEATURED_W, FEATURED_H, FEATURED_D, s + 2, 0.1);

  const built = ISLANDS[islandStyle]();
  const glass = merge([...built.lenses, screen()]);
  const rings = merge(built.rings);

  const phone = new RoundedBoxGeometry(0.735, 1.555, 0.085, 3, 0.085);
  phone.translate(0, 0, -0.02);

  const parts: FeaturedParts = { shell, island: built.island, glass, rings, phone };
  featuredCache.set(key, parts);
  return parts;
}
