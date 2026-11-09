import Link from 'next/link';
import { DEPARTMENTS, DEPARTMENT_OF } from '@/lib/catalog/gadgets';
import { ScrollRail } from '@/components/listing/ScrollRail.client';
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
  if (product.gadget) {
    const d = DEPARTMENTS[DEPARTMENT_OF[product.gadget.type]];
    return { name: d.name, href: d.path };
  }
  if (product.accessory) return { name: 'Protection', href: '/accessories' };
  const photo = product.photo;
  const look = photo ? LOOKS.find((l) => l.handle === photo.look) : undefined;
  if (look) return { name: look.name, href: `/categories/${look.handle}` };
  const theme = THEMES.find((t) => t.handle === product.theme);
  if (theme) return { name: theme.name, href: `/categories/${theme.handle}` };
  // A look without a category page of its own (e.g. sparkle): link the covers range, never a category that 404s.
  return { name: 'Covers', href: '/covers' };
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

            <ScrollRail label={`More ${group.name} covers`}>
              {related.map((item) => (
                <li key={item.id} className="w-[41%] shrink-0 snap-start sm:w-[31%] lg:w-[calc((100%-5*1.25rem)/6)]">
                  <ProductCard product={item} modelCount={models.length} />
                </li>
              ))}
            </ScrollRail>
          </div>
        </section>
      )}

      <MoreForPhone candidates={candidates} models={models} />
    </>
  );
}
