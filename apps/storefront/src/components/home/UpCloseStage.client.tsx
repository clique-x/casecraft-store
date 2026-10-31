'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { ArrowRightIcon } from 'lucide-react'
import { m, useMotionValue, useSpring } from 'motion/react'
import { NodeLine, type NodeLineHandle } from '@/components/brand/NodeLine.client'
import { CaseCutout } from '@/components/home/hero/CaseCutout'
import { CaseSheen } from '@/components/home/hero/CaseSheen.client'
import { PRIMARY_CTA } from '@/components/home/StickyPhoneCta.client'
import { TiltCard } from '@/components/motion/TiltCard.client'
import { PRODUCT_CTA_LABEL } from '@/lib/brand'
import { featuresFor, formatInr, type PhotoEntry } from '@/lib/catalog/photos'
import { useFinePointer } from '@/lib/device/use-fine-pointer'
import { useMediaQuery } from '@/lib/device/use-media-query'
import { useReducedMotion } from '@/lib/device/use-reduced-motion'
import { featuredStore, itemAt } from '@/lib/hero-state'
import { SPRING_TILT } from '@/lib/motion/tokens'
import { getCachedSceneTier, subscribeSceneTier, type SceneTier } from '@/lib/perf/device-tier'
import { cn } from '@/lib/utils'

const DEFAULT_ANCHOR: [number, number] = [0.32, 0.22]
const UPCLOSE_SIZES = '(min-width: 64rem) 480px, 70vw'
const TOUCH_TILT_DEG = 10
const TOUCH_TILT_PX = 90
const AXIS_LOCK = 1.2
const SLOP = 8
const CROSSFADE_MS = 300

type Pt = [number, number]

interface Geometry {
  points: Pt[]
  width: number
  height: number
}

interface MeasuredNodeLineProps {
  /** `data-node-stop` names inside the host's parent; the first visible match of each is used. */
  stops: [string, string]
  /** `callout` lands on `anchor` inside the second stop; `rail` joins two cards across their tops or down their left. */
  route: 'callout' | 'rail'
  anchor?: [number, number]
  /** Rail distance from the cards, px. */
  gap?: number
  draw?: 'scroll' | 'tap' | 'static'
  /** `draw="tap"` only: draw as soon as the line is measured (the tap happened on a control elsewhere). */
  drawOnMount?: boolean
  /** Re-measure when this changes (a new photo, a new tap). */
  measureKey?: string | number
  className?: string
}

function visibleStop(root: HTMLElement, name: string): { el: HTMLElement; rect: DOMRect } | null {
  for (const el of root.querySelectorAll<HTMLElement>(`[data-node-stop="${name}"]`)) {
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return { el, rect }
  }
  return null
}

function routePoints(
  route: MeasuredNodeLineProps['route'],
  a: DOMRect,
  b: DOMRect,
  host: DOMRect,
  anchor: [number, number],
  gap: number,
): Pt[] {
  const rel = (x: number, y: number): Pt => [Math.round(x - host.left), Math.round(y - host.top)]
  if (route === 'callout') {
    const ax = b.left + b.width * anchor[0]
    const ay = b.top + b.height * anchor[1]
    if (a.left >= b.right) {
      const sy = a.top + a.height / 2
      return [rel(a.left - 6, sy), rel(ax, sy), rel(ax, ay)]
    }
    const sx = a.left + a.width / 2
    const sy = a.top - 4
    const midY = b.bottom + (sy - b.bottom) / 2
    return [rel(sx, sy), rel(sx, midY), rel(ax, midY), rel(ax, ay)]
  }
  if (b.left >= a.right) {
    const y = Math.min(a.top, b.top) - gap
    const ax = a.left + a.width / 2
    const bx = b.left + b.width / 2
    return [rel(ax, a.top - 4), rel(ax, y), rel(bx, y), rel(bx, b.top - 4)]
  }
  const x = Math.min(a.left, b.left) - gap
  const ay = a.top + a.height / 2
  const by = b.top + b.height / 2
  return [rel(a.left - 4, ay), rel(x, ay), rel(x, by), rel(b.left - 4, by)]
}

function sameGeometry(p: Geometry | null, q: Geometry): boolean {
  if (!p || p.width !== q.width || p.height !== q.height || p.points.length !== q.points.length) return false
  return p.points.every(([x, y], i) => q.points[i]?.[0] === x && q.points[i]?.[1] === y)
}

