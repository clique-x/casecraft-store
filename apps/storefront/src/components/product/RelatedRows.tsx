import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { AccentBar } from '@/components/brand/AccentBar';
import { Reveal } from '@/components/motion/Reveal.client';
import { MoreForPhone } from '@/components/product/MoreForPhone.client';
import { ProductCard } from '@/components/product/ProductCard';
import { LOOKS } from '@/lib/catalog/looks';
import { THEMES, type HomeProduct, type PhoneModel, type ProductDetail } from '@/lib/medusa/fixtures';

interface RelatedRowsProps {
  product: ProductDetail;
  related: HomeProduct[];
  candidates: HomeProduct[];
  models: PhoneModel[];
}

/** Photo covers group by look; procedural designs by theme. */
function groupOf(product: ProductDetail): { name: string; href: string } {
  if (product.audio) return { name: 'Audio', href: '/audio' };
  if (product.accessory) return { name: 'Protection', href: '/accessories' };
  const photo = product.photo;
  const look = photo ? LOOKS.find((l) => l.handle === photo.look) : undefined;
  if (look) return { name: look.name, href: `/categories/${look.handle}` };
  const theme = THEMES.find((t) => t.handle === product.theme);
  return { name: theme?.name ?? product.theme, href: `/categories/${product.theme}` };
}

export function RelatedRows({ product, related, candidates, models }: RelatedRowsProps) {
  const group = groupOf(product);

  return (
    <>
      {related.length > 0 && (
        <section aria-labelledby="related-theme-heading" className="bg-paper py-14 text-fg lg:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="flex items-end justify-between gap-4">
              <div>
                <h2 id="related-theme-heading" className="font-display text-h2 text-balance">
                  More in {group.name}
                </h2>
                <AccentBar className="mt-4" />
              </div>
              <Link
                href={group.href}
                className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-pill px-2 text-sm font-medium text-fg underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-accent-2"
              >
                View all
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </Reveal>

            <ul
              aria-label={`More ${group.name} covers`}
              className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 max-lg:[scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:gap-5 lg:scroll-px-0 lg:px-0 lg:pb-4 lg:[scrollbar-width:thin] max-lg:[&::-webkit-scrollbar]:hidden"
            >
              {related.map((item, i) => (
                <Reveal
                  as="li"
                  key={item.id}
                  delay={i * 0.05}
                  className="w-[41%] shrink-0 snap-start sm:w-[31%] lg:w-[calc((100%-5*1.25rem)/6)]"
                >
                  <ProductCard product={item} modelCount={models.length} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      <MoreForPhone candidates={candidates} models={models} />
    </>
  );
}
