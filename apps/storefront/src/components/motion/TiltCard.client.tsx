'use client'

import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react'
import { m, useMotionValue, useMotionValueEvent, useSpring, useTransform } from 'motion/react'
import { useFinePointer } from '@/lib/device/use-fine-pointer'
import { useReducedMotion } from '@/lib/device/use-reduced-motion'
import { SPRING_TILT } from '@/lib/motion/tokens'
import { cn } from '@/lib/utils'

const SHEEN_RANGE_PCT = 18

interface TiltCardProps {
  children: ReactNode
  className?: string
  /** Max tilt in degrees on fine pointers; 0 keeps only the `--tilt-px/--tilt-py` vars. */
  maxDeg?: number
  pressScale?: number
}

/**
 * Pointer tilt for fine pointers only. Exposes the sprung pointer offset (-1..1) as
 * `--tilt-px` / `--tilt-py` on the wrapper so children can parallax against the cursor, and is
 * the single writer of `--sheen-x` (= px × 18 %) for any `CaseSheen` inside a card or UpClose.
 */
export function TiltCard({ children, className, maxDeg = 8, pressScale = 0.97 }: TiltCardProps) {
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const active = fine && !reduced
  const ref = useRef<HTMLDivElement>(null)

  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, SPRING_TILT)
  const sy = useSpring(py, SPRING_TILT)
  const rotateX = useTransform(sy, (v) => -v * maxDeg)
  const rotateY = useTransform(sx, (v) => v * maxDeg)

  useMotionValueEvent(sx, 'change', (v) => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--tilt-px', v.toFixed(4))
    el.style.setProperty('--sheen-x', `${(v * SHEEN_RANGE_PCT).toFixed(2)}%`)
  })
  useMotionValueEvent(sy, 'change', (v) => ref.current?.style.setProperty('--tilt-py', v.toFixed(4)))

  // A scroll slides the card out from under a still cursor without firing pointerleave,
  // so while tilted any scroll (page or rail, caught in capture) levels the card.
  const stopWatching = useRef<(() => void) | null>(null)
  const reset = () => {
    px.set(0)
    py.set(0)
    stopWatching.current?.()
    stopWatching.current = null
  }
  const watchScroll = () => {
    if (stopWatching.current) return
    const onScroll = () => reset()
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    stopWatching.current = () => window.removeEventListener('scroll', onScroll, { capture: true })
  }
  useEffect(() => () => stopWatching.current?.(), [])

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!active || e.pointerType === 'touch') return
    const r = e.currentTarget.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return
    watchScroll()
    px.set(((e.clientX - r.left) / r.width) * 2 - 1)
    py.set(((e.clientY - r.top) / r.height) * 2 - 1)
  }

  return (
    <m.div
      ref={ref}
      className={cn('[transform-style:preserve-3d]', className)}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      whileTap={reduced ? undefined : { scale: pressScale }}
    >
      {children}
    </m.div>
  )
}