/**
 * One `NodeLine` in pixel space, measured from two `data-node-stop` elements inside the parent
 * (which must be `relative`). Renders nothing until measured, so SSR and hydration stay identical.
 */
export function MeasuredNodeLine({
  stops,
  route,
  anchor = DEFAULT_ANCHOR,
  gap = 24,
  draw = 'scroll',
  drawOnMount = false,
  measureKey,
  className,
}: MeasuredNodeLineProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<NodeLineHandle>(null)
  const [geometry, setGeometry] = useState<Geometry | null>(null)
  const reduced = useReducedMotion()
  const [fromName, toName] = stops
  const [anchorX, anchorY] = anchor

  useEffect(() => {
    const host = hostRef.current
    const root = host?.parentElement
    if (!host || !root) return

    const measure = () => {
      const a = visibleStop(root, fromName)
      const b = visibleStop(root, toName)
      const hostRect = host.getBoundingClientRect()
      if (!a || !b || hostRect.width === 0) {
        setGeometry(null)
        return
      }
      const next: Geometry = {
        points: routePoints(route, a.rect, b.rect, hostRect, [anchorX, anchorY], gap),
        width: Math.round(hostRect.width),
        height: Math.round(hostRect.height),
      }
      setGeometry((prev) => (sameGeometry(prev, next) ? prev : next))
    }

    const ro = new ResizeObserver(measure)
    ro.observe(root)
    for (const name of [fromName, toName]) {
      for (const el of root.querySelectorAll<HTMLElement>(`[data-node-stop="${name}"]`)) ro.observe(el)
    }
    measure()
    return () => ro.disconnect()
  }, [fromName, toName, route, anchorX, anchorY, gap, measureKey])

  // A new key remounts the line undrawn; draw it again once it has its geometry.
  useEffect(() => {
    if (draw === 'tap' && drawOnMount && geometry) lineRef.current?.draw()
  }, [draw, drawOnMount, geometry, measureKey])

  return (
    <div ref={hostRef} aria-hidden="true" className={cn('pointer-events-none absolute inset-0 z-10', className)}>
      {geometry && (
        <NodeLine
          key={`${geometry.width}x${geometry.height}:${String(measureKey)}`}
          ref={lineRef}
          points={geometry.points}
          width={geometry.width}
          height={geometry.height}
          draw={reduced ? 'static' : draw}
          className="absolute inset-0 h-full w-full"
        />
      )}
    </div>
  )
}

function getServerTier(): SceneTier | null {
  return null
}

function useSceneTier(): SceneTier | null {
  return useSyncExternalStore(subscribeSceneTier, getCachedSceneTier, getServerTier)
}

/** Follows the hero's featured cover; starts from the server-rendered item so hydration matches. */
function useFeaturedEntry(initial: PhotoEntry): PhotoEntry {
  const [entry, setEntry] = useState(initial)
  useEffect(() => {
    const sync = () => setEntry(itemAt(featuredStore.index()))
    sync()
    return featuredStore.subscribe(sync)
  }, [])
  return entry
}

interface Layers {
  prev: PhotoEntry | null
  cur: PhotoEntry
}

function useCrossfade(entry: PhotoEntry): Layers {
  const [layers, setLayers] = useState<Layers>({ prev: null, cur: entry })
  if (layers.cur.id !== entry.id) setLayers({ prev: layers.cur, cur: entry })
  // The previous cover fades out under the new one, then unmounts; a new beat restarts the timer.
  const curId = layers.cur.id
  useEffect(() => {
    const t = window.setTimeout(() => setLayers((l) => (l.prev ? { ...l, prev: null } : l)), CROSSFADE_MS)
    return () => window.clearTimeout(t)
  }, [curId])
  return layers
}

