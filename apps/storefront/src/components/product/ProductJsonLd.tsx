import { BRAND_NAME, SITE_URL } from '@/lib/brand';
import { ACCESSORY_TYPE_LABEL, accessoryPhotoSrc } from '@/lib/catalog/accessories';
import { GADGET_TYPE_LABEL, gadgetGallerySrc, gadgetHeroIndex } from '@/lib/catalog/gadgets';
import { LOOKS } from '@/lib/catalog/looks';
import { gallerySrc, photoSrc } from '@/lib/catalog/photos';
import { THEMES, type ProductDetail } from '@/lib/medusa/fixtures';
import { lowestPrice } from '@/lib/medusa/variants';

function categoryOf(product: ProductDetail): string {
  if (product.gadget) return GADGET_TYPE_LABEL[product.gadget.type];
  if (product.accessory) return ACCESSORY_TYPE_LABEL[product.accessory.type];
  if (product.photo) {
    const look = LOOKS.find((l) => l.handle === product.photo?.look);
    return look ? `${look.name} phone back covers` : 'Phone back covers';
  }
  const theme = THEMES.find((t) => t.handle === product.theme);
  return theme ? `${theme.name} phone back covers` : 'Phone back covers';
}

function materialOf(product: ProductDetail): string {
  if (product.photo || product.accessory) return product.details.material;
  return product.caseTypes.includes('glass') ? 'TPU, tempered glass' : 'TPU';
}

function productJsonLd(product: ProductDetail): string {
  const url = new URL(`/products/${product.handle}`, SITE_URL).toString();
  const inStock = product.variants.some((v) => v.stock > 0);
  const photo = product.photo;
  const gadget = product.gadget;
  const accessory = product.accessory;
  const catalogImage = gadget?.photos
    ? new URL(gadgetGallerySrc(gadget.photos, gadgetHeroIndex(gadget.photos, gadget.options[0]?.slug), 960), SITE_URL).toString()
    : accessory?.photos && accessory.photos.gallery.length > 0
      ? new URL(accessoryPhotoSrc(accessory.id, 0, 960), SITE_URL).toString()
      : null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    url,
    ...(photo
      ? {
          image: new URL(
            photo.gallery && photo.gallery.length > 0 ? gallerySrc(photo.id, 0, 960) : photoSrc(photo.id, 960),
            SITE_URL,
          ).toString(),
        }
      : catalogImage
        ? { image: catalogImage }
        : {}),
    sku: product.variants[0]?.sku,
    brand: { '@type': 'Brand', name: photo ? photo.brand : (gadget?.original?.brand ?? accessory?.brand ?? BRAND_NAME) },
    category: categoryOf(product),
    ...(gadget ? {} : { material: materialOf(product) }),
    offers: {
      '@type': 'Offer',
      url,
      price: lowestPrice(product),
      priceCurrency: 'INR',
      itemCondition: 'https://schema.org/NewCondition',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: BRAND_NAME },
    },
  };
  return JSON.stringify(jsonLd).replace(/</g, '\\u003c');
}

export function ProductJsonLd({ product }: { product: ProductDetail }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productJsonLd(product) }} />;
}
