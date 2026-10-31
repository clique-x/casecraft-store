'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, m } from 'motion/react'
import { ArrowRightIcon, SearchIcon } from 'lucide-react'
import { logoIsWordmark, PhoneBrandLogo } from '@/components/brand/PhoneBrandLogo'
import { BrandOutline, phoneHref } from '@/components/phone-picker/BrandOutline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LAUNCH_BRANDS } from '@/lib/brand'
import type { PhoneModel } from '@/lib/medusa/fixtures'
import { DUR, EASE_OUT_EXPO } from '@/lib/motion/tokens'
import { useMyPhone } from '@/lib/phone/use-my-phone'
import { cn } from '@/lib/utils'

const SEARCH_THRESHOLD = 10
const EASE: [number, number, number, number] = [...EASE_OUT_EXPO]

type Variant = 'section' | 'sheet' | 'hero'

interface PhonePickerProps {
  models: PhoneModel[]
  /**
   * `section` sits on ink and collapses once a phone is known; `sheet` sits on surface and is
   * always expanded; `hero` is the inline desktop picker: ink tone, no search, no inner CTA,
   * collapses to "Your phone: {model} · Change".
   */
  variant?: Variant
  /** Called when the "Show covers" link is followed (lets the sheet close itself). */
  onNavigate?: () => void
  className?: string
}

interface BrandGroup {
  brand: string
  models: PhoneModel[]
}

function groupByBrand(models: PhoneModel[]): BrandGroup[] {
  const order = new Map<string, number>(LAUNCH_BRANDS.map((brand, i) => [brand, i]))
  const groups = new Map<string, PhoneModel[]>()
  for (const model of models) {
    const list = groups.get(model.brand) ?? []
    list.push(model)
    groups.set(model.brand, list)
  }
  return [...groups.entries()]
    .map(([brand, list]) => ({ brand, models: list }))
    .sort((a, b) => (order.get(a.brand) ?? 99) - (order.get(b.brand) ?? 99))
}

const TONE = {
  ink: {
    text: 'text-fg-on-ink',
    muted: 'text-fg-on-ink-muted',
    tab: 'text-fg-on-ink-muted hover:text-fg-on-ink data-active:text-fg-on-ink',
    chip: 'border border-border bg-paper text-fg-on-ink hover:border-fg-on-ink/40',
    chipSelected: 'bg-fg-on-ink text-ink ring-offset-ink',
    // Outline in the text colour, offset past the selection ring, so focus on the selected chip stays visible.
    chipFocus: 'focus-visible:outline-fg-on-ink',
    input:
      'border-fg-on-ink/20 text-fg-on-ink placeholder:text-fg-on-ink-muted focus-visible:border-accent-2 focus-visible:ring-accent-2/40',
  },
  paper: {
    text: 'text-fg',
    muted: 'text-fg-muted',
    tab: 'text-fg-muted hover:text-fg data-active:text-fg',
    chip: 'bg-surface-2 text-fg hover:bg-border',
    chipSelected: 'bg-fg text-paper ring-offset-surface',
    chipFocus: 'focus-visible:outline-fg',
    input: 'border-border text-fg placeholder:text-fg-muted focus-visible:border-accent-2 focus-visible:ring-accent-2/40',
  },
} as const

function focusIsLost(): boolean {
  const active = document.activeElement
  return active === null || active === document.body
}