interface TouchGesture {
  id: number
  x: number
  y: number
  mode: 'idle' | 'tilt' | 'scroll'
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

/** Press-and-drag tilt on touch; the axis lock hands vertical drags back to the page. */
function useTouchTilt(active: boolean) {
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const rotateX = useSpring(rx, SPRING_TILT)
  const rotateY = useSpring(ry, SPRING_TILT)
  const gesture = useRef<TouchGesture | null>(null)

  const reset = useCallback(() => {
    gesture.current = null
    rx.set(0)
    ry.set(0)
  }, [rx, ry])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!active || e.pointerType === 'mouse') return
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, mode: 'idle' }
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || g.id !== e.pointerId) return
    const dx = e.clientX - g.x
    const dy = e.clientY - g.y
    if (g.mode === 'idle') {
      if (Math.hypot(dx, dy) < SLOP) return
      if (Math.abs(dx) > Math.abs(dy) * AXIS_LOCK) {
        g.mode = 'tilt'
        e.currentTarget.setPointerCapture(e.pointerId)
      } else {
        g.mode = 'scroll'
        return
      }
    }
    if (g.mode !== 'tilt') return
    ry.set(clamp(dx / TOUCH_TILT_PX, -1, 1) * TOUCH_TILT_DEG)
    rx.set(clamp(-dy / TOUCH_TILT_PX, -1, 1) * TOUCH_TILT_DEG * 0.6)
  }

  return { rotateX, rotateY, onPointerDown, onPointerMove, onPointerUp: reset, onPointerCancel: reset }
}

interface UpCloseStageProps {
  initial: PhotoEntry
  /** Server-rendered eyebrow, h2 and sub; placed in the text column. */
  header: ReactNode
}

