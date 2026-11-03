import type { MediaImage } from '@/components/product/MediaColumn.client';
import { gadgetGallerySrc, gadgetGallerySrcSet, type GadgetPhotos } from '@/lib/catalog/gadgets';
import { gallerySrc, gallerySrcSet, photoAlt, type PhotoEntry } from '@/lib/catalog/photos';

/** A photographed cover's gallery, in the owner's order, for the product page's image column. */
export function coverMedia(photo: PhotoEntry): MediaImage[] {
  const alt = photoAlt(photo);
  return (photo.gallery ?? []).map((label, n) => ({
    label,
    alt: `${alt}: ${label}`,
    src160: gallerySrc(photo.id, n, 160),
    src480: gallerySrc(photo.id, n, 480),
    src960: gallerySrc(photo.id, n, 960),
    src1440: gallerySrc(photo.id, n, 1440),
    srcSet: gallerySrcSet(photo.id, n),
  }));
}

/** A gadget's brand images (colours first, then the feature creatives) for the image column. */
export function gadgetMedia(photos: GadgetPhotos, title: string): MediaImage[] {
  return photos.gallery.map((label, n) => ({
    label,
    alt: `${title}: ${label}`,
    src160: gadgetGallerySrc(photos, n, 160),
    src480: gadgetGallerySrc(photos, n, 480),
    src960: gadgetGallerySrc(photos, n, 960),
    src1440: gadgetGallerySrc(photos, n, 1440),
    srcSet: gadgetGallerySrcSet(photos, n),
  }));
}
