import type { ImgHTMLAttributes } from 'react';
import { photoSrc, srcSetFor, type PhotoEntry } from '@/lib/catalog/photos';
import { cn } from '@/lib/utils';

export type CutoutRole = 'hero' | 'card' | 'upclose' | 'fan' | 'tile';

interface Props {
  entry: PhotoEntry;
  role: CutoutRole;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgProps?: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes' | 'alt' | 'width' | 'height'>;
  /** Hero incoming slot: the URLs ride on `data-src`/`data-srcset` until the controller warms them. */
  deferred?: boolean;
}

// The .cutout rules live in app/globals.css: an inline <style href="cutout"> put a "cutout" href in the page data,
// which crawlers followed to a /cutout page that does not exist.

export function cutoutAlt(entry: PhotoEntry): string {
  return `${entry.design} ${entry.brand} ${entry.series} cover for ${entry.modelLabel}`;
}

/** The one renderer for every product photo; the cut is hidden by whatever ledge the caller stands it on. */
export function CaseCutout({ entry, role, sizes, priority = false, className, imgProps, deferred = false }: Props) {
  const src = photoSrc(entry.id, 480);
  const srcSet = srcSetFor(entry);
  const source = deferred ? { 'data-src': src, 'data-srcset': srcSet } : { src, srcSet };
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- the sheen mask must reference this image's own currentSrc */}
      <img
        {...source}
        sizes={sizes}
        width={entry.imageW}
        height={entry.imageH}
        alt={cutoutAlt(entry)}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'low'}
        data-cut={entry.cut}
        data-cutout={role}
        className={cn('cutout', className)}
        {...imgProps}
      />
    </>
  );
}