export function UpCloseStage({ initial, header }: UpCloseStageProps) {
  const entry = useFeaturedEntry(initial)
  const { prev, cur } = useCrossfade(entry)
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const desktop = useMediaQuery('(min-width: 64rem)')
  const tier = useSceneTier()
  const features = featuresFor(entry)

  const rootRef = useRef<HTMLDivElement>(null)
  const scaleRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [sheenOn, setSheenOn] = useState(false)
  const [tapKey, setTapKey] = useState(0)
  const touch = useTouchTilt(!fine && !reduced)

  const setCurBox = useCallback((el: HTMLDivElement | null) => {
    imgRef.current = el?.querySelector('img') ?? null
  }, [])

  // GSAP arrives after hydration (same lazy path as NodeLine) so `/` never ships it in the first load.
  useEffect(() => {
    let cancelled = false
    let media: { revert(): void } | null = null
    void Promise.all([import('@/components/motion/GsapProvider'), import('gsap')]).then(
      ([{ registerGsap }, { default: gsap }]) => {
        if (cancelled) return
        registerGsap()
        const mm = gsap.matchMedia()
        media = mm
        mm.add('(prefers-reduced-motion: no-preference) and (min-width: 64rem)', () => {
          if (!scaleRef.current) return
          gsap.fromTo(
            scaleRef.current,
            { scale: 0.96 },
            {
              scale: 1,
              ease: 'none',
              scrollTrigger: { trigger: rootRef.current, start: 'top 85%', end: 'center 55%', scrub: true },
            },
          )
        })
      },
    )
    return () => {
      cancelled = true
      media?.revert()
    }
  }, [])

  const lineVisible = desktop || tapKey > 0
  const sheenEnabled = sheenOn && fine && tier === 'full' && !reduced
  const href = `/products/${entry.slug}`

  return (
    <div
      ref={rootRef}
      className="relative grid gap-8 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:items-center lg:gap-x-8 lg:gap-y-6"
    >
      <div className="lg:col-span-6 lg:col-start-7 lg:self-end">{header}</div>

      <div className="mx-auto w-[70%] max-w-[520px] lg:col-span-6 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:w-full">
        <div ref={scaleRef} className="will-change-transform">
          <TiltCard maxDeg={6} pressScale={1} className="h-full">
            <m.div
              style={{ rotateX: touch.rotateX, rotateY: touch.rotateY, transformPerspective: 900 }}
              onPointerDown={touch.onPointerDown}
              onPointerMove={touch.onPointerMove}
              onPointerUp={touch.onPointerUp}
              onPointerCancel={touch.onPointerCancel}
              onPointerEnter={fine ? () => setSheenOn(true) : undefined}
              className="relative aspect-[4/5] w-full touch-pan-y overflow-hidden rounded-card bg-surface-2 select-none [transform-style:preserve-3d]"
            >
              {prev && (
                <div
                  key={`prev-${prev.id}`}
                  aria-hidden="true"
                  style={{ aspectRatio: `${prev.imageW} / ${prev.imageH}` }}
                  className={cn(
                    'absolute left-1/2 max-w-[92%] -translate-x-1/2 animate-out duration-300 fill-mode-forwards fade-out',
                    prev.cut === 'full' ? 'bottom-[14.5%] h-[76%]' : 'bottom-[8.4%] h-[80%]',
                  )}
                >
                  <CaseCutout entry={prev} role="upclose" sizes={UPCLOSE_SIZES} />
                </div>
              )}
              <div
                key={`cur-${cur.id}`}
                ref={setCurBox}
                data-node-stop="photo"
                style={{ aspectRatio: `${cur.imageW} / ${cur.imageH}` }}
                className={cn(
                  'absolute left-1/2 max-w-[92%] -translate-x-1/2 animate-in duration-300 fade-in',
                  cur.cut === 'full' ? 'bottom-[14.5%] h-[76%]' : 'bottom-[8.4%] h-[80%]',
                )}
              >
                <CaseCutout
                  entry={cur}
                  role="upclose"
                  sizes={UPCLOSE_SIZES}
                  imgProps={{ loading: 'eager', fetchPriority: 'low' }}
                />
                {cur.cut === 'full' && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1.5 left-1/2 h-3 w-[70%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(50%_50%_at_50%_50%,color-mix(in_srgb,var(--color-ink)_50%,transparent),transparent_70%)]"
                  />
                )}
                <CaseSheen key={cur.id} imgRef={imgRef} enabled={sheenEnabled} />
              </div>
              <div
                aria-hidden="true"
                className="card-ledge border-t-[color-mix(in_srgb,var(--color-accent-text)_30%,transparent)] [--ledge-top:86%]"
              />
            </m.div>
          </TiltCard>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-6 lg:col-start-7 lg:self-start">
        {/* Desktop: callout 1 is reached by the node line; 2–3 are coral-dot bullets. */}
        <ul className="hidden flex-col gap-3 lg:flex" aria-label="What to look for">
          {features.map((text, i) => (
            <li
              key={`${entry.id}-${i}`}
              data-node-stop={i === 0 ? 'callout-1' : undefined}
              className={cn(
                'flex min-h-11 items-center gap-3 text-body font-semibold text-fg',
                i === 0 ? 'pl-2' : 'before:size-2 before:shrink-0 before:rounded-full before:bg-brand-coral before:content-[""]',
              )}
            >
              {text}
            </li>
          ))}
        </ul>
        {/* Phones: three 44 px chips; the first draws its line on tap. */}
        <ul className="flex flex-wrap gap-2 lg:hidden" aria-label="What to look for">
          {features.map((text, i) =>
            i === 0 ? (
              <li key={`${entry.id}-${i}`}>
                <button
                  type="button"
                  data-node-stop="callout-1"
                  aria-pressed={tapKey > 0}
                  onClick={() => setTapKey((k) => k + 1)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-pill bg-surface-2 px-4 text-sm font-semibold text-fg transition-colors duration-(--dur-micro) outline-none aria-pressed:bg-surface-3 focus-visible:ring-3 focus-visible:ring-accent-2"
                >
                  <span
                    aria-hidden="true"
                    className={cn('size-2 rounded-full bg-accent', tapKey > 0 && 'animate-in zoom-in-50 duration-500')}
                    key={tapKey}
                  />
                  {text}
                </button>
              </li>
            ) : (
              <li
                key={`${entry.id}-${i}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-pill bg-surface-2 px-4 text-sm font-semibold text-fg before:size-2 before:rounded-full before:bg-brand-coral before:content-['']"
              >
                {text}
              </li>
            ),
          )}
        </ul>

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Link href={href} className={cn(PRIMARY_CTA, 'w-full sm:w-auto')}>
            {PRODUCT_CTA_LABEL} cover · {formatInr(entry.priceInr)}
          </Link>
          <Link
            href="/trending"
            className="inline-flex min-h-11 items-center gap-1 rounded-sm text-base font-semibold text-accent-text underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-accent-2"
          >
            See all covers
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {lineVisible && (
        <MeasuredNodeLine
          stops={['callout-1', 'photo']}
          route="callout"
          anchor={entry.featureAnchor ?? DEFAULT_ANCHOR}
          draw={desktop ? 'scroll' : 'tap'}
          drawOnMount={!desktop}
          measureKey={`${entry.id}:${tapKey}`}
        />
      )}
    </div>
  )
}
