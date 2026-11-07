import type { HomeProduct } from '@/lib/medusa/fixtures';

/**
 * How a review names its product. Photographed covers carry short titles ("Orange · CaseCraft"), so they
 * get maker, range, colour and phone; everything else keeps its product title.
 */
export function reviewProductName(product: Pick<HomeProduct, 'title' | 'photo'>): string {
  const photo = product.photo;
  return photo ? `${photo.brand} ${photo.series} ${photo.design} cover for ${photo.modelLabel}` : product.title;
}