export function PhonePicker({ models, variant = 'section', onNavigate, className }: PhonePickerProps) {
  const { phone, setPhone } = useMyPhone()
  const groups = groupByBrand(models)
  const t = TONE[variant === 'sheet' ? 'paper' : 'ink']
  const inline = variant === 'hero'

  const [editing, setEditing] = useState(false)
  const [brand, setBrand] = useState(() => phone?.brand ?? groups[0]?.brand ?? '')
  const [query, setQuery] = useState('')

  // Follow a selection made elsewhere (sheet vs section) by re-syncing the active tab.
  const [trackedSlug, setTrackedSlug] = useState<string | null>(phone?.slug ?? null)
  const currentSlug = phone?.slug ?? null
  if (currentSlug !== trackedSlug) {
    setTrackedSlug(currentSlug)
    if (phone) setBrand(phone.brand)
  }

  const collapsed = (variant === 'section' || inline) && phone !== null && !editing

  // Collapsing or expanding swaps out the focused control; these carry focus to its replacement.
  const rootRef = useRef<HTMLDivElement>(null)
  const linkRef = useRef<HTMLAnchorElement | null>(null)
  const pendingLinkSlug = useRef<string | null>(null)
  const pendingChipFocus = useRef(false)
  const changeRef = useRef<HTMLButtonElement>(null)
  const pendingChangeFocus = useRef(false)

  const focusPendingLink = useCallback(() => {
    const link = linkRef.current
    if (!link || pendingLinkSlug.current === null || link.dataset.slug !== pendingLinkSlug.current) return
    pendingLinkSlug.current = null
    if (focusIsLost()) link.focus()
  }, [])

  // The link mounts after AnimatePresence's exit, so the ref callback finishes the hand-off.
  const setLinkRef = useCallback(
    (el: HTMLAnchorElement | null) => {
      linkRef.current = el
      focusPendingLink()
    },
    [focusPendingLink],
  )

  useEffect(() => {
    if (collapsed) {
      focusPendingLink()
      if (pendingChangeFocus.current) {
        pendingChangeFocus.current = false
        if (focusIsLost()) changeRef.current?.focus()
      }
      return
    }
    if (!pendingChipFocus.current) return
    pendingChipFocus.current = false
    const chips = rootRef.current?.querySelectorAll<HTMLButtonElement>('[data-model-chip]')
    const target = [...(chips ?? [])].find((chip) => chip.getAttribute('aria-pressed') === 'true') ?? chips?.[0]
    target?.focus()
  }, [collapsed, focusPendingLink])

  const choose = (slug: string) => {
    const focusInside = rootRef.current?.contains(document.activeElement) ?? false
    pendingLinkSlug.current = variant === 'section' && focusInside ? slug : null
    pendingChangeFocus.current = inline && focusInside
    setPhone(slug)
    setEditing(false)
  }

  const startEditing = () => {
    pendingChipFocus.current = true
    setEditing(true)
  }

  return (
    <div ref={rootRef} className={cn('flex flex-col gap-6', t.text, className)}>
      {collapsed && phone ? (
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              'inline-flex min-h-11 items-center gap-2 rounded-pill px-4 text-sm font-medium ring-2 ring-accent-2 ring-offset-2',
              t.chipSelected,
            )}
          >
            <BrandOutline islandStyle={phone.islandStyle} />
            {inline ? `Your phone: ${phone.brand} ${phone.model}` : `${phone.brand} ${phone.model}`}
          </span>
          <button
            ref={changeRef}
            type="button"
            onClick={startEditing}
            className={cn(
              'min-h-11 rounded-sm px-1 text-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-accent-2',
              t.muted,
            )}
          >
            {inline ? 'Change' : 'Not your phone? Change'}
          </button>
        </div>
      ) : (
        <Tabs
          value={brand}
          onValueChange={(next) => {
            setBrand(next)
            setQuery('')
          }}
          className="gap-5"
        >
          <TabsList
            variant="line"
            aria-label="Phone brand"
            className="-mx-1 h-auto w-full flex-wrap justify-start group-data-horizontal/tabs:h-auto gap-1 px-1 pb-1.5 sm:snap-x sm:flex-nowrap sm:scroll-px-1 sm:overflow-x-auto sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden"
          >
            {groups.map((group) => (
              <TabsTrigger
                key={group.brand}
                value={group.brand}
                data-brand-tab=""
                className={cn(
                  'h-auto min-h-11 flex-none snap-start gap-2 rounded-lg px-3 text-sm font-medium after:bg-brand-coral focus-visible:border-transparent focus-visible:ring-accent-2/60 data-active:bg-transparent',
                  t.tab,
                )}
              >
                <PhoneBrandLogo brand={group.brand} />
                {logoIsWordmark(group.brand) ? <span className="sr-only">{group.brand}</span> : group.brand}
              </TabsTrigger>
            ))}
          </TabsList>

          {groups.map((group) => {
            const q = query.trim().toLowerCase()
            const visible = q
              ? group.models.filter((model) => model.model.toLowerCase().includes(q))
              : group.models
            return (
              <TabsContent key={group.brand} value={group.brand} className="flex flex-col gap-3">
                {!inline && group.models.length > SEARCH_THRESHOLD && (
                  <div className="relative max-w-xs">
                    <SearchIcon
                      className={cn('pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2', t.muted)}
                      aria-hidden="true"
                    />
                    <Input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={`Search ${group.brand} models`}
                      aria-label={`Search ${group.brand} models`}
                      className={cn('h-11 rounded-pill bg-transparent pl-9', t.input)}
                    />
                  </div>
                )}
                <div role="group" aria-label={`${group.brand} models`} className="flex flex-wrap gap-2">
                  {visible.map((model) => {
                    const selected = phone?.slug === model.slug
                    return (
                      <button
                        key={model.slug}
                        type="button"
                        data-model-chip
                        aria-pressed={selected}
                        onClick={() => choose(model.slug)}
                        className={cn(
                          'min-h-11 rounded-pill px-4 text-sm font-medium transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-4',
                          t.chipFocus,
                          selected ? cn(t.chipSelected, 'ring-2 ring-accent-2 ring-offset-2') : t.chip,
                        )}
                      >
                        {model.model}
                      </button>
                    )
                  })}
                  {visible.length === 0 && (
                    <p className={cn('min-h-11 py-2.5 text-sm', t.muted)}>No models match “{query.trim()}”.</p>
                  )}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      )}

      {inline ? null : (
        <div className="flex min-h-12 items-center">
          <AnimatePresence mode="wait" initial={false}>
            {phone ? (
              <m.div
                key={phone.slug}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, scale: [1, 1.04, 1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.ui, ease: EASE }}
                className="w-full sm:w-auto"
              >
                <Button
                  asChild
                  size="lg"
                  className="h-12 w-full rounded-pill bg-accent px-6 text-base font-semibold text-ink hover:bg-accent-hover focus-visible:ring-accent-2 sm:w-auto"
                >
                  <Link ref={setLinkRef} data-slug={phone.slug} href={phoneHref(phone)} onClick={onNavigate}>
                    Show covers for {phone.model}
                    <ArrowRightIcon aria-hidden="true" />
                  </Link>
                </Button>
              </m.div>
            ) : (
              <m.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.micro }}
                className={cn('text-sm', t.muted)}
              >
                Pick a model to see only the covers that fit it.
              </m.p>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
