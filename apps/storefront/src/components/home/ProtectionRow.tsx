import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { AccessoryCard } from '@/components/accessory/AccessoryCard';
import { Reveal } from '@/components/motion/Reveal.client';
import type { HomeProduct } from '@/lib/medusa/fixtures';

const SHORTCUTS = [
  { id: 'screen-guard', label: 'Screen guards' },
  { id: 'back-film', label: 'Back films' },
] as const;

/** Home row for screen guards and films. */
export function ProtectionRow({ products }: { products: HomeProduct[] }) {
  if (products.length === 0) return null;
  const shown = [...products].sort((a, b) => Number(Boolean(b.accessory?.photos)) - Number(Boolean(a.accessory?.photos))).slice(0, 5);
  return (
    <section id="protection" aria-labelledby="protection-heading" className="cv-auto scroll-mt-20 bg-paper py-14 text-fg lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-label font-bold tracking-[0.16em] text-brand uppercase">Protection</p>
            <h2 id="protection-heading" className="mt-2 font-display text-h2 font-extrabold text-balance">
              Screen guards and films that fit
            </h2>
            <p className="mt-2 text-body text-fg-muted">FLAYR glass for iPhone, G-TEL glass for Galaxy S and hydrogel back films. ₹50 off each with any cover.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {SHORTCUTS.map((s) => (
              <Link
                key={s.id}
                href={`/accessories#${s.id}`}
                className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-semibold text-fg transition-colors hover:border-fg"
              >
                {s.label}
              </Link>
            ))}
            <Link href="/accessories" className="inline-flex h-10 items-center gap-1 px-2 text-sm font-semibold text-brand underline-offset-4 hover:underline">
              Shop all <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
        <ul
          aria-label="Screen guards and films"
          className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5 [&::-webkit-scrollbar]:hidden"
        >
          {shown.map((p) => (
            <li key={p.id} className="w-[44%] shrink-0 snap-start sm:w-auto">
              <AccessoryCard product={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
