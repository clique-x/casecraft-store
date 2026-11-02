import type { GadgetEntry } from '@/lib/catalog/gadgets';
import type { PhoneModel } from '@/lib/medusa/fixtures';

/** iPhone moved from Lightning to USB-C with the iPhone 15 (2023); every Android phone we list is USB-C. */
export function phoneConnector(phone: PhoneModel): 'usb-c' | 'lightning' {
  return phone.brand === 'Apple' && phone.releaseYear < 2023 ? 'lightning' : 'usb-c';
}

export const CONNECTOR_NAME = { 'usb-c': 'USB-C', lightning: 'Lightning' } as const;

export interface PhoneFit {
  ok: boolean;
  text: string;
}

/**
 * What a charger or cable means for the visitor's phone, or null when there is nothing specific to
 * say (audio, or a charger that charges it at normal speed).
 */
export function phoneFit(entry: Pick<GadgetEntry, 'phoneEnd' | 'fastFor'>, phone: PhoneModel | null): PhoneFit | null {
  if (!phone) return null;
  if (entry.phoneEnd) {
    const needs = phoneConnector(phone);
    if (needs !== entry.phoneEnd) return { ok: false, text: `Not for your ${phone.model}: it needs ${CONNECTOR_NAME[needs]}` };
  }
  if (entry.fastFor?.includes(phone.brand)) return { ok: true, text: `Fast-charges your ${phone.model}` };
  if (entry.phoneEnd) return { ok: true, text: `Fits your ${phone.model}` };
  return null;
}
