import type { ProductDetail } from '@/lib/medusa/fixtures';
import { productJsonLd } from '@/lib/seo/structured-data';

/** Product markup for Google: price, stock, brand, photo, shipping, replacement policy and real reviews. */
export function ProductJsonLd({ product }: { product: ProductDetail }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productJsonLd(product) }} />;
}
