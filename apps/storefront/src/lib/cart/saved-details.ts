import type { CartAddress } from './types';

/**
 * Contact email and up to MAX_ADDRESSES delivery addresses from past checkouts, kept only in this
 * browser so the next checkout can offer them as cards. Nothing here leaves the device.
 */
const KEY = 'checkout-details-v2';
const LEGACY_KEY = 'checkout-details-v1';
const MAX_ADDRESSES = 3;

export interface SavedDetails {
  email: string;
  /** Most recently used first. */
  addresses: CartAddress[];
}

function sameAddress(a: CartAddress, b: CartAddress): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  return norm(a.address1) === norm(b.address1) && a.postalCode === b.postalCode && a.phone === b.phone;
}

export function readSavedDetails(): SavedDetails | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedDetails;
      const addresses = (parsed.addresses ?? []).filter((a) => a?.address1 && a.postalCode);
      return addresses.length > 0 ? { email: parsed.email ?? '', addresses } : null;
    }
    // One address saved by the first version of this feature.
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as { email?: string; address?: CartAddress };
      if (old.address?.address1) return { email: old.email ?? '', addresses: [old.address] };
    }
  } catch {
    /* unreadable storage: behave as if nothing was saved */
  }
  return null;
}

function write(details: SavedDetails | null): void {
  try {
    window.localStorage.removeItem(LEGACY_KEY);
    if (details && details.addresses.length > 0) window.localStorage.setItem(KEY, JSON.stringify(details));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* private mode or storage full: the next checkout simply starts empty */
  }
}

/** Puts this address first (replacing an equal one) and keeps the newest MAX_ADDRESSES. */
export function rememberAddress(email: string, address: CartAddress): void {
  const current = readSavedDetails()?.addresses ?? [];
  const addresses = [address, ...current.filter((a) => !sameAddress(a, address))].slice(0, MAX_ADDRESSES);
  write({ email, addresses });
}

export function forgetAddress(address: CartAddress): SavedDetails | null {
  const current = readSavedDetails();
  if (!current) return null;
  const next = { ...current, addresses: current.addresses.filter((a) => !sameAddress(a, address)) };
  write(next);
  return next.addresses.length > 0 ? next : null;
}

export function clearSavedDetails(): void {
  write(null);
}
