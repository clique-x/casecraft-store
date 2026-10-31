'use client';

import { useEffect } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { formatInr } from '@/lib/catalog/photos';
import { useInView } from '@/lib/device/use-in-view';
import { chromeStore } from '@/lib/layout/chrome-store';
import { CASE_TYPES, type PhoneModel, type ProductDetail } from '@/lib/medusa/fixtures';
import { findVariant, lowestPrice } from '@/lib/medusa/variants';
import { SPRING_UI } from '@/lib/motion/tokens';
import { usePickerSheetOpen } from '@/lib/phone/picker-sheet-store';
import { useVariantSelection } from '@/lib/product/variant-store';
import { askOnWhatsAppHref } from '@/lib/product/whatsapp-link';

interface StickyBuyBarProps {
  product: ProductDetail;
  models: PhoneModel[];
}

/**
 * Phone-only bottom bar with the live price and the one working CTA. Hidden while the buy box
 * or the footer is on screen; slides away (but stays mounted) while the picker sheet is open,
 * for the same focus-return reason as StickyPhoneCta.
 */
export function StickyBuyBar({ product, models }: StickyBuyBarProps) {
  const selection = useVariantSelection();
  const sheetOpen = usePickerSheetOpen();
  const buyBoxInView = useInView('#buy-box');
  const footerInView = useInView('footer');
  const shown = buyBoxInView === false && footerInView === false;
  const visible = shown && !sheetOpen;

  useEffect(() => {
    chromeStore.setStickyCtaVisible(visible);
  }, [visible]);
  useEffect(() => () => chromeStore.setStickyCtaVisible(false), []);

  const model = selection.modelSlug ? (models.find((x) => x.slug === selection.modelSlug) ?? null) : null;
  const variant = findVariant(product, model?.slug ?? null, selection.caseType);
  const caseTypeInfo = CASE_TYPES.find((c) => c.type === selection.caseType) ?? CASE_TYPES[0];
  const price = variant ? variant.priceInr : lowestPrice(product);
  const href = askOnWhatsAppHref({
    productName: product.title,
    modelName: model?.model ?? null,
    caseTypeName: product.caseTypes.length > 0 ? caseTypeInfo.name : null,
    sku: variant?.sku ?? null,
  });

  return (
    <AnimatePresence>
      {shown && (
        <m.div
          key="sticky-buy-bar"
          initial={{ y: 96 }}
          animate={{ y: sheetOpen ? 96 : 0 }}
          exit={{ y: 96 }}
          transition={{ type: 'spring', ...SPRING_UI }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] supports-backdrop-filter:bg-surface/85 supports-backdrop-filter:backdrop-blur lg:hidden"
        >
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-accent px-6 text-base font-semibold text-ink transition-colors duration-(--dur-micro) outline-none hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
          >
            <span className="tabular-nums">
              {variant ? '' : 'from '}
              {formatInr(price)}
            </span>
            <span aria-hidden="true">·</span>
            <MessageCircle className="size-5" aria-hidden="true" />
            Ask on WhatsApp
          </a>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export default StickyBuyBar;
