# Homepage build brief — Playful Wall, Featured Shelf build

Status: final, build-ready. Scope: `/` only (apps/storefront). Everything below is decided; where the store spec left a question open (§11) the value is fixed here as a constant in `lib/brand.ts` and can be changed later without touching components.

Spec sections that bind this page: §1 (pick phone → browse designs that fit → UPI/COD), §5 (home must carry hero, picker, Trending, New arrivals, Shop by theme, Shop by brand, trust strip), §6 feature 1 (`my_phone` cookie is MVP feature 1), §10 (no licensed artwork; original art only).

---

## 0. One-paragraph description

The hero is a 100svh ink-coloured stage. Behind the headline, a field of 24 (desktop) / 16 / 10 glossy phone cases drifts slowly in 3D, each wearing one of 24 original procedurally painted designs. One case at a time is the **featured case**: it sits in a fixed slot close to the camera, squares up, breathes, and shows a higher-resolution version of its design with a real thin-film holographic finish. Under it, a DOM label reads "Holo Shift · from ₹349 · View →". Every 4 seconds the featured case swaps with the next trending design (the old one flies back into the field, the new one flies forward). Tapping or clicking any case in the field makes it the featured one; clicking the featured case or its label opens the product page. The headline says what the store sells and the primary button opens the phone picker. There is no pinning: scrolling simply makes the field part and lift while the canvas fades, and the first block under the hero is the phone picker. Below that, a fast light-paper store: trust strip, "Same design. Your phone." fit band (CSS 3D), Trending, New arrivals, Shop by theme, Shop by brand, Why us, final CTA, footer. The 3D chunk is lazy; the server renders a CSS-3D twin of the hero that every visitor sees first and that low-end devices keep.

---

## 1. Hero scene specification

### 1.1 Layout and DOM stack

Hero section `<section id="hero">`: `min-height: 100svh` on phones (floor 600px), `height: clamp(640px, 100svh, 900px)` at `lg` (1024px+). Stacking inside the section (all absolutely positioned within the section, section is `position: relative; overflow: hidden; isolation: isolate`):

1. **Backdrop (DOM, z 0)**: `background: var(--color-ink)` plus two blurred radial blobs painted with CSS (`radial-gradient` at 22% 30% in `--color-accent-2` at 22% alpha, 1100px; and at 78% 70% in `--color-accent` at 16% alpha, 900px), plus a 3% SVG `feTurbulence` grain overlay as an inline data-URI background with `mix-blend-mode: overlay`. All GPU-composited, painted at SSR. Kills gradient banding on AMOLED.
2. **CaseWallStatic (DOM, z 1)**: the SSR CSS-3D twin (section 1.9). Always rendered. Fades to 0 when the canvas is ready; stays forever on tier `none`.
3. **Canvas wrapper (DOM, z 2)**: `position:absolute; inset:0; opacity: var(--hero-canvas-opacity, 0); transition: opacity 400ms var(--ease-out-expo); touch-action: pan-y;` R3F `<Canvas>` mounts here, `aria-hidden="true"`. Pointer events enabled only on the canvas element itself.
4. **Scrim (DOM, z 3, pointer-events none)**: phones: `linear-gradient(to bottom, transparent 38%, color-mix(in srgb, var(--color-ink) 92%, transparent) 56%, var(--color-ink) 100%)`. Desktop: `linear-gradient(to right, var(--color-ink) 0%, color-mix(in srgb, var(--color-ink) 85%, transparent) 36%, transparent 52%)`.
5. **HeroCopy (DOM, z 4)**: the text column and CTAs (section 2.1). `pointer-events: none` on the container, `pointer-events: auto` on buttons, links and the featured label controls.

### 1.2 Units, camera

1 scene unit ≈ 10 cm. Cases are 0.74 w × 1.52 h × 0.085 d. `+z` faces the camera: the design side (the back of a phone) faces the viewer.

`<PerspectiveCamera makeDefault position={[0, 0, 9]} near={0.1} far={30} fov={fov} />` with `fov = aspect < 0.8 ? 50 : 35`, recomputed on resize (`useThree(s => s.viewport.aspect)`). Camera always looks at the origin. Desktop pointer parallax (only when `(pointer: fine)`): `camera.position.x` damps to `pointer.x * 0.5`, `.y` to `pointer.y * 0.3` (`maath/easing.damp`, λ 4), then `lookAt(0,0,0)`. Touch: a horizontal drag on the canvas pans `camera.position.x` within ±0.8 (pointerdown/move; `touch-action: pan-y` so vertical page scroll always wins). No DeviceOrientation API.

Renderer: `gl={{ antialias: tier === 'high', alpha: true, stencil: false, depth: true, powerPreference: 'high-performance', preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: true }}`, `dpr` by tier (section 5), `toneMapping: ACESFilmicToneMapping`, `toneMappingExposure: 1.1`, `outputColorSpace: SRGBColorSpace`. `frameloop` controlled by `useHeroFrameloop` (section 1.8).

### 1.3 Geometry (no model files)

Built once in `lib/three/case-geometry.ts` from `three/examples/jsm/geometries/RoundedBoxGeometry.js` and `BufferGeometryUtils.mergeGeometries`.

**Field case geometry** (one merged `BufferGeometry` shared by the InstancedMesh):
- body: `RoundedBoxGeometry(0.74, 1.52, 0.085, tier === 'high' ? 4 : 2, 0.10)`.
- island: `RoundedBoxGeometry(0.30, 0.30, 0.03, 2, 0.06)` translated to `(-0.17, 0.52, 0.0575)` (sits proud of the +z face).
- merge the two; add a float attribute `aPart` = 0 for body vertices, 1 for island vertices (fill by vertex ranges before merging).
- ≈ 1.3k triangles at smoothness 4, ≈ 0.5k at 2.

The +z face of a BoxGeometry-derived mesh has UVs 0..1 across the face, v = 1 at the top; CanvasTexture `flipY = true` (default) maps canvas top to case top. Side faces stretch the design into thin bands, which reads as a printed wrap-around edge. The -z face mirrors the design; it is never visible because field tumble is capped at ±0.45 rad and featured yaw at ±1.4 rad.

