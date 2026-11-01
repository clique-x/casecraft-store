'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Check, Loader2, LocateFixed, MapPin } from 'lucide-react';
import { GEO_MESSAGES, locateAddress } from '@/lib/cart/geo';
import { INDIAN_STATES, lookupPincode } from '@/lib/cart/india';
import type { CartAddress } from '@/lib/cart/types';
import { cn } from '@/lib/utils';

export const INPUT =
  'h-12 w-full rounded-[10px] border border-border bg-paper px-3.5 text-base text-fg placeholder:text-fg-muted/70 outline-none transition-colors focus:border-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand';
const LABEL = 'flex flex-col gap-1.5 text-sm font-medium text-fg';

type PinStatus = 'idle' | 'checking' | 'found' | 'unknown';

interface Props {
  address: CartAddress;
  setAddress: Dispatch<SetStateAction<CartAddress>>;
}

/**
 * The short address form: one tap on "Use my current location" fills pincode, area, city and
 * state; typing a pincode alone fills city and state. City and state then show as one confirmed
 * line and only become fields when they could not be found or the visitor wants to change them.
 */
export function AddressFields({ address, setAddress }: Props) {
  const [fullName, setFullName] = useState(() => [address.firstName, address.lastName].filter(Boolean).join(' '));
  const [locating, setLocating] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [usedLocation, setUsedLocation] = useState(false);
  const [pin, setPin] = useState<PinStatus>(() => (address.city && address.province ? 'found' : 'idle'));
  const [editPlace, setEditPlace] = useState(false);

  const set = (key: keyof CartAddress) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAddress((a) => ({ ...a, [key]: e.target.value }));

  const onName = (value: string) => {
    setFullName(value);
    const [first = '', ...rest] = value.trim().split(/\s+/);
    setAddress((a) => ({ ...a, firstName: first, lastName: rest.join(' ') }));
  };

  // Pincode → city and state (India Post). Runs for typed and located pincodes alike.
  const postalCode = address.postalCode.trim();
  useEffect(() => {
    if (!/^[1-9]\d{5}$/.test(postalCode)) return;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => setPin('checking'), 0);
    lookupPincode(postalCode, ctrl.signal).then((found) => {
      if (ctrl.signal.aborted) return;
      if (found) {
        setAddress((a) => ({ ...a, city: a.city || found.city, province: found.state }));
        setPin('found');
      } else {
        setPin((p) => (p === 'checking' ? 'unknown' : p));
      }
    });
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [postalCode, setAddress]);

  const useLocation = async () => {
    setLocating(true);
    setGeoMessage(null);
    const res = await locateAddress();
    setLocating(false);
    if (!res.ok) {
      setGeoMessage(GEO_MESSAGES[res.error]);
      return;
    }
    const g = res.value;
    setAddress((a) => ({
      ...a,
      postalCode: g.postalCode || a.postalCode,
      address2: g.area || a.address2,
      city: g.city || a.city,
      province: g.state || a.province,
    }));
    setUsedLocation(true);
    setEditPlace(false);
    if (g.city && g.state) setPin('found');
    setGeoMessage(g.postalCode ? null : 'We found your area but not its pincode. Please enter it.');
  };

  const placeKnown = pin === 'found' && Boolean(address.city) && Boolean(address.province);
  const showPlaceFields = editPlace || pin === 'unknown' || (!placeKnown && address.postalCode.length === 6 && pin !== 'checking');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={useLocation}
          disabled={locating}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-brand/30 bg-brand/5 px-4 text-base font-semibold text-brand transition-colors outline-none hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-70"
        >
          {locating ? <Loader2 className="size-4.5 animate-spin" aria-hidden="true" /> : <LocateFixed className="size-4.5" aria-hidden="true" />}
          {locating ? 'Finding your address…' : 'Use my current location'}
        </button>
        {geoMessage ? (
          <p role="status" className="text-caption text-fg-muted">
            {geoMessage}
          </p>
        ) : usedLocation ? (
          <p role="status" className="text-caption text-fg-muted">
            Filled from your location. Check the house number and landmark. Map data ©{' '}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">
              OpenStreetMap
            </a>
          </p>
        ) : (
          <p className="text-caption text-fg-muted">Or type your pincode and we fill in the city and state.</p>
        )}
      </div>

      <label className={LABEL}>
        Full name
        <input className={INPUT} autoComplete="name" required value={fullName} onChange={(e) => onName(e.target.value)} placeholder="As on the doorbell" />
      </label>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_1fr] sm:items-end">
        <label className={LABEL}>
          Pincode
          <input
            className={INPUT}
            inputMode="numeric"
            autoComplete="postal-code"
            required
            pattern="[1-9][0-9]{5}"
            maxLength={6}
            title="6-digit pincode"
            value={address.postalCode}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, '').slice(0, 6);
              setAddress((a) => (next === a.postalCode ? a : { ...a, postalCode: next, city: '', province: '' }));
              setPin('idle');
              setEditPlace(false);
            }}
            placeholder="6 digits"
          />
        </label>
        <div className="flex min-h-12 items-center text-sm" aria-live="polite">
          {pin === 'checking' && (
            <span className="inline-flex items-center gap-2 text-fg-muted">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Checking pincode…
            </span>
          )}
          {placeKnown && !editPlace && (
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
              <MapPin className="size-4 text-brand" aria-hidden="true" />
              <span className="font-semibold text-fg">
                {address.city}, {address.province}
              </span>
              <Check className="size-4 text-success" aria-label="Delivery available" />
              <button type="button" onClick={() => setEditPlace(true)} className="font-semibold text-brand underline-offset-4 hover:underline">
                Change
              </button>
            </span>
          )}
          {pin === 'unknown' && !editPlace && <span className="text-fg-muted">We could not look up this pincode. Add your city and state below.</span>}
        </div>
      </div>

      {showPlaceFields && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={LABEL}>
            City
            <input className={INPUT} autoComplete="address-level2" required value={address.city} onChange={set('city')} />
          </label>
          <label className={LABEL}>
            State
            <select className={INPUT} autoComplete="address-level1" required value={address.province} onChange={set('province')}>
              <option value="" disabled>
                Choose your state
              </option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <label className={LABEL}>
        Flat, house no., building
        <input className={INPUT} autoComplete="address-line1" required value={address.address1} onChange={set('address1')} placeholder="e.g. 12, Shanti Kunj" />
      </label>
      <label className={cn(LABEL)}>
        Area, street, landmark
        <input className={INPUT} autoComplete="address-line2" value={address.address2} onChange={set('address2')} placeholder="Optional, but it helps the courier" />
      </label>
    </div>
  );
}
