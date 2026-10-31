import { PhotoCard } from '@/components/product/PhotoCard';
import { ProductCard } from '@/components/product/ProductCard';
import { hasPhoto, type HomeProduct } from '@/lib/medusa/fixtures';
import { cn } from '@/lib/utils';

/** Two columns on phones, three from md, four from lg, five from xl. */
const GRID_SIZES = '(max-width: 768px) 46vw, (max-width: 1024px) 31vw, (max-width: 1280px) 23vw, 240px';
/** First row on a phone: the cards above the fold load eagerly. */
const EAGER_COUNT = 2;

interface ProductGridProps {
  products: readonly HomeProduct[];
  /** Accessible name for the list. */
  label: string;
  /** Phone-model count for the "Fits N phones" line on procedural cards (as RelatedRows passes it). */
  modelCount?: number;
  /** Show rank numerals 1–3 by list position (trending). */
  ranked?: boolean;
  /** Show the "New" badge on photographed covers. */
  newBadge?: boolean;
  /** Load the first row eagerly; for grids at the top of a page. */
  eager?: boolean;
  className?: string;
}

/** The same cards as the home rails, in a responsive grid instead of a scroll rail. */
export function ProductGrid({
  products,
  label,
  modelCount,
  ranked = false,
  newBadge = false,
  eager = false,
  className,
}: ProductGridProps) {
  return (
    <ul
      aria-label={label}
      className={cn('grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5', className)}
    >
      {products.map((product, i) => {
        const rank = ranked ? i + 1 : undefined;
        const priority = eager && i < EAGER_COUNT;
        return (
          <li key={product.id}>
            {hasPhoto(product) ? (
              <PhotoCard product={product} rank={rank} priority={priority} newBadge={newBadge} sizes={GRID_SIZES} />
            ) : (
              <ProductCard product={product} rank={rank} modelCount={modelCount} priority={priority} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
