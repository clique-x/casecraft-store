'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { BuyButtons } from '@/components/product/BuyButtons';
import { ProtectionAddOns } from '@/components/product/ProtectionAddOns.client';
import { addonVariantIds } from '@/lib/product/addons';
import { addonStore, useSelectedAddons } from '@/lib/product/addon-store';
import { CaseTypeSelector } from '@/components/product/CaseTypeSelector.client';
import { ModelSelector } from '@/components/product/ModelSelector.client';
import { PriceTag } from '@/components/product/PriceTag.client';
import { StockLine } from '@/components/product/StockLine.client';
import { Badge } from '@/components/ui/badge';
import { LOOKS } from '@/lib/catalog/looks';
import { formatInr } from '@/lib/catalog/photos';
import { CASE_TYPES, THEMES, type CaseType, type PhoneModel, type ProductDetail, type Variant } from '@/lib/medusa/fixtures';
import { findVariant, lowestPrice } from '@/lib/medusa/variants';
import { DEFAULT_SELECTION, useVariantSelection, variantStore } from '@/lib/product/variant-store';
import { coverHeadline, coverMaker } from '@/lib/product/names';
import { askOnWhatsAppHref } from '@/lib/product/whatsapp-link';
import { useMyPhone } from '@/lib/phone/use-my-phone';

const BADGE_LABEL: Record<NonNullable<ProductDetail['badge']>, string> = {
  bestseller: 'Bestseller',
  limited: 'Limited',
};

const ORDER_NOTE = 'Pay by UPI, card, netbanking or Cash on Delivery at checkout.';
const COOKIE_RE = /(?:^|;\s*)my_phone=([^;]*)/;

