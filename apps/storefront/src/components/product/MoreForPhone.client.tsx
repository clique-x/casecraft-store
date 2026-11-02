'use client';

import Link from 'next/link';
import { ScrollRail } from '@/components/listing/ScrollRail.client';
import { ArrowRightIcon } from 'lucide-react';
import { AccentBar } from '@/components/brand/AccentBar';
import { phoneHref } from '@/components/phone-picker/BrandOutline';
import { ProductCard } from '@/components/product/ProductCard';
import type { HomeProduct, PhoneModel } from '@/lib/medusa/fixtures';
import { useVariantSelection } from '@/lib/product/variant-store';

const MAX_ITEMS = 8;

interface MoreForPhoneProps {
  /** Every other product; narrowed here so the page stays static. */
  candidates: HomeProduct[];
  models: PhoneModel[];
}

/** "More for {model}" rail driven by the variant store; renders nothing until a model is chosen. */
export function MoreForPhone({ candidates, models }: MoreForPhoneProps) {
  const { modelSlug } = useVariantSelection();
  const model = modelSlug ? (models.find((m) => m.slug === modelSlug) ?? null) : null;
  if (!model) return null;

  const items = candidates.filter((p) => p.fitsModels.includes(model.slug)).slice(0, MAX_ITEMS);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="more-for-phone-heading" className="bg-surface-2 py-14 text-fg lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="more-for-phone-heading" className="font-display text-h2 text-balance">
              More for {model.model}
            </h2>
            <AccentBar className="mt-4" />
          </div>
          <Link
            href={phoneHref(model)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-pill px-2 text-sm font-medium text-fg underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-accent-2"
          >
            View all
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <ScrollRail label={`More covers for ${model.model}`}>
          {items.map((product) => (
            <li key={product.id} className="w-[41%] shrink-0 snap-start sm:w-[31%] lg:w-[calc((100%-4*1.25rem)/5)]">
              <ProductCard product={product} rank={product.trendingRank} modelCount={models.length} />
            </li>
          ))}
        </ScrollRail>
      </div>
    </section>
  );
}

export default MoreForPhone;
