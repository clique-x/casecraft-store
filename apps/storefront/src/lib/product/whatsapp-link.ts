import { WHATSAPP_NUMBER } from '@/lib/brand';

interface AskOnWhatsAppArgs {
  productName: string;
  modelName: string | null;
  /** Omitted for photographed stock, which has one case type. */
  caseTypeName: string | null;
  sku: string | null;
}

/** Prefilled wa.me link for ordering (or asking about) one variant. */
export function askOnWhatsAppHref({ productName, modelName, caseTypeName, sku }: AskOnWhatsAppArgs): string {
  const lines = [
    `Hi! I'd like to order the ${productName} back cover.`,
    `Phone: ${modelName ?? 'not picked yet'}`,
  ];
  if (caseTypeName) lines.push(`Case type: ${caseTypeName}`);
  if (sku) lines.push(`SKU: ${sku}`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}