// Read directly: the MyPhoneProvider value is still the server's `null` in the hydration commit's effects.
function readCookiePhone(): string | null {
  const match = COOKIE_RE.exec(document.cookie);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function isCaseType(value: string | null): value is CaseType {
  return value !== null && CASE_TYPES.some((c) => c.type === value);
}

/** Photo products carry one variant per model and no case type, so the type is ignored for them. */
function variantFor(product: ProductDetail, modelSlug: string | null, caseType: CaseType): Variant | null {
  if (product.caseTypes.length > 0) return findVariant(product, modelSlug, caseType);
  if (modelSlug === null) return null;
  return product.variants.find((v) => v.modelSlug === modelSlug) ?? null;
}

/** The line above the title. A cover's brand and series are already in its H1, so covers show their look here. */
function brandLineOf(product: ProductDetail): string | null {
  if (product.photo) return LOOKS.find((l) => l.handle === product.photo?.look)?.name ?? 'Back cover';
  return product.brandLine ?? null;
}

interface BuyBoxProps {
  product: ProductDetail;
  models: PhoneModel[];
  /** Screen guards and lens protectors offered as add-ons on cover pages. */
  accessories?: readonly ProductDetail[];
}

/**
 * Owns the variant selection for the page: initialises it (query → cookie → first in stock),
 * mirrors it into the URL with `replaceState`, and resets it when the page goes away.
 */
export function BuyBox({ product, models, accessories = [] }: BuyBoxProps) {
  const { phone, setPhone } = useMyPhone();
  const selection = useVariantSelection();

  const hasCaseTypes = product.caseTypes.length > 0;
  const fitModels = useMemo(() => models.filter((m) => product.fitsModels.includes(m.slug)), [models, product]);
  const caseTypes = useMemo(() => CASE_TYPES.filter((c) => product.caseTypes.includes(c.type)), [product]);

  const initialised = useRef(false);
  const selectedAddons = useSelectedAddons();
  // Add-ons belong to one cover page; start each page with none ticked.
  useEffect(() => {
    addonStore.reset();
    return () => addonStore.reset();
  }, [product.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryType = params.get('type');
    const caseType: CaseType =
      isCaseType(queryType) && product.caseTypes.includes(queryType) ? queryType : (product.caseTypes[0] ?? 'soft');

    const fits = (slug: string | null): slug is string => slug !== null && fitModels.some((m) => m.slug === slug);
    const queryModel = params.get('model');
    const cookieModel = readCookiePhone();
    const firstInStock =
      fitModels.find((m) => (variantFor(product, m.slug, caseType)?.stock ?? 0) > 0) ?? fitModels[0] ?? null;
    const modelSlug = fits(queryModel) ? queryModel : fits(cookieModel) ? cookieModel : (firstInStock?.slug ?? null);

    variantStore.reset({ modelSlug, caseType });
    initialised.current = true;
    return () => {
      initialised.current = false;
      variantStore.reset(DEFAULT_SELECTION);
    };
  }, [product, fitModels]);

  useEffect(() => {
    if (!initialised.current) return;
    // Read the store, not the rendered value: the init effect above may have just moved it.
    const current = variantStore.get();
    const url = new URL(window.location.href);
    if (current.modelSlug) url.searchParams.set('model', current.modelSlug);
    else url.searchParams.delete('model');
    if (hasCaseTypes) url.searchParams.set('type', current.caseType);
    else url.searchParams.delete('type');
    const next = `${url.pathname}${url.search}${url.hash}`;
    const now = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== now) window.history.replaceState(null, '', next);
  }, [selection, hasCaseTypes]);

  const selectedModel = selection.modelSlug ? (fitModels.find((m) => m.slug === selection.modelSlug) ?? null) : null;
  const variant = variantFor(product, selectedModel?.slug ?? null, selection.caseType);
  const caseTypeInfo = caseTypes.find((c) => c.type === selection.caseType) ?? caseTypes[0] ?? CASE_TYPES[0];
  const soldOut = variant !== null && variant.stock <= 0;
  const unfitPhone = phone && !product.fitsModels.includes(phone.slug) ? phone : null;
  const theme = THEMES.find((t) => t.handle === product.theme);
  const brandLine = brandLineOf(product);
  const price = variant ? variant.priceInr : lowestPrice(product);
  const regular = product.regularInr !== undefined && product.regularInr > price ? product.regularInr : null;

  const soldOutTypes = new Set<CaseType>(
    selectedModel
      ? caseTypes
          .filter((c) => (findVariant(product, selectedModel.slug, c.type)?.stock ?? 0) <= 0)
          .map((c) => c.type)
      : [],
  );

  const chooseModel = (slug: string) => {
    variantStore.set({ modelSlug: slug });
    if (!phone) setPhone(slug);
  };

  const whatsappArgs = {
    productName: product.title,
    modelName: selectedModel?.model ?? null,
    caseTypeName: hasCaseTypes ? caseTypeInfo.name : null,
    sku: variant?.sku ?? null,
  };
  const fallbackHref = askOnWhatsAppHref({ ...whatsappArgs, intent: soldOut ? 'notify' : 'order' });
  const whatsappHref = askOnWhatsAppHref(whatsappArgs);

  return (
    <section id="buy-box" aria-labelledby="buy-box-title" className="flex flex-col gap-7 text-fg">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-label font-bold tracking-[0.2em] text-accent-text uppercase">
          {brandLine ? <span>{brandLine}</span> : theme ? <span>{theme.name}</span> : null}
          {product.badge && <Badge className="border-transparent bg-badge text-fg">{BADGE_LABEL[product.badge]}</Badge>}
          {product.isNew && <Badge className="border-transparent bg-surface-2 text-fg">New</Badge>}
        </div>
        <h1 id="buy-box-title" className="font-display text-h2 text-balance">
          {product.photo ? (
            <>
              {coverHeadline(product.photo)}
              <span className="mt-2 block font-sans text-[1.0625rem] leading-snug font-semibold tracking-normal text-fg-muted">
                {coverMaker(product.photo)}
              </span>
            </>
          ) : (
            product.title
          )}
        </h1>
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="flex items-baseline gap-2">
            <PriceTag priceInr={price} from={variant === null} />
            {regular !== null && (
              <s className="text-sm text-fg-muted tabular-nums">
                <span className="sr-only">Regular price </span>
                {formatInr(regular)}
              </s>
            )}
          </div>
          <StockLine stock={variant ? variant.stock : null} />
        </div>
      </header>

      <ModelSelector models={fitModels} value={selectedModel?.slug ?? null} onChange={chooseModel} unfitPhone={unfitPhone} />

      {hasCaseTypes && (
        <CaseTypeSelector
          options={caseTypes}
          value={selection.caseType}
          onChange={(caseType) => variantStore.set({ caseType })}
          soldOut={soldOutTypes}
        />
      )}

      {!product.accessory && accessories.length > 0 && (
        <ProtectionAddOns accessories={accessories} model={selectedModel} coverPrice={price} />
      )}

      <div id="buy-actions" className="flex flex-col gap-3">
        <div id="buy-buttons">
          <BuyButtons
            variantId={variant?.id ?? null}
            soldOut={soldOut}
            whatsappHref={fallbackHref}
            extraVariantIds={product.accessory ? [] : addonVariantIds(accessories, selectedAddons, selectedModel?.slug ?? null)}
          />
        </div>
        <p className="text-caption text-fg-muted">{ORDER_NOTE}</p>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 self-start rounded-sm text-sm font-semibold text-fg underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <MessageCircle className="size-4 text-whatsapp" aria-hidden="true" />
          Questions? Chat with us on WhatsApp
        </a>
      </div>
    </section>
  );
}

export default BuyBox;
