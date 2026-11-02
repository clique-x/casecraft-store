'use client';

import { useEffect } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { BuyButtons } from '@/components/product/BuyButtons';
import { formatInr, photoSrc } from '@/lib/catalog/photos';
import { useInView } from '@/lib/device/use-in-view';
import { chromeStore } from '@/lib/layout/chrome-store';
import { CASE_TYPES, type PhoneModel, type ProductDetail, type Variant } from '@/lib/medusa/fixtures';
import { findVariant, lowestPrice } from '@/lib/medusa/variants';
import { SPRING_UI } from '@/lib/motion/tokens';
import { usePickerSheetOpen } from '@/lib/phone/picker-sheet-store';
import { useVariantSelection } from '@/lib/product/variant-store';
import { askOnWhatsAppHref } from '@/lib/product/whatsapp-link';
import { addonVariantIds } from '@/lib/product/addons';
import { useSelectedAddons } from '@/lib/product/addon-store';

interface StickyBuyBarProps {
  product: ProductDetail;
  models: PhoneModel[];
  accessories?: readonly ProductDetail[];
}

/** Photo products carry one variant per model and no case type. */
function variantFor(product: ProductDetail, modelSlug: string | null, caseType: Variant['caseType']): Variant | null {
  if (product.caseTypes.length > 0) return findVariant(product, modelSlug, caseType);
  if (modelSlug === null) return null;
  return product.variants.find((v) => v.modelSlug === modelSlug) ?? null;
}

/**
 * Bottom bar with Add to cart and Buy now. It slides up as soon as the buy box's own buttons are
 * not wholly on screen (scrolled past, or below the fold of the pinned buy column), on every screen size, and hides again over the footer. It slides away
 * (but stays mounted) while the picker sheet is open, for the same focus-return reason as StickyPhoneCta.
 */
export function StickyBuyBar({ product, models, accessories = [] }: StickyBuyBarProps) {
  const selection = useVariantSelection();
  const selectedAddons = useSelectedAddons();
  const sheetOpen = usePickerSheetOpen();
  const actionsInView = useInView('#buy-buttons', true, true);
  const footerInView = useInView('footer');
  const shown = actionsInView === false && footerInView === false;
  const visible = shown && !sheetOpen;

  useEffect(() => {
    chromeStore.setStickyCtaVisible(visible);
  }, [visible]);
  useEffect(() => () => chromeStore.setStickyCtaVisible(false), []);

  const model = selection.modelSlug ? (models.find((x) => x.slug === selection.modelSlug) ?? null) : null;
  // Gadgets keep a colour or cable length in modelSlug, not a phone.
  const variant = product.gadget
    ? (product.variants.find((v) => v.modelSlug === selection.modelSlug) ?? null)
    : variantFor(product, model?.slug ?? null, selection.caseType);
  const caseTypeInfo = CASE_TYPES.find((c) => c.type === selection.caseType) ?? CASE_TYPES[0];
  const price = variant ? variant.priceInr : lowestPrice(product);
  const priceLabel = `${variant ? '' : 'from '}${formatInr(price)}`;
  const soldOut = variant !== null && variant.stock <= 0;
  const whatsappHref = askOnWhatsAppHref({
    productName: product.title,
    modelName: model?.model ?? null,
    caseTypeName: product.caseTypes.length > 0 ? caseTypeInfo.name : null,
    sku: variant?.sku ?? null,
    intent: soldOut ? 'notify' : 'order',
  });
  const optionName = product.gadget?.options.find((c) => c.slug === selection.modelSlug)?.name ?? null;
  const detail = [optionName ?? model?.model, product.caseTypes.length > 0 ? caseTypeInfo.name : null].filter(Boolean).join(' · ');

  return (
    <AnimatePresence>
      {shown && (
        <m.div
          key="sticky-buy-bar"
          initial={{ y: 120 }}
          animate={{ y: sheetOpen ? 120 : 0 }}
          exit={{ y: 120 }}
          transition={{ type: 'spring', ...SPRING_UI }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-paper/95 shadow-[0_-8px_24px_-12px_color-mix(in_srgb,var(--color-shadow)_18%,transparent)] supports-backdrop-filter:bg-paper/85 supports-backdrop-filter:backdrop-blur-md"
        >
          <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
            <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
              {product.photo && (
                // eslint-disable-next-line @next/next/no-img-element -- local catalogue photo at a fixed small size
                <img
                  src={photoSrc(product.photo.id, 320)}
                  alt=""
                  width={44}
                  height={55}
                  className="h-14 w-11 shrink-0 rounded-md bg-surface-2 object-contain"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-fg">{product.title}</p>
                {detail && <p className="truncate text-caption text-fg-muted">{detail}</p>}
              </div>
              <p className="ml-auto pl-4 text-lg font-extrabold text-fg tabular-nums">{priceLabel}</p>
            </div>
            <BuyButtons
              variantId={variant?.id ?? null}
              soldOut={soldOut}
              whatsappHref={whatsappHref}
              extraVariantIds={product.accessory ? [] : addonVariantIds(accessories, selectedAddons, model?.slug ?? null)}
              priceLabel={priceLabel}
              className="w-full md:w-[22rem] md:shrink-0 md:[&>button>span]:hidden"
            />
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export default StickyBuyBar;
