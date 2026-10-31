import { NetworkPattern } from '@/components/brand/NetworkPattern';
import type { PhotoEntry } from '@/lib/catalog/photos';
import type { PhoneModel } from '@/lib/medusa/fixtures';
import { HeroChips } from './HeroChips.client';
import { HeroCopy, HeroTrustLine } from './HeroCopy';
import { HeroDots } from './HeroDots.client';
import { HeroHitLayer } from './HeroHitLayer.client';
import { HeroLabel } from './HeroLabel.client';
import { HeroSlot } from './HeroSlot.client';
import { HeroStage } from './HeroStage.client';
import { HeroWord } from './HeroWord.client';
import { HERO_COUNT_LG } from './heroConfig';

interface Props {
  cast: PhotoEntry[];
  models: PhoneModel[];
  chipModels: PhoneModel[];
}

// Geometry lives on #hero as custom properties; the slots, the floor and the hit layer read the same source.
// The whole case stands on an invisible floor at --floor-y: nothing is tucked or cut, so a completed
// silhouette (`cut: 'full'`) reads as a real object with its reflection and contact shadow under it.
// The backstage blur sits on the image leaf: a filter on the slot would flatten its 3D children.
const HERO_CSS = `
#hero{--floor-y:60svh;--case-h:42svh;--case-cx:50%;--back-x:72%;--reflect-o:0.14;--reflect-fade:30%}
@media (min-width:64rem){#hero{--floor-y:clamp(500px,78svh,672px);--case-h:clamp(420px,66svh,600px);--case-cx:calc(50% + 26%);--back-x:64%;--reflect-o:0.22;--reflect-fade:42%}}
.hero-backdrop{position:absolute;inset:0;z-index:0;background:var(--gradient-glow,radial-gradient(120% 90% at 30% 25%,color-mix(in srgb,var(--color-accent-2) 30%,var(--color-ink-2)) 0%,var(--color-ink-2) 55%,var(--color-ink) 100%))}
.hero-backdrop::before{content:"";position:absolute;inset:0;background-image:var(--grain);background-size:160px 160px;mix-blend-mode:overlay;opacity:.06}
.hero-backdrop::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,color-mix(in srgb,var(--color-ink) 60%,transparent),transparent 14%)}
.hero-floor{position:absolute;z-index:0;left:var(--case-cx);top:var(--floor-y);width:calc(var(--case-h) * 1.9);height:calc(var(--case-h) * 0.22);transform:translate(-50%,-50%);pointer-events:none;background:radial-gradient(50% 50% at 50% 50%,color-mix(in srgb,var(--color-accent-2) 26%,transparent),transparent 70%);opacity:var(--halo-o,1)}
.hero-floor::after{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:linear-gradient(to right,transparent,color-mix(in srgb,var(--color-fg-on-ink-muted) 28%,transparent) 30%,color-mix(in srgb,var(--color-fg-on-ink-muted) 28%,transparent) 70%,transparent)}
.hero-word{position:absolute;z-index:0;display:none;left:var(--case-cx);top:calc(var(--floor-y) - var(--case-h) * 0.5);transform:translate(-50%,-50%) translateX(calc(var(--halo-x,0%) * -3));pointer-events:none;white-space:nowrap;font-family:var(--font-sans);font-weight:800;font-size:clamp(5rem,15vw,13rem);line-height:1;letter-spacing:-0.04em;color:transparent;-webkit-text-stroke:1px color-mix(in srgb,var(--color-fg-on-ink-muted) 20%,transparent);user-select:none;opacity:var(--scene-opacity,1);transition:transform 120ms linear}
@media (min-width:64rem){.hero-word{display:block}}
.hero-scene{position:absolute;inset:0;z-index:1;perspective:1200px;perspective-origin:50% 40%;pointer-events:none;opacity:var(--scene-opacity,1);transform:scale(var(--scroll-s,1));transform-origin:var(--case-cx) var(--floor-y)}
.hero-sway{position:absolute;inset:0;transform-style:preserve-3d}
.hero-sway.is-idle{animation:hero-sway 7s var(--ease-in-out-quart) infinite alternate}
@keyframes hero-sway{from{transform:rotateY(-4deg)}to{transform:rotateY(4deg)}}
.hero-rig{position:absolute;inset:0;transform-style:preserve-3d;will-change:transform;transform:translate3d(0,var(--scroll-y,0px),0) rotateX(var(--px,0deg)) rotateY(calc(var(--py,0deg) + var(--scroll-ry,0deg)))}
.hero-case{position:absolute;top:calc(var(--floor-y) - var(--case-h));left:var(--case-cx);height:var(--case-h);width:auto;aspect-ratio:var(--ar,0.5);transform-origin:50% 100%;transform-style:preserve-3d;will-change:transform;transform:translate3d(calc(-50% + var(--cx,0%)),var(--cy,0px),var(--cz,0px)) rotateY(var(--cry,0deg)) scale(var(--cs,1));opacity:var(--co,1)}
.hero-case[data-role=front]{--cx:0%;--cz:0px;--cs:1;--co:1;--cry:0deg;--cb:0px}
.hero-case[data-role=backstage]{--cx:var(--back-x);--cy:var(--scroll-y2,0px);--cz:-220px;--cs:0.78;--co:0.55;--cry:0deg;--cb:0px}
.hero-case[data-role=incoming]{--cx:var(--back-x);--cz:-220px;--cs:0.78;--co:0;--cry:0deg;--cb:0px}
@media (min-width:64rem){#hero[data-tier=full] .hero-case[data-role=backstage]{--cb:2px}
#hero[data-tier=full] .hero-case[data-role=backstage] .cutout,#hero[data-tier=full] .hero-case[style*="--cb"] .cutout{filter:blur(var(--cb,0px))}}
#hero.is-static .hero-case{transition:opacity 200ms linear,transform 200ms var(--ease-out-expo)}
.hero-case-lift{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform 300ms var(--ease-out-expo)}
.hero-case-lift.is-lifted{transform:translateZ(30px)}
.hero-case-lift > .cutout{position:relative;z-index:1}
.hero-case-lift > .hero-light{z-index:2}
@media (min-width:64rem){#hero[data-tier=full] .hero-case[data-role=front] .hero-case-lift > .cutout{filter:drop-shadow(0 24px 32px color-mix(in srgb,var(--color-ink) 55%,transparent))}}
.hero-contact{position:absolute;z-index:0;left:4%;right:4%;top:calc(100% - 7px);height:16px;pointer-events:none;background:radial-gradient(50% 50% at 50% 50%,color-mix(in srgb,var(--color-ink) 78%,transparent),transparent 72%)}
.hero-reflect{position:absolute;z-index:0;left:0;top:calc(100% + 2px);width:100%;height:100%;display:block;object-fit:contain;object-position:50% 100%;transform:scaleY(-1);opacity:var(--reflect-o);pointer-events:none;-webkit-mask-image:linear-gradient(to top,black 0%,transparent var(--reflect-fade));mask-image:linear-gradient(to top,black 0%,transparent var(--reflect-fade))}
.hero-case[data-role=incoming] .hero-reflect{opacity:0}
.hero-frame{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:50% 100%;opacity:0;pointer-events:none}
.hero-frame[data-active]{opacity:1}
.hero-case-lift[data-scrub] > .cutout{opacity:0}
.hero-halo{position:absolute;left:var(--case-cx);top:calc(var(--floor-y) - var(--case-h) * 0.55);width:calc(var(--case-h) * 1.15);aspect-ratio:1;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--color-accent-2) 30%,transparent),transparent);transform:translate3d(calc(-50% + var(--halo-x,0%) + var(--halo-bx,0%)),-50%,-80px);opacity:var(--halo-o,1)}
.hero-hit{position:absolute;top:calc(var(--floor-y) - var(--case-h));left:var(--case-cx);height:var(--case-h);width:auto;aspect-ratio:var(--ar,0.5);border-radius:12px;touch-action:pan-y;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;cursor:pointer}
.hero-hit-front{transform:translateX(-50%);z-index:2}
.hero-hit-back{transform:translate3d(calc(-50% + var(--back-x)),var(--scroll-y2,0px),0) scale(0.78);transform-origin:50% 100%;z-index:1}
.hero-picker.is-pulsed{animation:hero-pulse 400ms var(--ease-out-expo)}
@keyframes hero-pulse{50%{transform:scale(1.02);box-shadow:0 0 0 2px var(--color-accent-2)}}
.hero-cue{position:absolute;z-index:4;left:50%;bottom:calc(0.75rem + env(safe-area-inset-bottom));transform:translateX(-50%);display:none;flex-direction:column;align-items:center;gap:6px;pointer-events:none;opacity:var(--scene-opacity,1)}
@media (min-width:64rem){.hero-cue{display:flex}}
.hero-cue span{display:block;width:1px;height:40px;background:linear-gradient(to bottom,color-mix(in srgb,var(--color-fg-on-ink-muted) 45%,transparent),transparent);overflow:hidden;position:relative}
.hero-cue span::after{content:"";position:absolute;left:0;top:-40px;width:1px;height:40px;background:var(--color-accent);animation:hero-cue 2.2s var(--ease-in-out-quart) infinite}
@keyframes hero-cue{to{transform:translateY(80px)}}
@media (prefers-reduced-motion:reduce){
.hero-sway.is-idle{animation:none}
.hero-case-lift{transition:none}
.hero-word{transition:none}
.hero-cue span::after{animation:none}
#hero .hero-case{transition:opacity 200ms linear !important}
@supports (animation-timeline: view()){#hero:not([data-tier=static]) .hero-scene{animation:hero-scene-fade linear both;animation-timeline:view();animation-range:exit 60% exit 95%}}
}
@keyframes hero-scene-fade{to{opacity:0}}
`;

