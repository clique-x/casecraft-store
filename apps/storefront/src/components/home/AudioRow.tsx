import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { AudioCard } from '@/components/audio/AudioCard';
import { Reveal } from '@/components/motion/Reveal.client';
import type { HomeProduct } from '@/lib/medusa/fixtures';

const SHORTCUTS = [
  { href: '/audio#earbuds', label: 'Earbuds' },
  { href: '/audio#neckband', label: 'Neckbands' },
  { href: '/audio#speaker', label: 'Speakers' },
] as const;

/** Home page row: wireless earbuds, neckbands and Bluetooth speakers. */
export function AudioRow({ products }: { products: HomeProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section id="audio" aria-labelledby="audio-heading" className="cv-auto scroll-mt-20 bg-paper py-14 text-fg lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-label font-bold tracking-[0.16em] text-brand uppercase">Wireless audio</p>
            <h2 id="audio-heading" className="mt-2 font-display text-h2 font-extrabold text-balance">
              Earbuds, neckbands and speakers
            </h2>
            <p className="mt-2 text-body text-fg-muted">Work with every phone. Same Cash on Delivery and free shipping over ₹499.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {SHORTCUTS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-semibold text-fg transition-colors hover:border-fg"
              >
                {s.label}
              </Link>
            ))}
            <Link href="/audio" className="inline-flex h-10 items-center gap-1 px-2 text-sm font-semibold text-brand underline-offset-4 hover:underline">
              Shop all <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        <ul
          aria-label="Wireless audio"
          className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden"
        >
          {products.map((p) => (
            <li key={p.id} className="w-[44%] shrink-0 snap-start sm:w-auto">
              <AudioCard product={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
