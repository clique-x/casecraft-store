import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { AccentBar } from '@/components/brand/AccentBar';
import { ProductGrid } from '@/components/listing/ProductGrid';
import { Reveal } from '@/components/motion/Reveal.client';
import type { HomeProduct } from '@/lib/medusa/fixtures';
import { EYEBROW, SHELL, TEXT_LINK } from './hub-styles';

/** What is moving now across the whole hub: covers and audio side by side. */
export function TrendingHub({ products }: { products: HomeProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section id="trending" aria-labelledby="trending-heading" className="scroll-mt-20 bg-paper pb-14 text-fg lg:pb-20">
      <div className={SHELL}>
        <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={EYEBROW}>Trending now</p>
            <h2 id="trending-heading" className="mt-2 font-display text-h2 font-extrabold text-balance">
              What everyone is picking
            </h2>
            <AccentBar className="mt-4" />
          </div>
          <Link href="/trending" className={TEXT_LINK}>
            All trending covers <ArrowRightIcon aria-hidden="true" />
          </Link>
        </Reveal>
        <ProductGrid products={products} label="Trending covers and audio" className="mt-8" eager />
      </div>
    </section>
  );
}
