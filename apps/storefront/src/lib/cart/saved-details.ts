import type { CartAddress } from './types';

/** Contact and address from the last checkout, kept only in this browser to prefill the next one. */
const KEY = 'checkout-details-v1';

export interface SavedDetails {
  email: string;
  address: CartAddress;
}

export function readSavedDetails(): SavedDetails | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedDetails;
    return parsed?.address?.address1 ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSavedDetails(details: SavedDetails): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(details));
  } catch {
    /* private mode or storage full: prefill simply will not happen next time */
  }
}

export function clearSavedDetails(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}
