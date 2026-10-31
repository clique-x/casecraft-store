"use client"

import { useMemo, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import type { ProcDesign } from "@/lib/designs/catalog"
import { designCss } from "@/lib/designs/design-css"
import { useAtlas, type Atlas } from "@/lib/designs/use-atlas"

interface ProcCaseThumbProps {
  design: ProcDesign
  className?: string
  label?: string
}

function spriteStyle(atlas: Atlas, id: string): CSSProperties {
  const [u, v] = atlas.tileOf(id)
  const col = Math.round(u * atlas.cols)
  const row = atlas.rows - 1 - Math.round(v * atlas.rows)
  return {
    backgroundImage: `url(${atlas.blobUrl})`,
    backgroundSize: `${atlas.cols * 100}% ${atlas.rows * 100}%`,
    backgroundPosition: `${(col / (atlas.cols - 1)) * 100}% ${(row / (atlas.rows - 1)) * 100}%`,
    backgroundRepeat: "no-repeat",
  }
}

export function ProcCaseThumb({ design, className, label }: ProcCaseThumbProps) {
  // Observe only: the product viewer owns the build so thumbnails never trigger a second atlas.
  const { atlas } = useAtlas(1024, false)
  const isQuote = design.family === "quote"

  const face = useMemo<CSSProperties>(() => {
    if (atlas && !isQuote && atlas.blobUrl) return spriteStyle(atlas, design.id)
    return { background: designCss(design) }
  }, [atlas, design, isQuote])

  const quoteStyle = useMemo<CSSProperties>(
    () => ({
      color: design.palette.ink,
      textShadow: `0.8cqw 0.8cqw 0 ${design.palette.a}`,
    }),
    [design.palette.ink, design.palette.a]
  )

  return (
    <div
      role="img"
      aria-label={label ?? design.name}
      className={cn(
        "@container relative aspect-[1/2] overflow-hidden rounded-[14%/7%] shadow-md ring-1 ring-inset ring-fg-on-ink/10",
        className
      )}
    >
      <div className="absolute inset-0" style={face} />
      {isQuote && design.quote ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-[6%] top-1/2 -translate-y-1/2 -rotate-[8deg] text-center font-display text-[15cqw] leading-[0.98] font-bold whitespace-pre-line select-none"
          style={quoteStyle}
        >
          {design.quote.split(" ").join("\n")}
        </span>
      ) : null}
      <div className="absolute top-[6%] left-[6.8%] h-[19.7%] w-[40.5%] rounded-[22%] bg-island shadow-sm">
        <span className="absolute top-[14%] left-[14%] size-[30%] rounded-full bg-lens ring-1 ring-metal/50" />
        <span className="absolute right-[14%] bottom-[14%] size-[30%] rounded-full bg-lens ring-1 ring-metal/50" />
        <span className="absolute top-[18%] right-[18%] size-[12%] rounded-full bg-metal/60" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-linear-115 from-fg-on-ink/35 to-transparent to-45%" />
    </div>
  )
}