/**
 * Server shell of the hero: backdrop → floor glow + watermark → scene (three slots on the rig, each
 * with its reflection and contact shadow) → chips → hit layer → slab row (lg: label over the trust
 * line at the container's left, dots at its right), copy. `HeroStage` is the one client controller
 * and renders nothing.
 */
export function Hero({ cast, models, chipModels }: Props) {
  const front = cast[0];
  if (!front) return null;
  const backstage = cast[1] ?? front;
  const incoming = cast[2] ?? backstage;
  const castIds = cast.slice(0, HERO_COUNT_LG).map((e) => e.id);
  const chipSlugs = chipModels.map((m) => m.slug);

  return (
    <section
      id="hero"
      role="region"
      aria-label="Featured covers"
      tabIndex={0}
      data-front-cut={front.cut}
      className="relative isolate min-h-[max(100svh,640px)] overflow-hidden bg-ink-2 text-fg-on-ink outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-2 lg:h-[clamp(680px,100svh,900px)] lg:min-h-0"
    >
      <style href="hero-scene" precedence="default">
        {HERO_CSS}
      </style>

      <div className="hero-backdrop" aria-hidden="true" />
      <div className="pointer-events-none absolute top-20 right-6 z-0 hidden h-[220px] w-[320px] lg:block" aria-hidden="true">
        <NetworkPattern corner="tr" opacity={0.3} className="h-full w-full" />
      </div>
      <HeroWord />
      <div className="hero-floor" aria-hidden="true" />

      <div className="hero-scene" aria-hidden="true">
        <div className="hero-sway">
          <div className="hero-rig">
            <div className="hero-halo" />
            <HeroSlot entry={front} role="front" slot="a" />
            <HeroSlot entry={backstage} role={cast.length > 1 ? 'backstage' : 'incoming'} slot="b" />
            <HeroSlot entry={incoming} role="incoming" slot="c" />
          </div>
        </div>
      </div>

      <HeroChips models={chipModels} className="top-[calc(4rem+0.5rem)]" />
      <HeroHitLayer />

      <div className="pointer-events-none absolute inset-x-0 top-[calc(var(--floor-y)+2rem)] z-[4] hidden lg:block">
        <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-6 px-8">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <HeroLabel className="min-w-0 max-w-[26rem]" />
            <HeroTrustLine className="text-caption text-fg-on-ink-muted" />
          </div>
          <HeroDots castIds={castIds} className="pointer-events-auto shrink-0" />
        </div>
      </div>

      <div className="hero-cue" aria-hidden="true">
        <span />
      </div>

      <HeroCopy models={models} />

      <HeroStage castIds={castIds} chipSlugs={chipSlugs} />
    </section>
  );
}
