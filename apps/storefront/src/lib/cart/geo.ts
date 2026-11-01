import { INDIAN_STATES } from './india';

export interface GeoAddress {
  postalCode: string;
  city: string;
  state: string;
  /** Road, neighbourhood and suburb, e.g. "Shanti Kunj Road, Jwalapur". */
  area: string;
}

export type GeoError = 'unsupported' | 'denied' | 'unavailable' | 'outside-india' | 'not-found';

function matchState(name: string | undefined): string {
  if (!name) return '';
  const n = name.toLowerCase().replace(/^national capital territory of /, '');
  return INDIAN_STATES.find((s) => s.toLowerCase() === n) ?? name;
}

/** The browser's position; this is what shows the "Allow location" prompt. */
function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }),
  );
}

interface NominatimAddress {
  postcode?: string;
  state?: string;
  country_code?: string;
  city?: string;
  town?: string;
  village?: string;
  city_district?: string;
  state_district?: string;
  county?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  residential?: string;
  hamlet?: string;
}

/**
 * Asks for the visitor's location and turns it into an address with OpenStreetMap's Nominatim
 * (usage policy: occasional, user-triggered lookups from the browser, with attribution).
 * The coordinates are sent only to Nominatim and are not stored by the shop.
 */
export async function locateAddress(): Promise<{ ok: true; value: GeoAddress } | { ok: false; error: GeoError }> {
  if (!('geolocation' in navigator)) return { ok: false, error: 'unsupported' };
  let pos: GeolocationPosition;
  try {
    pos = await currentPosition();
  } catch (e) {
    return { ok: false, error: (e as GeolocationPositionError)?.code === 1 ? 'denied' : 'unavailable' };
  }
  const { latitude, longitude } = pos.coords;
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=en&lat=${latitude.toFixed(6)}&lon=${longitude.toFixed(6)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return { ok: false, error: 'not-found' };
    const body = (await res.json()) as { address?: NominatimAddress };
    const a = body.address;
    if (!a) return { ok: false, error: 'not-found' };
    if (a.country_code && a.country_code !== 'in') return { ok: false, error: 'outside-india' };
    const area = [a.road, a.neighbourhood ?? a.residential ?? a.hamlet, a.suburb ?? a.quarter ?? a.city_district]
      .filter((p, i, all): p is string => Boolean(p) && all.indexOf(p) === i)
      .join(', ');
    return {
      ok: true,
      value: {
        postalCode: (a.postcode ?? '').replace(/\s/g, '').slice(0, 6),
        city: a.city ?? a.town ?? a.state_district ?? a.county ?? a.village ?? '',
        state: matchState(a.state),
        area,
      },
    };
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}

export const GEO_MESSAGES: Record<GeoError, string> = {
  unsupported: 'This browser cannot share your location. Enter your pincode instead.',
  denied: 'Location permission was turned off. Enter your pincode, or allow location in your browser settings.',
  unavailable: 'We could not get your location just now. Enter your pincode instead.',
  'outside-india': 'That location is outside India. We deliver within India only.',
  'not-found': 'We could not find an address there. Enter your pincode instead.',
};
