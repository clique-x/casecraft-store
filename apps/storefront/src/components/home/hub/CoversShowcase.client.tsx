'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';
import type { ComboCover } from '@/components/home/HomeCombos.client';
import { phoneHref } from '@/components/phone-picker/BrandOutline';
import { backdropThumbSrc, backdropThumbSrcSet, formatInr, getPhoto } from '@/lib/catalog/photos';
import { pickerSheet } from '@/lib/phone/picker-sheet-store';
import { useMyPhone } from '@/lib/phone/use-my-phone';
import { EYEBROW, SHELL } from './hub-styles';

interface Props {
  /** Every photographed cover, best first, with one variant per phone it fits. */
  covers: ComboCover[];
}

/** Before a phone is picked, the row shows this many of the best covers; the rest are a tap away. */
const WITHOUT_PHONE = 10;
/** Cards are this wide, as a share of the row, so the next one always peeks in on phones. */
const CARD = 'w-[42%] shrink-0 snap-start min-[480px]:w-[31%] sm:w-[23.5%] lg:w-[calc((100%-5rem)/6)]';
const ARROW =
  'hidden size-10 place-items-center rounded-full border border-border bg-paper text-fg outline-none transition-[opacity,border-color] hover:border-fg focus-visible:outline-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-35 lg:grid';

/**
 * "Covers made for your exact phone": the covers themselves, in one row to swipe. With a phone picked it is
 * every design in stock for that phone, at that phone's price; before that, the best of the range, each named
 * with the phone it is for. The phone chip opens the picker, and the last tile leads to the full list.
 *
 * It is a plain scrolling list: the browser's own snap scrolling, images that load as they come near, and no
 * animation library. The two arrows (large screens) scroll it by a view.
 */
export function CoversShowcase({ covers }: Props) {
  const { phone } = useMyPhone();
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const slug = phone?.slug ?? null;
  const fits = slug ? covers.filter((c) => c.variants.some((v) => v.modelSlug === slug && v.stock > 0)) : [];
  // A phone with no cover in stock falls back to the range, and says so.
  const mine = fits.length > 0;
  const shown = mine ? fits : covers.slice(0, WITHOUT_PHONE);
  const allHref = phone && mine ? phoneHref(phone) : '/covers';

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const start = el.scrollLeft <= 4;
    const end = el.scrollLeft >= max - 4;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      ro.disconnect();
    };
  }, [measure, slug, shown.length]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: smooth ? 'smooth' : 'auto' });
  };

  if (covers.length === 0) return null;
  return (
    <section id="phone-picker" aria-labelledby="covers-heading" className="scroll-mt-20 bg-ink-2 py-10 text-fg lg:py-16">
      <div className={SHELL}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="min-w-0">
            <p className={EYEBROW}>Phone covers</p>
            <h2 id="covers-heading" className="mt-2 font-display text-h2 font-extrabold text-balance">
              Covers made for your exact phone
            </h2>
            <p className="mt-2 text-body text-fg-muted" aria-live="polite">
              {phone && mine
                ? `${fits.length} ${fits.length === 1 ? 'design' : 'designs'} in stock for the ${phone.model}.`
                : phone
                  ? `No covers for the ${phone.model} in stock right now. Here is the rest of the range.`
                  : `${covers.length} covers. Pick your phone, see only what fits.`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => pickerSheet.open()}
              className="inline-flex h-11 min-w-0 items-center gap-2 rounded-full bg-fg px-4 text-sm font-semibold text-paper outline-none transition-colors hover:bg-[#2b2b2b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Smartphone className="size-4 shrink-0" aria-hidden="true" />
              {phone ? (
                <>
                  <span className="truncate">{phone.model}</span>
                  <span className="text-paper/60">· Change</span>
                </>
              ) : (
                'Pick your phone'
              )}
            </button>
            <button type="button" aria-label="Previous covers" onClick={() => page(-1)} disabled={edges.start} className={ARROW}>
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button type="button" aria-label="More covers" onClick={() => page(1)} disabled={edges.end} className={ARROW}>
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Keyed by phone: a new phone starts the row from its first cover, with a short fade. */}
        <ul
          key={mine ? slug : 'range'}
          ref={track}
          aria-label={phone && mine ? `Covers for the ${phone.model}` : 'Phone covers'}
          className="-mx-4 mt-6 flex animate-in snap-x gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-px-4 px-4 pb-1 duration-500 fade-in-0 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:gap-4 lg:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {shown.map((c) => {
            const photo = getPhoto(c.photoId);
            if (!photo) return null;
            const variant = slug && mine ? c.variants.find((v) => v.modelSlug === slug && v.stock > 0) : null;
            const fromInr = Math.min(...c.variants.map((v) => v.priceInr));
            return (
              <li key={c.id} className={CARD}>
                <Link href={`/products/${c.handle}`} className="group/cover block rounded-2xl outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                  <span className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-gh-teal">
                    {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static variants, no optimizer */}
                    <img
                      src={backdropThumbSrc(photo, 480)}
                      srcSet={backdropThumbSrcSet(photo)}
                      sizes="(min-width: 1024px) 192px, (min-width: 640px) 24vw, 42vw"
                      width={480}
                      height={600}
                      alt={`${c.title} cover for ${photo.modelLabel}`}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="size-full object-cover transition-transform duration-500 ease-out-expo group-hover/cover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover/cover:transform-none"
                    />
                    {/* Before a phone is picked, each cover says which phone it is for. */}
                    {!variant && (
                      <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-black/55 px-2 py-0.5 text-[0.6875rem] leading-tight font-semibold text-white backdrop-blur-sm">
                        {photo.modelLabel}
                      </span>
                    )}
                  </span>
                  <span className="mt-2 block truncate text-sm leading-tight font-semibold text-fg">{c.title}</span>
                  <span className="mt-0.5 block truncate text-caption text-fg-muted tabular-nums">
                    {variant ? formatInr(variant.priceInr) : `from ${formatInr(fromInr)}`}
                  </span>
                </Link>
              </li>
            );
          })}
          <li className={CARD}>
            <Link
              href={allHref}
              className="group/all flex aspect-[4/5] flex-col justify-between rounded-2xl border border-border bg-paper p-3.5 outline-none transition-colors hover:border-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:p-4"
            >
              <span className="grid size-9 place-items-center rounded-full bg-fg text-paper transition-transform duration-300 ease-out-expo group-hover/all:translate-x-1">
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
              <span className="text-sm leading-snug font-bold text-balance text-fg">{phone && mine ? `All covers for the ${phone.model}` : `All ${covers.length} covers`}</span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}

export default CoversShowcase;