**Featured case assembly** (separate meshes, `components/home/hero/three/FeaturedCase.tsx`), group at the featured slot:
- shell: `RoundedBoxGeometry(0.78, 1.60, 0.11, 6, 0.10)`, material = featured material (1.5). Carries the 512×1024 design map.
- island: `RoundedBoxGeometry(0.30, 0.30, 0.03, 3, 0.07)` at `(-0.17, 0.55, 0.07)`, `MeshStandardMaterial({ color: token(--color-island), roughness: 0.2, metalness: 0.1 })`.
- lenses: two `CylinderGeometry(0.052, 0.052, 0.014, 32)` rotated to face +z at `(-0.23, 0.61, 0.088)` and `(-0.11, 0.49, 0.088)` (diagonal pair) plus one flash `CylinderGeometry(0.018, 0.018, 0.01, 16)` at `(-0.11, 0.61, 0.086)`; merged into one geometry; `MeshPhysicalMaterial({ color: token(--color-lens), roughness: 0.04, clearcoat: 1 })`. Two `TorusGeometry(0.056, 0.004, 8, 32)` rings merged into one mesh, `MeshStandardMaterial({ color: token(--color-metal), metalness: 1, roughness: 0.3 })`.
- phone body: `RoundedBoxGeometry(0.735, 1.555, 0.085, 3, 0.085)` centred at `z = -0.02` (protrudes 0.0075 beyond the shell's -z face: the phone front sits proud of the case lip, like a real case). `MeshStandardMaterial({ color: token(--color-phone), roughness: 0.6, metalness: 0.15 })`.
- screen: `PlaneGeometry(0.70, 1.52)` at `z = -0.0635`, rotated to face -z, `MeshPhysicalMaterial({ color: token(--color-lens), roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03 })`.
- Draw calls: 5. Triangles ≈ 6k.

This is a generic two-lens square island on a neutral slab. Do not copy any brand's camera proportions or layout. No logos anywhere.

### 1.4 Field material (one draw call, minimal shader patch)

`components/home/hero/three/CaseMaterial.ts` → `createFieldMaterial(atlas: THREE.Texture, islandColor: THREE.Color)`:

```ts
const material = new THREE.MeshStandardMaterial({
  map: atlas, roughness: 0.34, metalness: 0.05, envMapIntensity: 1.2,
});
material.customProgramCacheKey = () => 'case-atlas-v1';
material.onBeforeCompile = (shader) => {
  shader.uniforms.uIslandColor = { value: islandColor };
  const v1 = '#include <common>', v2 = '#include <uv_vertex>', f1 = '#include <map_fragment>';
  for (const [src, needle] of [[shader.vertexShader, v1], [shader.vertexShader, v2], [shader.fragmentShader, v1], [shader.fragmentShader, f1]] as const) {
    if (!src.includes(needle)) throw new Error(`CaseMaterial: chunk ${needle} missing; three version changed`);
  }
  shader.vertexShader = shader.vertexShader
    .replace(v1, `${v1}\nattribute vec4 aTile;\nattribute float aPart;\nvarying vec4 vTile;\nvarying float vPart;`)
    .replace(v2, `${v2}\nvTile = aTile;\nvPart = aPart;`);
  shader.fragmentShader = shader.fragmentShader
    .replace(v1, `${v1}\nuniform vec3 uIslandColor;\nvarying vec4 vTile;\nvarying float vPart;`)
    .replace(f1, `
      vec2 tileUv = vTile.xy + clamp(vMapUv, 0.006, 0.994) * vTile.zw;
      vec4 sampledDiffuseColor = texture2D(map, tileUv);
      diffuseColor.rgb *= mix(sampledDiffuseColor.rgb, uIslandColor, step(0.5, vPart));`);
};
```

- Per-instance attributes on the shared geometry: `aTile` (`InstancedBufferAttribute`, 4 floats: atlas u offset, v offset, u scale, v scale). `aPart` is a plain per-vertex attribute.
- The `clamp(…, 0.006, 0.994)` keeps mip bleed from the neighbouring tile off the case edge.
- Pin `three` to exactly `0.170.0`. The `vMapUv` varying and the three chunk names used here exist in r151+; the throw makes any future mismatch fail at first render in dev and in the Playwright smoke test (section 7) instead of silently rendering black.
- No holo/fresnel shader in the field: field cases are matte-gloss prints. The iridescence lives on the featured case (1.5), where it is visible and where it is native.

### 1.5 Featured material (native thin-film iridescence, Prism Noir graft)

`components/home/hero/three/useFeaturedMaterial.ts` returns a memoised `MeshPhysicalMaterial` and a `swapDesign(design)` function:

```
color: #FFFFFF (map provides colour), map: featuredTexture (512×1024, 256×512 on low)
roughness: design.finish === 'glass' ? 0.16 : 0.5
metalness: 0.05
clearcoat: design.finish === 'glass' ? 1 : 0.3, clearcoatRoughness: 0.08
envMapIntensity: 1.4
iridescence: design.holo ? 1 : 0.15
iridescenceIOR: 1.32
iridescenceThicknessRange: [120, 480]
iridescenceThicknessMap: design.holo ? fbmThicknessTexture (128×256, 3-octave fbm, grey) : null
sheen: 0.2, sheenColor: token(--color-accent-2)
```
On swap only `map`, `iridescence`, `iridescenceThicknessMap`, `roughness`, `clearcoat` change and `needsUpdate = true` is set only when `iridescenceThicknessMap` toggles between null and non-null (that changes the shader define; keep the thickness map always set, with a constant mid-grey texture for non-holo designs, so `needsUpdate` is never needed after first compile). Low tier: `MeshStandardMaterial` with the same map, roughness 0.3 (no iridescence, no clearcoat).

### 1.6 Procedural design catalog and atlas

**Catalog** `lib/designs/catalog.ts`. 24 `ProcDesign` entries, all original. Type:

```ts
export type Family = 'marble' | 'holo' | 'aurora' | 'y2k' | 'quote' | 'sticker' | 'minimal';
export type Finish = 'soft' | 'glass';
export interface ProcDesign {
  id: string; handle: string; name: string; family: Family; theme: ThemeHandle;
  seed: number; holo: boolean; finish: Finish; priceFromInr: number;
  palette: { base: string; a: string; b: string; c: string; ink: string }; // product content, hex allowed here only
  quote?: string; badge?: 'bestseller' | 'limited'; trendingRank?: number; isNew?: boolean;
}
```

Designs (id · name · family · theme · priceFrom · flags):
1. `midnight-marble` Midnight Marble · marble · marble · 349 · bestseller, rank 2
2. `rose-quartz` Rose Quartz · marble · marble · 349 · rank 8
3. `ink-and-gold` Ink & Gold · marble · marble · 349 · new
4. `sage-stone` Sage Stone · marble · marble · 349
5. `holo-shift` Holo Shift · holo · holographic · 349 · holo, glass, bestseller, rank 1
6. `chrome-candy` Chrome Candy · holo · holographic · 349 · holo, glass, new
7. `prism-pop` Prism Pop · holo · holographic · 349 · holo, glass
8. `oil-slick` Oil Slick · holo · holographic · 349 · holo, glass, limited
9. `aurora-night` Aurora Night · aurora · abstract · 349 · glass, rank 4
10. `northern-haze` Northern Haze · aurora · abstract · 349 · glass, new
11. `deep-nebula` Deep Nebula · aurora · abstract · 349 · glass
12. `checker-wave` Checker Wave · y2k · aesthetic · 299 · rank 5
13. `candy-grid` Candy Grid · y2k · aesthetic · 299 · new
14. `retro-tiles` Retro Tiles · y2k · aesthetic · 299
15. `main-character` Main Character · quote ("main character") · quotes · 299 · bestseller, rank 3
16. `soft-launch` Soft Launch · quote ("soft launch") · quotes · 299
17. `no-thoughts` No Thoughts · quote ("no thoughts") · quotes · 299 · new
18. `chai-first` Chai First · quote ("chai first") · quotes · 299 · rank 7
19. `sticker-bomb` Sticker Bomb · sticker · aesthetic · 299 · rank 6
20. `smiley-days` Smiley Days · sticker · aesthetic · 299
21. `star-sign` Star Sign · sticker · aesthetic · 299 · new
22. `less-is-more` Less Is More · minimal · minimal · 299
23. `one-arc` One Arc · minimal · minimal · 299 · limited
24. `quiet-dot` Quiet Dot · minimal · minimal · 299

Finish: marble, holo, aurora = `glass` (soft variant also exists in Medusa; `priceFromInr` is the soft price). Quote strings are the only text ever painted; the list lives in the catalog and must never contain brand, celebrity, franchise or lyric text (spec §10).

**Palettes** are product content and live as hex in the catalog (they also feed `designCss`). UI colours never do.

**Noise** `lib/designs/noise.ts`: `mulberry32(seed)`, `valueNoise2D`, `fbm(x, y, octaves, lacunarity 2.0, gain 0.5)`.

**Painters** `lib/designs/painters/*.ts`, each `paint(ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, w: number, h: number, design: ProcDesign): void`, deterministic from `design.seed`. All sizes scale by `s = w / 256`:
- `marble`: fill `base`; 6 veins: cubic Béziers through 5 random points spanning the tile, `lineWidth` 1–3·s, `strokeStyle` `a` at alpha 0.55, `shadowBlur` 4·s same colour; second pass 3 wider veins (6·s) in `b` at alpha 0.28 with `ctx.filter = 'blur(5px)'` when `filter` is supported (feature-test; otherwise draw at alpha 0.14 twice with ±1px offset); 40 ellipses r 20–80·s in `a` at alpha 0.035 (clouding); radial vignette edge alpha 0.22 `ink`.
- `holo`: fill `base` (silver #C9CBD6 family); `conic-gradient` via `ctx.createConicGradient(seedAngle, w/2, h/2)` through 7 hues (hsl, 51° steps, s 85%, l 62%) at alpha 0.75; 45° repeating white stripes alpha 0–0.08 period 14·s; 2% grain. `holo = true`.
- `aurora`: fill `base` (near-black); 4 tall radial gradients (`a` violet, `b` teal, `c` pink, `ink`→indigo) positioned at seeded x, 0.55–0.7 alpha, `globalCompositeOperation = 'screen'`; each gradient's x displaced per 8px row by `fbm(y*0.02)*18·s` (draw as 8px-high clipped strips) to fold the ribbons; 180 one-pixel stars alpha 0.2–0.9.
- `y2k`: 6×12 checkerboard in `a`/`b`; each column shifted vertically by `sin(col*0.9 + seed)*8·s` (wavy); a 3-stop diagonal gradient (`white 0`, `c` 0.5, `white 1`) at alpha 0.2 with `overlay`.
- `quote`: fill `base`; text `design.quote` in `700 ${56*s}px var(--font-display-name)` (Bricolage Grotesque), `ink`, rotated -8°, centred, with a 2·s offset shadow in `a`; a 10·s sticker dot in `c`. Painted **on the main thread after `document.fonts.ready`** (workers do not see the page's fonts); 4 tiles × ~3ms.
- `sticker`: fill `base` (pastel); 5–6 shapes (star, heart via Béziers, smiley arc, cloud via arcs, sparkle), white fill, 2·s `ink` stroke, rejection-sampled so they do not overlap, random rotation ±25°.
- `minimal`: fill `base` (warm off-white); one 2·s arc stroke in `ink` (radius 0.5–0.7w, random start angle, 90–140° sweep) and one filled 8·s circle in `a`; 1% grain.
- Grain: a module-level 64×64 noise `createPattern` drawn with `globalAlpha` 0.01–0.03.

**Atlas** `lib/designs/atlas.ts`: `buildAtlas(designs, size: 2048 | 1024): Promise<{ bitmap: ImageBitmap; blobUrl: string; tileOf(id): [u, v, su, sv] }>`. Grid 8 cols × 4 rows (tile 256×512 at 2048, 128×256 at 1024); 24 tiles used, 8 blank. Painting of the 20 non-text tiles happens in `atlas.worker.ts` (OffscreenCanvas, returns a transferred `ImageBitmap`); the main thread composes it onto an atlas canvas, paints the 4 quote tiles, then creates the `CanvasTexture` (`colorSpace: SRGBColorSpace`, `generateMipmaps: true`, `minFilter: LinearMipmapLinearFilter`, `anisotropy` 4 high / 1 otherwise) and exports `canvas.toBlob('image/webp', 0.82)` → `blobUrl` used by `ProcCaseThumb` as a CSS sprite sheet. Fallback without OffscreenCanvas: paint one tile per `requestAnimationFrame` on the main thread (≤ 8 ms each). Module-scope cache; built once per page life. Built whenever `tier !== 'none'` and `!saveData`, during the same idle callback that requests the 3D chunk, so the atlas is usually ready before the canvas mounts.

**Featured textures** `lib/designs/featured-texture.ts`: `getFeaturedTexture(design, size)` paints the single design at 512×1024 (256×512 on low) on demand into a `CanvasTexture`; LRU of 4; the next design in cycle order is prefetched one step ahead. The fbm thickness map (128×256) is one shared texture.

**CSS art** `lib/designs/design-css.ts`: `designCss(design): string` returns a `background` value built from the same palette (marble: two radial gradients + inline SVG feTurbulence data URI; holo: conic + repeating-linear; aurora: 3 radial, screen-like via layered alpha; y2k: `repeating-conic-gradient` checker; quote: solid + no text (text is a DOM span in the static twin); sticker: solid + 2 radial dots; minimal: solid). Used by `CaseWallStatic`, `ProcCaseThumb` fallback, `ThemeGrid` tiles and `FitBand`.

### 1.7 Field layout and per-frame simulation

`components/home/hero/three/useFieldSim.ts`. All state in preallocated `Float32Array`s; one shared `Object3D`, `Matrix4`, `Vector3`; zero per-frame allocation.

**Counts**: high 24, mid 16, low 10 (the first N designs in `FIELD_ORDER`, which is trending rank then catalog order). Featured cycles through the same N.

**Placement** (once, on mount and on breakpoint change): jittered grid, desktop 8×3 cells spacing 1.75 x / 1.55 y, jitter ±0.4, `z ∈ [-5.0, 0.5]` with trending rank 1–8 biased to `z ∈ [-1.5, 0.5]`; phones 4×4 spacing 1.45 x / 1.35 y. **Exclusion is projection-checked**: each candidate position is projected with the real camera (`vector.project(camera)`); desktop rejects NDC `x < -0.05` when `|ndc.y| < 0.85` (the copy column), phones reject NDC `y < -0.08` (the bottom 54% of the hero holds copy) and `|ndc.x| > 0.95`. Rejected cells retry up to 6 times with new jitter, then are dropped. Also reject anything within 0.9 units (projected) of the featured slot centre.

**Per-instance arrays**: `base[3]`, `phase[3]`, `freq[3] ∈ [0.2, 0.5]`, `amp = 0.22`, `tumbleAmp[3] = (0.35, 0.45, 0.15)`, `rotBase = faceCamera ± 0.1 roll`, `lift`, `liftTarget`, `scaleCur`, `scaleTarget`, `entranceDelay = seed·0.6s`, `hidden` (1 while this instance's design is featured).

**Per frame** (`t` = clock, `p = heroState.scroll`):
```
drift = sin(t·freq + phase)·amp
pos   = (base.x·(1 + 0.6p), base.y + drift.y + 1.8p, base.z + drift.z) + (0, 0, 1.6)·lift
rot   = rotBase + tumbleAmp·sin(t·freq·0.7 + phase)·(1 - lift)
scale = entrance·(hidden ? 0 : 1)·(1 + 0.08·lift)
```
`entrance` damps 0→1 (λ 8) after `entranceDelay` on canvas ready (confetti pop-in finishes within ~1.3 s). `lift` damps to `liftTarget` (λ 7 up / 4 down); `liftTarget = 1` for the hovered instance on fine pointers, 0 otherwise. `hidden` instances damp scale to 0 (λ 10) and back. Write with `dummy.position/rotation/scale → updateMatrix → setMatrixAt`; `instanceMatrix.needsUpdate = true`; `instanceMatrix.setUsage(DynamicDrawUsage)`.

Reduced motion: `drift = 0`, `tumble = 0`, `entrance = 1` immediately, no parallax, no scroll spread; the field is a still life.

### 1.8 Featured case behaviour

`heroState` (`lib/hero-state.ts`), a plain module object plus a tiny `subscribe/getSnapshot` for `useSyncExternalStore`:
```ts
export const heroState = { scroll: 0, featuredIndex: 0, hoveredInstance: -1, lastInteractionAt: 0, canvasReady: false, inView: true };
export const featuredStore = { get(): number; set(i: number): void; subscribe(cb): () => void };
```
GSAP and R3F write and read `heroState` directly; React only re-renders on `featuredStore` changes (the DOM label).

- **Slot**: desktop world `(1.6, 0.05, 3.6)` (≈ 76% from the left, 47% of canvas height tall); phones `(0, 0.85, 4.2)` (centre ≈ 31% from top). Recomputed on resize.
- **Pose**: faces camera, idle yaw `sin(t·0.9)·0.32` rad, inside drei `<Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.3} floatingRange={[-0.03, 0.03]}>`. Fine-pointer parallax adds `pointer.x·0.12` yaw and `-pointer.y·0.08` pitch, damped λ 5. Scroll: `yaw += 1.2·p` (clamped so total |yaw| ≤ 1.4 rad: the case lip and phone edge appear as you scroll, which quietly says "this is a case"), `position.y += 0.4·p`, `scale = 1 - 0.15·p`.
- **Swap** (`setFeatured(i)`): instance `i` gets `hidden = 1`; the FeaturedCase group is teleported to instance `i`'s current world position and scale 0.9, `swapDesign(design_i)` runs (texture from cache/prefetch), then the group damps to the slot (λ 6, position and scale 1). The previous instance gets `hidden = 0` and damps back from scale 0 at its base position. Net effect: one case flies forward, the old one drops back into the shelf. Duration ≈ 600 ms.
- **Auto-advance**: every 4000 ms while `inView`, `canvasReady`, document visible, not reduced-motion, and `now - lastInteractionAt > 8000`. Order = `FIELD_ORDER`.
- **Input**: R3F events on the InstancedMesh. `onPointerOver/Out` (fine pointers) set `hoveredInstance` and `cursor: pointer`. A tap/click (pointerdown→pointerup < 250 ms and < 8 px travel, checked in a shared `useTap` helper so drags never trigger it) on a field instance → `setFeatured(designIndexOf(instanceId))` and `lastInteractionAt = now`. Tap/click on the FeaturedCase → `router.push('/products/' + design.handle)` (route prefetched when the design becomes featured). Keyboard: the hero `<section>` is focusable (`tabIndex={0}`, `role="region"`, `aria-label="Featured designs"`); `ArrowLeft/ArrowRight` move featured, `Enter` follows the featured link. A horizontal drag (|dx| > 10 px) pans the camera on touch; vertical gestures scroll.
- **DOM FeaturedLabel** (`components/home/hero/FeaturedLabel.tsx`, client): a pill row `[‹] Holo Shift · from ₹349 [View →] [›]`, 44 px targets, `aria-live="polite"` on the name span, prev/next `<button aria-label>`, the name+price is an `<a href="/products/[handle]">`. Framer `AnimatePresence mode="popLayout"` crossfades the text (200 ms). Phones: positioned at the seam between field zone and copy (top 54% + 8 px); desktop: under the slot, grid columns 8–11. Under reduced motion the swap is instant.
- **Visible hint**: "Tap a cover to try it" (phones) / "Click a cover" (desktop) in `--color-fg-on-ink-muted` under the label, removed after the first interaction (`localStorage` key `hero-hint-seen`, wrapped in try/catch).

**Frameloop** (`lib/perf/use-hero-frameloop.ts`): IntersectionObserver on the hero (threshold 0) + `visibilitychange`: `frameloop = inView && visible ? (reducedMotion ? 'demand' : 'always') : 'never'`; under reduced motion `invalidate()` is called on featured change and on resize. After `heroState.scroll >= 1` the loop is `'never'`; the rest of the page costs no GPU.

### 1.9 Lighting and environment

- `ambientLight` 0.4 (0.6 on low). `directionalLight` key `(4, 6, 6)` intensity 1.6 white. `directionalLight` fill `(-5, -2, 4)` 0.5, colour `token(--color-light-fill)`. `pointLight` rim `(0, 2, -4)` intensity 6, distance 14, colour `token(--color-light-rim)`.
- high: `<Environment resolution={64} frames={1}>` with three `<Lightformer>` children (top strip `form="rect"` scale `[10, 1, 1]` at `[0, 5, 0]` intensity 2 white; left `scale [1, 6, 1]` at `[-6, 0, 2]` intensity 1.2 colour `--color-light-rim`; right `[6, 0, 2]` intensity 1.2 colour `--color-light-fill`). Rendered once. mid: same with `resolution={32}`. low: no Environment.
- No shadows, no postprocessing, no fog, no HDR, no Sparkles.
- Draw calls per frame: 1 (field) + 5 (featured) = 6, plus the env cubemap once at mount.

### 1.10 CaseWallStatic (SSR CSS-3D twin, section the server always renders)

`components/home/hero/CaseWallStatic.tsx` (server component). Eight `.case` divs (6 on phones via CSS `display:none` on the last two) with `transform: translate3d(x, y, 0) rotateY(ry) rotateX(rx) scale(s)` in a `perspective: 1200px` container, each `aspect-ratio: 74/152`, `border-radius: 14%/7%`, `background: designCss(design)`, an inner `.island` div, a `box-shadow` for depth, `backface-visibility: hidden`, and a `::after` clearcoat highlight (`linear-gradient(115deg, white 0 / 0.35 → transparent 45%)`). One larger `.case--featured` at the featured slot position with the first `FIELD_ORDER` design and a quote `<span>` when the design is a quote. Keyframe float (12–16 s, `translateY ±6px`) disabled under reduced motion. Positions are precomputed constants that mirror the 3D slot/exclusion zones. When tier is `none`, `FeaturedLabel` still works: prev/next swap the featured div's `background` with a 300 ms crossfade (two stacked divs) and the link updates. This twin is the first paint for everyone and the permanent hero for ~20–30% of the audience; it must look finished, not like a loader.

### 1.11 Ready sequence

Server HTML → fonts preloaded → `CaseWallStatic` visible immediately (LCP = h1 text). After `window.load` and `requestIdleCallback` (timeout 1500 ms), and only if `tier !== 'none'` and the hero is intersecting: start `buildAtlas` and `import()` the 3D chunk in parallel. When the Canvas mounts: `onCreated` sets renderer options, pre-generates the first featured texture, calls `gl.compile(scene, camera)`; after the first `useFrame` sets `heroState.canvasReady = true`, set `--hero-canvas-opacity: 1` on the wrapper and add `.is-3d` to the section (static twin fades to 0 over 400 ms; the swap is opacity only, no layout change). Entrance pop-in starts on the same frame. If the chunk fails to load within 8 s, or `webglcontextlost` fires, or `PerformanceMonitor` demotes below `low`: remove `.is-3d`, unmount the Canvas, persist `tier=none` in `sessionStorage`.

---

## 2. Scroll narrative (no pinning anywhere)

GSAP ScrollTrigger owns scroll-position effects; Framer Motion owns state/pointer effects; `useFrame` owns in-canvas motion and reads `heroState`. All ScrollTriggers are created inside `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`; `ScrollTrigger.config({ ignoreMobileResize: true })`; refresh on `document.fonts.ready` and `orientationchange`.

**0 · Hero (0 → 100svh, free-scrolling).** `ScrollTrigger({ trigger: hero, start: 'top top', end: 'bottom top', scrub: true, onUpdate: s => { heroState.scroll = s.progress } })`. The field spreads (x × 1.6, y + 1.8) and the featured case yaws, lifts and shrinks (1.8). A `gsap.quickSetter(wrapper, '--hero-canvas-opacity')` maps `p 0.6 → 0.95` to opacity `1 → 0`. The headline is a normal block scrolling at page speed; the two speeds give parallax depth. Mobile address-bar resizes cannot jump anything because nothing is pinned. Reduced motion or tier none: the hero simply scrolls off.

**1 · PhonePickerSection (first block, still on ink tokens).** Heading and controls reveal with the shared `data-reveal` batch (`y 24 → 0`, `autoAlpha 0 → 1`, 600 ms, `--ease-out-expo`, stagger 60 ms, `once`). No 3D.

**2 · TrustStrip** on `--color-paper`: the visible seam from stage to store. Batch reveal.

**3 · FitBand ("Same design. Your phone.")** CSS 3D, three case silhouettes straighten from `rotateY(-24deg)` to `0` as the band scrubs from `top 90%` to `center center` (GSAP `scrub: 0.5` on transforms only). Reduced motion: static at 0.

**4 · TrendingRow.** Cards reveal with the batch (stagger 50 ms, first 6 only). Native scroll-snap; no JS carousel.

**5 · NewArrivalsRow.** Same.

**6 · ThemeGrid.** Batch reveal. Desktop fine-pointer: tile art translates 10 px against the pointer (Framer `useMotionValue`).

**7 · BrandRow.** Batch reveal.

**8 · WhyUs.** Batch reveal.

**9 · FinalCta** (ink band returns; a static CSS-3D fan of three cases). Batch reveal.

**10 · Footer.** Static. `StickyPhoneCta` (phones only) slides up once the hero has left the viewport and hides while the picker sheet is open or the footer is visible. `WhatsAppFab` is fixed bottom-right from load, hidden while the picker sheet is open, offset above the sticky bar on phones.

---

## 3. Section-by-section spec

### 3.1 Hero copy (`HeroCopy.tsx`, server)
- Eyebrow: `BRAND_NAME · Back covers for 15 phones` (0.75rem, uppercase, tracking 0.16em, `--color-fg-on-ink-muted`).
- `<h1>` (LCP element): **"Trending covers. Cut for your phone."** `--text-hero`, Bricolage Grotesque 800, `--color-fg-on-ink`, max 2 lines on desktop, 3 on phones (`text-wrap: balance`).
- Sub: "New designs every week, made for your exact model. From ₹{MIN_PRICE_INR}. Cash on Delivery available." (`--color-fg-on-ink-muted`, max 2 lines).
- CTAs: primary `Button size="lg"` "Select your phone" (bg `--color-accent`, text `--color-ink`, 48 px, `rounded-full`) → opens `PhonePickerSheet` (client `OpenPickerButton`). Secondary ghost "Shop trending" → `#trending`. Phones: full-width stacked.
- Trust ticker (one line, 0.8125rem): "COD · Free shipping over ₹{FREE_SHIPPING_THRESHOLD_INR} · {REPLACEMENT_DAYS}-day replacement" from `lib/brand.ts`.
- Scroll cue: 1 × 36 px hairline pulsing `scaleY` (2 s), hidden under reduced motion.
- Desktop grid: 12 cols; copy spans 1–5, vertically centred; featured slot/label spans 8–11. Phones: field zone top 54%, label at the seam, copy below with 16 px gutters and `env(safe-area-inset-bottom)`.

### 3.2 PhonePickerSection (`PhonePickerSection.tsx` server + `PhonePicker.tsx` client)
- Purpose: capture the model once (`my_phone` cookie, 365 days, `SameSite=Lax`, not httpOnly so the client can read it).
- Heading "Which phone is yours?" (`--text-h2`), copy "Pick once. Every list below shows only covers that fit."
- shadcn `Tabs` for brands from `getPhoneModels()` (fixtures until the Medusa route exists): Apple, Samsung, OnePlus, Redmi, Realme, Vivo, iQOO, Nothing, Motorola, Oppo. Tabs strip is horizontal scroll-snap on phones. Each tab shows a 20 px generic CSS phone outline (no logos).
- Model chips (wrap grid, 44 px min height) for the active brand; a search `Input` appears when a brand has > 10 models.
- Selecting a chip calls the server action `setMyPhone(slug)` and updates `MyPhoneProvider` optimistically; the CTA morphs (Framer `layout`) to "Show covers for Redmi Note 14 Pro →" linking `/phones/[brand]/[model]` and pulses once (spring scale 1 → 1.04 → 1). Pre-selected state when the cookie exists: chip ringed in `--color-accent-2`, link "Not your phone? Change".
- `PhonePickerSheet.client.tsx` is the same control inside shadcn `Drawer` (phones) / `Dialog` (desktop), `next/dynamic`, prefetched on CTA hover/focus, opened by hero, FitBand, FinalCta and the sticky bar.
- Launch models (`lib/phone-models.fixtures.ts`, replace by `GET /store/phone-models`): iPhone 16, iPhone 16 Pro, iPhone 15, Galaxy S25, Galaxy A55, OnePlus 13, OnePlus Nord CE4, Redmi Note 14 Pro, Redmi Note 13, Realme 13 Pro, Vivo V40, iQOO Z9, Nothing Phone (3a), Motorola Edge 50, Oppo Reno 12.

### 3.3 TrustStrip (`TrustStrip.tsx`, server)
Four items, lucide icons in `--color-accent-text`: "Cash on Delivery", "Free shipping over ₹{FREE_SHIPPING_THRESHOLD_INR}", "{REPLACEMENT_DAYS}-day replacement", "Ships in 24–72 h". Four columns on desktop, scroll-snap row on phones. `variant="band" | "inline"` (inline reused in FinalCta).

### 3.4 FitBand (`FitBand.tsx` server shell + `FitBandCases.client.tsx`)
- Heading "Same design. Your phone." Sub "Every cover is cut for the exact camera and buttons of your model."
- Three CSS-3D phone silhouettes side by side (`perspective 1000px`, `transform-style: preserve-3d`), each `.case` with `background: designCss(featuredDesign)` (synced to the hero via `featuredStore`; crossfade 300 ms), a dark `.phone` layer behind with a 6 px lip, and a camera cutout that differs per silhouette: **square island**, **vertical pill**, **centred ring**. These are abstract layouts shared by many brands; do not match any brand's proportions.
- Labels under them come from the picker data: the first three launch models, or, when `my_phone` is set, the third shows the user's model with an accent ring and the word "Yours". Caption "+12 more models".
- CTA "Select your phone — see only what fits" opens the sheet. Scroll scrub straighten per section 2.

### 3.5 TrendingRow (`TrendingRow.tsx` server; `#trending`)
- Header "Trending this week" + "View all →" `/trending`. Client leaf `RowHeaderForPhone` appends " for {model}" when the cookie exists (text slot reserved, no shift).
- 8 `ProductCard`s from `getTrending()` ordered by `trending_rank`, horizontal `snap-x mandatory`, 2.3 cards visible on phones, 5 on desktop, scrollbar hidden.
- `ProductCard`: `ProcCaseThumb` (aspect 1/2 CSS case: rounded rect, island div, face = atlas sprite via `background-image: url(blobUrl); background-size: 800% 400%; background-position` from tile index, fallback `designCss`), name, "from ₹299" (`tabular-nums`), `Badge` for bestseller/limited in `--color-badge`, rank number for 1–3 in `--color-accent-text`, "Fits {model}" line (client leaf, from `fitsModels: string[]` passed by the server for each product). Fine-pointer tilt ±8° (`TiltCard.client`), touch press scale 0.97. Prefetches `/products/[handle]` on hover/focus.

### 3.6 NewArrivalsRow
Same components, header "New this week", 6 items with `isNew`, cards 15% narrower.

### 3.7 ThemeGrid (`ThemeGrid.tsx`, server)
Six tiles → `/categories/[handle]`: Minimal, Aesthetic, Abstract, Quotes, Marble, Holographic. 2×3 on phones, 3×2 on desktop, tall rounded cards with the theme's representative design `designCss` clipped into a case silhouette, name bottom-left in display type, count "{n} designs" (from fixtures/categories). Hover scales the art 1.04 inside `overflow-hidden`.

### 3.8 BrandRow (`BrandRow.tsx`, server)
Pill cards "Samsung · 2 models" → `/phones/[brand]`, generic outline icon, no logos. Line under: "Don't see your phone? WhatsApp us" → the FAB link.

### 3.9 WhyUs (`WhyUs.tsx`, server)
Three cards: "Ships from India in 24–72 h", "UPI, cards, netbanking, COD", "WhatsApp support, replies in hours". Payment and courier names as plain text; no third-party logos.

### 3.10 FinalCta (`FinalCta.tsx`, server)
Ink band: "Find covers for your phone", primary button opens the sheet, inline TrustStrip. Static CSS-3D fan of three cases (`designCss` of ranks 1–3).

### 3.11 Footer + chrome
`Header` (BRAND_NAME wordmark, Trending / Themes / Phones, search, cart icon; transparent over the hero, gains `--color-ink/80` backdrop-blur after 24 px scroll), `Footer` (Shop, Help, Policies, Contact columns; shipping/returns/privacy/terms/contact links required for Razorpay approval; GSTIN placeholder), `WhatsAppFab`, `StickyPhoneCta`.

---

## 4. Design tokens (`app/globals.css`, Tailwind v4 `@theme`)

Components reference tokens only (`bg-ink`, `text-fg`, `border-border`, `var(--color-*)`); the 3D scene reads them at mount via `readToken()`. Design palettes (product content) are the one exception and live in the catalog.

```css
@import "tailwindcss";

@theme {
  /* stage (hero, picker, final CTA) */
  --color-ink: #0C0B1C;
  --color-ink-2: #171433;
  --color-fg-on-ink: #F7F4FF;
  --color-fg-on-ink-muted: #B5B0CC;
  --color-surface-glass: rgb(255 255 255 / 0.08);

  /* store */
  --color-paper: #FAF7F2;
  --color-surface: #FFFFFF;
  --color-surface-2: #F1ECE4;
  --color-border: #E6E0D6;
  --color-fg: #141320;
  --color-fg-muted: #6B6880;

  /* brand */
  --color-accent: #FF6B3D;        /* buttons: ink text on accent, 6.4:1 */
  --color-accent-hover: #FF7F58;
  --color-accent-text: #B8431C;   /* accent as text on paper, 5.1:1 */
  --color-accent-2: #8B7CFF;      /* focus rings, active chips, holo sheen */
  --color-badge: #D9FF5C;         /* bestseller/limited, ink text */
  --color-success: #1F9D6B;
  --color-warn: #C98A00;

  /* 3D materials and lights (read by readToken) */
  --color-island: #141225;
  --color-phone: #1A1826;
  --color-lens: #050509;
  --color-metal: #8A8F99;
  --color-light-rim: #FF6B3D;
  --color-light-fill: #8B7CFF;

  /* type */
  --font-display: var(--font-bricolage);
  --font-sans: var(--font-inter);
  --text-hero: clamp(2.125rem, 1.1rem + 4.6vw, 4.75rem);
  --text-h2: clamp(1.625rem, 1rem + 2.2vw, 2.625rem);
  --text-h3: 1.25rem;
  --text-body: 1rem;
  --text-caption: 0.8125rem;

  /* motion */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
  --dur-micro: 160ms;
  --dur-ui: 300ms;
  --dur-reveal: 600ms;
  --dur-scene: 400ms;

  --radius-card: 1.25rem;
  --radius-pill: 9999px;
}

/* dark mode: store surfaces invert, stage tokens unchanged */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-paper: #121120; --color-surface: #1A1829; --color-surface-2: #221F35;
    --color-border: #2C2940; --color-fg: #F3F1FA; --color-fg-muted: #A7A3BC;
    --color-accent-text: #FF8A62;
  }
}
:root[data-theme="dark"] { /* same values as above */ }

body { background: var(--color-paper); color: var(--color-fg); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}
```

`lib/motion/tokens.ts` mirrors the easing/duration values for GSAP (`CustomEase` not needed: use `'expo.out'` and `'power3.inOut'`) and Framer (`[0.16, 1, 0.3, 1]`, springs `{ stiffness: 260, damping: 28 }` for chips/sheet, `{ stiffness: 400, damping: 30 }` for tilt).

Contrast audit (must hold): `--color-fg-on-ink` on `--color-ink` ≈ 17:1; `--color-fg-on-ink-muted` on ink ≈ 9:1; `--color-fg` on paper ≈ 15:1; `--color-fg-muted` on paper ≈ 5.3:1; ink text on `--color-accent` ≈ 6.4:1; `--color-accent-text` on paper ≈ 5.1:1; ink text on `--color-badge` ≈ 15:1. `--color-accent-2` is decorative only (focus ring 3:1 against both backgrounds is sufficient for non-text).

---

## 5. Typography

- Display: **Bricolage Grotesque** (variable, `wght 500–800`, `opsz`), `next/font/google`, `subsets: ['latin']`, `display: 'swap'`, `preload: true`, `adjustFontFallback: true`, variable `--font-bricolage`.
- Body/UI: **Inter** (variable), same loader, variable `--font-inter`, `font-feature-settings: 'tnum'` on prices/counts.
- Scale per tokens above; h1 `line-height 0.98`, `letter-spacing -0.025em`; h2 `1.05 / -0.02em`; body `1rem/1.5` phones, `1.0625rem/1.55` desktop; captions `0.8125rem`. All copy in English; Hinglish allowed only inside quote designs.
- The hero h1 is server text and the intended LCP element; no image or canvas is LCP.
- The quote painter uses the display font's family name via a constant exported from the font module (`BRICOLAGE_FAMILY`) and waits for `document.fonts.load('700 56px "Bricolage Grotesque"')`.

---

## 6. Motion system

Ownership rule: anything bound to scroll position is GSAP; anything bound to state or pointer is Framer Motion; anything inside the canvas is `useFrame` (with `maath/easing.damp`). No element is both a GSAP target and a `motion.*` component.

- **GSAP** (`gsap` + `ScrollTrigger`, registered once in `components/motion/GsapProvider.tsx`, loaded with `next/dynamic` after hydration from `Reveal.client.tsx`): hero scroll scrub → `heroState.scroll` and canvas opacity; `ScrollTrigger.batch('[data-reveal]')` reveals; FitBand straighten; header shrink. Only transforms and opacity, never layout properties.
- **Framer Motion** (`motion/react`, `LazyMotion features={domAnimation} strict`, client leaves only): FeaturedLabel text (`AnimatePresence`), picker sheet (spring 260/28), chip/tab active indicator (`layoutId`), CTA morph, card tilt (`useMotionValue` + `useSpring`), `whileTap` scale 0.97, StickyPhoneCta slide.
- **useFrame**: field sim, featured pose/swap, camera parallax, entrance pop.
- Durations: micro 160 ms, ui 300 ms, reveal 600 ms, canvas crossfade 400 ms, featured swap ≈ 600 ms (damp), auto-advance 4000 ms, idle-after-interaction 8000 ms.

**Reduced motion** (`prefers-reduced-motion: reduce`, via `useReducedMotion` + `gsap.matchMedia` + Framer `MotionConfig reducedMotion="user"`): no drift/tumble/pop/parallax/auto-advance; frameloop `demand`; no scroll spread (canvas fades via a plain CSS rule as it scrolls off); batch reveals disabled (content visible); Framer transitions become 150 ms opacity; FitBand static; scroll cue hidden; swaps instant. The 3D still renders as a still life when the GPU allows, because a static 3D shelf is not motion.

---

## 7. Mobile, reduced-motion and low-GPU fallbacks

**Tiers** (`lib/perf/device-tier.ts`, decided once on the client in an effect, cached in module scope and `sessionStorage`; the server never guesses):
- `none`: `navigator.connection.saveData`, or `effectiveType ∈ {slow-2g, 2g}`, or no WebGL2, or `deviceMemory <= 2`, or `UNMASKED_RENDERER` matches `/Mali-4|Mali-T|Adreno \(TM\) [3-4]\d\d|PowerVR SGX|SwiftShader|llvmpipe/i`, or `sessionStorage.heroTier === 'none'`. Result: CSS twin only; 3D chunk and atlas never requested.
- `low`: `deviceMemory <= 3`, or `hardwareConcurrency <= 4`, or `effectiveType === '3g'`, or renderer matches `/Mali-G5\d|Adreno \(TM\) 5\d\d|Adreno \(TM\) 61\d/i`. Settings: 10 cases, DPR 1, atlas 1024, featured texture 256×512, `MeshStandardMaterial` featured (no iridescence), no Environment, smoothness 2, antialias off, no hover lift.
- `mid`: any other viewport < 1024 px. 16 cases, DPR `min(devicePixelRatio, 1.25)`, atlas 1024, featured 512×1024 with iridescence, Environment 32, smoothness 2, antialias off.
- `high`: otherwise. 24 cases, DPR `min(devicePixelRatio, 1.75)`, atlas 2048, Environment 64, smoothness 4, antialias on.

**Runtime downgrade**: drei `<PerformanceMonitor bounds={[40, 58]} flipflops={2}>`: `onDecline` steps DPR down one notch first, then the tier (`high → mid → low → none`), never upgrades; `none` unmounts the Canvas and fades the twin back in. Decision persisted in `sessionStorage`.

**Phone layout**: hero 100svh; field zone top 54% (projection-checked); label at the seam; copy and stacked full-width CTAs in the bottom 46% over the scrim; trust ticker inside the first viewport. All tap targets ≥ 44 px. Canvas `touch-action: pan-y`. Rows are native scroll-snap. `StickyPhoneCta` after the hero leaves view.

**Hydration safety**: the first client render matches the server (twin visible, no canvas); tier detection and dynamic import run in `useEffect`.

---

## 8. Performance plan

**Budgets** (Lighthouse mobile, Moto G Power class, Slow 4G, enforced in CI with `@lhci/cli` and `lighthouse-budget.json`): LCP ≤ 2.5 s, CLS ≤ 0.02, TBT ≤ 200 ms, INP ≤ 200 ms. Initial route JS ≤ 140 kB gz. Hero 3D chunk ≤ 230 kB gz (fail CI above). GSAP chunk ≤ 35 kB gz.

**Splitting**: `/` server component ships Next runtime + React + shadcn Button/Badge + `motion/react` LazyMotion (~18 kB) in client leaves only. Client components on `/`: `HeroShell` (tier, loader, label), `FeaturedLabel`, `OpenPickerButton`, `PhonePicker`, `RowHeaderForPhone`, `FitsLine`, `TiltCard`, `FitBandCases`, `Reveal`, `StickyPhoneCta`, `WhatsAppFab`, `HeaderScrollState`. The 3D chunk is `next/dynamic(() => import('./three/CaseWall.client'), { ssr: false, loading: () => null })` containing `three@0.170.0`, `@react-three/fiber@^9`, drei named imports only (`Float`, `Environment`, `Lightformer`, `PerformanceMonitor`), `maath`, the geometry/material/sim code. Drawer/Dialog/Tabs/Command live inside the picker chunk. `@next/bundle-analyzer` runs in CI; no barrel re-exports in `components/`.

**Network**: zero images, models or HDRs. Two font families (~70 kB woff2), preloaded. Homepage HTML < 60 kB gz; static-cached at Cloudflare and revalidated via `/api/revalidate` with fetch tags `products`, `phone-models`. The page never reads the cookie on the server; personalisation is client-side text swaps in reserved slots.

**GPU**: 6 draw calls per frame; ≈ 31k triangles at high (24 × 1.3k + 6k), ≈ 10k on phones; textures: atlas 2048² (16 MB, high only) or 1024² (4 MB), featured 512×1024 (2 MB) plus thickness 128×256; env cubemap 64/32 rendered once; no shadow maps, no render targets, no postprocessing.

**Main thread**: atlas painted in a worker (≈ 60–120 ms off-thread) or one tile per rAF; quote tiles 4 × ~3 ms after fonts; `gl.compile` before the crossfade; no React state in the frame loop; no layout reads in `useFrame`; passive listeners only. Layout stability: hero height from CSS, canvas absolutely positioned, label text in fixed-height slots, cards reserve `aspect-ratio: 1/2`, fonts with `adjustFontFallback`.

**Measurement**: `web-vitals` reporter in `app/(store)/layout.tsx` posting to `/api/vitals` (dev/staging only); Lighthouse CI on every PR touching `apps/storefront`; Playwright smoke: (a) at 375×812 with `navigator.connection.saveData` mocked true the 3D chunk request never happens and the twin is visible; (b) on desktop with WebGL the canvas mounts, `CaseMaterial` compiles without throwing and `FeaturedLabel` changes on ArrowRight; (c) no long task > 100 ms after the chunk settles with 4× CPU throttle.

---

## 9. Component list (all under `apps/storefront/src/`)

**App**
- `app/(store)/page.tsx` — server; `getTrending()`, `getNewArrivals()`, `getPhoneModels()`, `getThemes()` (tagged fetch; fixtures until Medusa); composes sections; `metadata`; ItemList JSON-LD.
- `app/(store)/layout.tsx` — fonts, `MotionProvider`, `MyPhoneProvider`, `Header`, `Footer`, `WhatsAppFab`, `StickyPhoneCta`, grain overlay, web-vitals.
- `app/globals.css` — tokens (section 4), reveal/scrim utilities.
- `app/api/revalidate/route.ts` — (spec §2) tag revalidation with shared secret.

**Lib**
- `lib/brand.ts` — `BRAND_NAME = 'STORE_NAME_TBD'`, `FREE_SHIPPING_THRESHOLD_INR = 499`, `REPLACEMENT_DAYS = 7`, `COD_FEE_INR = 0`, `MIN_PRICE_INR = 299`, `WHATSAPP_NUMBER = '91XXXXXXXXXX'`, `DISPATCH_WINDOW = '24–72 h'`, `LAUNCH_BRANDS`.
- `lib/theme/read-token.ts` — `readToken(name): string` via `getComputedStyle(document.documentElement)`; `tokenColor(name): THREE.Color`.
- `lib/motion/tokens.ts` — easing/duration/spring mirrors.
- `lib/hero-state.ts` — `heroState`, `featuredStore`, `useFeaturedIndex()`.
- `lib/perf/device-tier.ts` — `detectTier()`, `TIER_SETTINGS`, `persistTier()`.
- `lib/perf/use-hero-frameloop.ts` — IntersectionObserver + visibility → frameloop.
- `lib/perf/use-tap.ts` — tap-vs-drag discriminator shared by canvas and cards.
- `lib/device/use-reduced-motion.ts`, `lib/device/use-fine-pointer.ts`.
- `lib/designs/catalog.ts`, `lib/designs/noise.ts`, `lib/designs/painters/{marble,holo,aurora,y2k,quote,sticker,minimal,index}.ts`, `lib/designs/atlas.ts`, `lib/designs/atlas.worker.ts`, `lib/designs/featured-texture.ts`, `lib/designs/design-css.ts`, `lib/designs/use-atlas.ts` (module cache, `{ texture, blobUrl, tileOf, ready }`).
- `lib/three/case-geometry.ts` — `createFieldGeometry(smoothness)`, `createFeaturedParts(smoothness)`.
- `lib/medusa/client.ts`, `lib/medusa/home.ts` (`getTrending`, `getNewArrivals`, `getPhoneModels`, `getThemes` with tags), `lib/medusa/fixtures.ts` (24 designs as products with `fitsModels`, 15 phone models, 6 themes).
- `lib/phone/use-my-phone.ts` + `components/phone-picker/MyPhoneProvider.tsx` — cookie read, optimistic set, `{ slug, brand, model }`.

**Hero**
- `components/home/hero/Hero.tsx` — server shell: backdrop, `CaseWallStatic`, `HeroShell`, `HeroCopy`, scrim.
- `components/home/hero/HeroCopy.tsx` — server; h1, sub, CTAs, ticker, cue.
- `components/home/hero/CaseWallStatic.tsx` — server; CSS-3D twin.
- `components/home/hero/HeroShell.client.tsx` — tier detection, idle/in-view gating, dynamic import, crossfade, context-loss, keyboard handling, `FeaturedLabel` mount.
- `components/home/hero/FeaturedLabel.tsx` — client; name/price link, prev/next, hint, live region.
- `components/home/hero/OpenPickerButton.tsx` — client; opens the sheet, prefetches it.
- `components/home/hero/three/CaseWall.client.tsx` — `<Canvas>`, camera, lights, `PerformanceMonitor`, `CaseField`, `FeaturedCase`, `useHeroScroll`.
- `components/home/hero/three/CaseField.tsx` — InstancedMesh, attributes, events, `useFieldSim`.
- `components/home/hero/three/CaseMaterial.ts` — the patched material (1.4).
- `components/home/hero/three/useFieldSim.ts` — layout + sim (1.7).
- `components/home/hero/three/FeaturedCase.tsx` — assembly, pose, swap (1.3, 1.8).
- `components/home/hero/three/useFeaturedMaterial.ts` — (1.5).
- `components/home/hero/three/SceneLights.tsx` — lights + Environment by tier.
- `components/home/hero/three/usePointerParallax.ts` — desktop parallax / touch pan.
- `components/home/hero/three/useHeroScroll.ts` — GSAP scrub → `heroState.scroll`, canvas opacity setter.

**Store sections**
- `components/home/PhonePickerSection.tsx`, `components/phone-picker/PhonePicker.tsx`, `components/phone-picker/PhonePickerSheet.client.tsx`, `components/phone-picker/actions.ts` (`'use server'` `setMyPhone(slug)` validates against known slugs, sets cookie), `components/phone-picker/BrandOutline.tsx`.
- `components/home/TrustStrip.tsx`, `components/home/FitBand.tsx`, `components/home/FitBandCases.client.tsx`, `components/home/TrendingRow.tsx`, `components/home/NewArrivalsRow.tsx`, `components/home/RowHeaderForPhone.client.tsx`, `components/home/ThemeGrid.tsx`, `components/home/BrandRow.tsx`, `components/home/WhyUs.tsx`, `components/home/FinalCta.tsx`, `components/home/StickyPhoneCta.client.tsx`.
- `components/product/ProductCard.tsx`, `components/product/ProcCaseThumb.tsx`, `components/product/FitsLine.client.tsx`, `components/motion/TiltCard.client.tsx`.
- `components/motion/MotionProvider.tsx` (LazyMotion + MotionConfig), `components/motion/GsapProvider.tsx`, `components/motion/Reveal.client.tsx`.
- `components/layout/Header.tsx`, `components/layout/HeaderScrollState.client.tsx`, `components/layout/Footer.tsx`, `components/layout/WhatsAppFab.client.tsx`.
- `components/ui/{button,badge,tabs,drawer,dialog,input,scroll-area}.tsx` — shadcn primitives themed via tokens only.

**Config**: `package.json` pins `three@0.170.0`, `@types/three@0.170.0`, `@react-three/fiber@^9.1`, `@react-three/drei@^10.0`, `maath@^0.10`, `gsap@^3.13`, `motion@^12`; `next.config.ts` enables `experimental.reactCompiler` and the bundle analyzer under `ANALYZE=1`; `lighthouse-budget.json`; `.github/workflows/storefront-ci.yml` (typecheck, lint, build, analyzer gate, LHCI, Playwright smoke).

---

## 10. Implementation order

1. **Foundation (day 1)**: `globals.css` tokens, fonts, `lib/brand.ts`, `lib/medusa/fixtures.ts` + fetcher interfaces, layout chrome (Header, Footer, WhatsAppFab), `page.tsx` with every section server-rendered using `designCss` art only, `CaseWallStatic`, `HeroCopy`. Run Lighthouse: this static page must already pass LCP/CLS budgets before any JS is added.
2. **Designs (day 2)**: `catalog.ts`, `noise.ts`, the 7 painters, `design-css.ts`, `atlas.ts` + worker + main-thread fallback, `featured-texture.ts`, `use-atlas.ts`, `ProcCaseThumb` sprite upgrade. Review all 24 tiles at 512×1024 in a dev page (`/dev/designs`, excluded from prod) with the owner before continuing: this is the pass that decides whether the store looks premium.
3. **Conversion blocks (day 3)**: `MyPhoneProvider`, `actions.ts`, `PhonePicker`, `PhonePickerSheet`, `PhonePickerSection`, `TrustStrip`, `FitBand` (CSS 3D, synced to `featuredStore`), `TrendingRow`/`NewArrivalsRow` with `FitsLine` and `RowHeaderForPhone`, `ThemeGrid`, `BrandRow`, `WhyUs`, `FinalCta`, `StickyPhoneCta`, `Reveal` batch.
4. **3D core (day 4)**: `device-tier.ts`, `HeroShell` gating + crossfade + context-loss, `case-geometry.ts`, `CaseMaterial.ts` (with the chunk assertions), `CaseField` + `useFieldSim` (layout with projection exclusion, drift, entrance), `SceneLights`, `FeaturedCase` + `useFeaturedMaterial` + slot pose. Verify on a real Redmi/Realme device that the twin → canvas swap has no visible jump.
5. **Interaction and scroll (day 5)**: tap/hover → featured, auto-advance, keyboard, `FeaturedLabel` live region, `useHeroScroll` (no pin), `usePointerParallax`, `use-hero-frameloop`, `PerformanceMonitor` downgrade, reduced-motion paths (twin, 3D still life, instant swaps), FitBand scrub.
6. **Hardening (day 6)**: bundle analyzer gate, LHCI budgets, Playwright smoke tests, a11y audit (axe: contrast, focus order, live region), AMOLED banding check on a real device, iOS Safari check of scroll fade, painter polish from step 2 feedback, remove dev page from prod build.

---

## 11. Acceptance criteria

- `/` on Lighthouse mobile (Slow 4G, Moto G Power profile): LCP ≤ 2.5 s with the h1 as the LCP element; CLS ≤ 0.02; TBT ≤ 200 ms. Initial route JS ≤ 140 kB gz; 3D chunk ≤ 230 kB gz; CI fails otherwise.
- With `saveData: true` or no WebGL2, the 3D chunk and the atlas worker are never requested and the hero shows the CSS twin with a working FeaturedLabel (prev/next swap the design, link works).
- With WebGL, the canvas crossfades over the twin with no layout shift, the first frame is already lit and textured (gl.compile ran), and the field finishes its pop-in within 1.5 s of mount.
- Exactly 6 draw calls per frame at rest on every tier (verify with `renderer.info`); no render target other than the one-time environment cubemap; no shadow maps.
- The headline is fully legible at 360 px wide against the field: no case renders inside the copy zone (projection check) and the scrim is present; manual check on a Redmi Note-class device and in DevTools at 360×740.
- On touch, a single tap on a field case makes it featured within 600 ms; a tap on the featured case or its label opens `/products/[handle]`; vertical swipes always scroll the page; a horizontal drag pans the camera and never navigates.
- Keyboard: Tab reaches the hero region, prev/next buttons, the featured link and both CTAs in order; ArrowLeft/Right change the featured design; the live region announces name and price; axe reports no contrast or name violations.
- `prefers-reduced-motion: reduce`: no drift, tumble, pop-in, parallax, auto-advance or scroll spread; reveals are visible immediately; swaps are instant.
- Phone picker: selecting a model sets `my_phone` (365 d), updates the CTA to the model link, pre-selects on reload, flips the sticky bar text, adds "for {model}" to the Trending header and "Fits {model}" to matching cards, and the FitBand's third silhouette shows the model with "Yours".
- Every section from spec §5 is present: hero, picker, Trending, New arrivals, Shop by theme, Shop by brand, trust strip (plus FitBand, WhyUs, FinalCta, footer with policy links).
- No hardcoded UI colour in any component (`grep -rE '#[0-9a-fA-F]{3,8}' src/components src/app --include=*.tsx` returns nothing); design palettes exist only in `lib/designs/catalog.ts`.
- Quote text list contains only the four original phrases; no brand, celebrity, franchise or lyric text anywhere in painted art.
- Frameloop is `never` once the hero is out of view (verify `useFrame` stops via a dev counter); scrolling back resumes it.
- Runtime downgrade: forcing 20 fps in DevTools steps DPR, then tier, then unmounts the canvas with the twin fading back in; the choice persists for the session.
- No `any` in TypeScript; `three` pinned to `0.170.0`; `CaseMaterial` throws in dev if a shader chunk is missing.
- Pointer events: the canvas never blocks the CTAs, the picker sheet or the featured label (they sit above it in z-order and the canvas wrapper does not cover the copy column on desktop or the bottom 46% on phones).

---

## Appendix A — Grafts from other concepts

- Turntable → inline Select-your-phone section as the first block after the hero, with brand tabs, model chips, server-action cookie, pre-selected state and the 'Show covers for <model>' CTA.
- Turntable → static-first hero: SSR CSS-3D twin is the first paint for everyone and the permanent hero on the none tier; 3D chunk requested only after window load + requestIdleCallback + in view.
- Turntable → mobile sticky bottom CTA that flips to 'Covers for <model>' once the hero leaves view.
- Turntable → plain mutable heroState written by GSAP scrub and read by useFrame, so no React re-render happens during scroll.
- Turntable → trust strip on paper at the stage/store seam, plus the per-design css fallback string so hero twin, cards, theme tiles and FitBand share one palette with zero images.
- Turntable → featured case yaws on scroll so the lip and the phone edge appear, selling 'this is a case' without a pin.
- Turntable → design auto-cycle every few seconds with price-labelled DOM text, applied to the featured case.
- Prism Noir → native MeshPhysicalMaterial thin-film iridescence with a canvas fbm iridescenceThicknessMap on the featured case; no custom holo shader.
- Prism Noir → no pinning anywhere: scrub-written progress lags and fades the hero as it scrolls off, sidestepping every svh/address-bar pin bug.
- Prism Noir → RoundedBox-nested case assembly (shell, phone body, screen, island, merged lenses) instead of ExtrudeGeometry with holes; gl.compile before the crossfade; useFinePointer gating for all hover effects; typed fixtures behind the Medusa fetcher interfaces.
- SnapStack → 'Same design. Your phone.' beat as the CSS-3D FitBand above Trending: the featured design on three generic camera-cutout silhouettes, ending on the shopper's cookied model marked 'Yours'.
- Playful Wall (kept) → one InstancedMesh fed by one canvas atlas that is also exported as the WebP sprite sheet for Trending cards, so hero and cards are pixel-identical; worker painting; tiered counts; trust ticker inside the first mobile viewport.

## Appendix B — Rejected ideas

- Hover-driven shopping in the hero (Playful Wall): the audience has no hover; replaced by the always-present featured case with a DOM label, link and prev/next buttons.
- Two-tap rule on touch (tap to lift, tap again to navigate): undiscoverable; a single tap features a case, the featured case and its label navigate.
- 160vh hero pin with the picker rising into the parted wall (Playful Wall) and the 100%/60% pinned hero (Turntable): pinning delays the picker and is the main iOS/Android jank source; the hero is a plain 100svh block.
- 48 instanced cases: multiplies placeholder-art risk and crowds the copy; 24/16/10 with projection-checked exclusion zones.
- Field-wide fresnel holo shader and SDF lenses inside onBeforeCompile: shrunk to a two-chunk atlas lookup; iridescence moved to the featured case where three provides it natively.
- WebGLRenderTarget shader DesignBaker with six GLSL designs and a dissolve (Turntable): weeks of Mali debugging for six designs; 2D canvas painters instead.
- ExtrudeGeometry case rim and plate with camera cutout plus custom UV remap (Turntable, SnapStack): seam and normal risk, not needed for the look; RoundedBox nesting instead.
- MeshReflectorMaterial floor, DepthOfField and Bloom postprocessing chunk (Turntable): ~80 kB and two extra scene renders for a subtle gain on a 4G audience.
- 350–400vh pinned scroll story with snap/peel/reassemble beats, three phone specs, transmission glass and a FLIP handoff (SnapStack): a lecture between a Reels visitor and the Trending row, and the least feasible build.
- Brand-shaped phone silhouettes (iPhone-like, Galaxy-like): trade-dress exposure; all phones are generic slabs with abstract camera layouts and no logos.
- Instrument Serif / champagne / dust-particle luxe voice and a dark-only theme (Prism Noir): wrong brand for ₹299–599 trending covers; dark stage + warm paper store with Bricolage Grotesque instead.
- SplitText line-mask headline entrance (Prism Noir): delays readable copy on 4G and needs re-splitting on font swap; the h1 is static server text.
- Whole-canvas drag-to-spin with axis lock inside a pinned section (Turntable): the interaction most likely to feel broken on touch; touch drag only pans the camera.
- Reading the my_phone cookie in the server component: would make the homepage dynamic and uncacheable at Cloudflare; personalisation is client-side text in reserved slots.
- Sparkles, detect-gpu, HDR presets, GLB models, drei Html for the label: extra bytes, network fetches or portal complexity with no conversion value.

## Appendix C — Judge ranking

- Playful Wall: 113
- Turntable — a studio showpiece hero for the phone-case store: 111
- Prism Noir: 102
- SnapStack — the scroll-driven case story: 88
