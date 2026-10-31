import type { PhoneModel } from '@/lib/medusa/fixtures';

/**
 * Guesses the visitor's phone from what the browser exposes.
 *
 * - Android: Chrome-based browsers report the model code through User-Agent Client Hints
 *   (`navigator.userAgentData.getHighEntropyValues(['model'])`), e.g. "SM-S931B" for a Galaxy S25.
 *   Older browsers still put it in the user-agent string. A code match is treated as certain.
 * - iPhone: Safari never reports the model. The screen size in points narrows it to a few
 *   models, so the visitor is asked to pick one of those.
 * - Anything else (desktop, tablets, unknown codes): no guess.
 *
 * Model codes are the makers' regional variants. Add codes here when new phones join the catalogue;
 * a code that is missing only means no automatic pick, never a wrong one.
 */
const ANDROID_CODES: Record<string, RegExp> = {
  'galaxy-s25': /^SM-S931[A-Z0-9]*$/i,
  'galaxy-a56': /^SM-A566[A-Z0-9]*$/i,
  'oneplus-13': /^(CPH2649|CPH2653|CPH2655|PJZ110)$/i,
  'oneplus-nord-ce4': /^CPH2613$/i,
  'redmi-note-14-pro': /^(24094RAD4[CGI]|24116RACC[GI])$/i,
  'redmi-note-13': /^(2312DRAAB[CGI]|23129RAA4G|23124RA7EO)$/i,
  'realme-13-pro': /^RMX3990$/i,
  'vivo-v40': /^V2348$/i,
  'vivo-v50': /^V2427$/i,
  'nothing-phone-3a': /^A059P?$/i,
};

/** Screen size in CSS points (portrait), per iPhone in the catalogue. */
const IPHONE_SCREENS: Record<string, string> = {
  'iphone-16': '393x852',
  'iphone-16-pro': '402x874',
  'iphone-17': '402x874',
  'iphone-18-pro': '402x874',
};

export type Detection =
  | { kind: 'exact'; slug: string }
  | { kind: 'iphone'; candidates: string[] }
  | null;

interface UADataLike {
  mobile?: boolean;
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<{ model?: string; platform?: string }>;
}

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function androidModel(): Promise<string | null> {
  const uaData = (navigator as Navigator & { userAgentData?: UADataLike }).userAgentData;
  if (uaData?.getHighEntropyValues) {
    try {
      const { model } = await uaData.getHighEntropyValues(['model']);
      if (model) return model.trim();
    } catch {
      /* hints refused: fall back to the UA string */
    }
  }
  // "Mozilla/5.0 (Linux; Android 14; SM-S931B) …"; reduced UAs say "K" instead of the model.
  const match = /Android [\d.]+; ([^;)]+?)(?: Build\/[^;)]*)?[;)]/.exec(navigator.userAgent);
  const model = match?.[1]?.trim();
  return model && model !== 'K' ? model : null;
}

export async function detectDevice(models: readonly PhoneModel[]): Promise<Detection> {
  const known = new Set(models.map((m) => m.slug));
  const ua = navigator.userAgent;

  if (/iPhone/.test(ua)) {
    const w = Math.min(screen.width, screen.height);
    const h = Math.max(screen.width, screen.height);
    const size = `${w}x${h}`;
    const iphones = models.filter((m) => m.brand === 'Apple').map((m) => m.slug);
    const bySize = iphones.filter((slug) => IPHONE_SCREENS[slug] === size);
    if (bySize.length === 1) return { kind: 'exact', slug: bySize[0] };
    return iphones.length > 0 ? { kind: 'iphone', candidates: bySize.length > 0 ? bySize : iphones } : null;
  }

  if (/Android/i.test(ua)) {
    const code = await androidModel();
    if (!code) return null;
    for (const [slug, re] of Object.entries(ANDROID_CODES)) {
      if (known.has(slug) && re.test(code)) return { kind: 'exact', slug };
    }
    // Pixels report their marketing name ("Pixel 9a"), which matches the catalogue name directly.
    const byName = models.find((m) => normalise(m.model) === normalise(code));
    if (byName) return { kind: 'exact', slug: byName.slug };
  }

  return null;
}
