'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, m } from 'motion/react';
import { Smartphone, X } from 'lucide-react';
import { phoneHref } from '@/components/phone-picker/BrandOutline';
import { useStickyCtaVisible } from '@/lib/layout/chrome-store';
import type { PhoneModel } from '@/lib/medusa/fixtures';
import { SPRING_UI } from '@/lib/motion/tokens';
import { detectDevice } from '@/lib/phone/detect-device';
import { pickerSheet } from '@/lib/phone/picker-sheet-store';
import { useMyPhone } from '@/lib/phone/use-my-phone';

/** Detection runs once per browser; a phone the visitor picked themselves always wins. */
// v2: phones are now picked (iPhones included) and the home page opens on them; run once more for everyone.
const DONE_KEY = 'device-detect-v2';
const START_DELAY_MS = 250;
const AUTO_HIDE_MS = 9000;

function hasPhoneCookie(): boolean {
  return /(?:^|;\s*)my_phone=[^;]+/.test(document.cookie);
}

function markDone(): void {
  try {
    window.localStorage.setItem(DONE_KEY, '1');
  } catch {
    /* storage unavailable: detection may run again next visit, which is harmless */
  }
}

function alreadyDone(): boolean {
  try {
    return window.localStorage.getItem(DONE_KEY) === '1';
  } catch {
    return false;
  }
}

/** The phone now selected, and for an iPhone the other models with the same screen. */
interface Note {
  slug: string;
  others: string[];
}

/**
 * Detects the visitor's phone (lib/phone/detect-device.ts), selects it, and on the home page opens
 * that phone's own page so the first thing they see is the covers that fit. iPhones do not report
 * their model, only a screen size several models share: the newest of those is picked and the
 * others are offered in the note as one-tap switches. A product or listing link is never redirected.
 */
export function DeviceDetect({ models }: { models: PhoneModel[] }) {
  const { setPhone } = useMyPhone();
  const setPhoneRef = useRef(setPhone);
  useEffect(() => {
    setPhoneRef.current = setPhone;
  }, [setPhone]);
  const stickyVisible = useStickyCtaVisible();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (hasPhoneCookie() || alreadyDone()) return;
    let cancelled = false;
    const id = window.setTimeout(async () => {
      const found = await detectDevice(models);
      if (cancelled || hasPhoneCookie()) return;
      markDone();
      if (!found) return;
      let slug: string;
      let others: string[] = [];
      if (found.kind === 'exact') {
        slug = found.slug;
      } else {
        // Newest first; on a tie the later catalogue entry (the higher model) wins.
        const ranked = found.candidates
          .map((s, i) => ({ s, i, year: models.find((x) => x.slug === s)?.releaseYear ?? 0 }))
          .sort((a, b) => b.year - a.year || b.i - a.i)
          .map((c) => c.s);
        if (ranked.length === 0) return;
        [slug, ...others] = ranked;
      }
      setPhoneRef.current(slug);
      setNote({ slug, others });
      const model = models.find((x) => x.slug === slug);
      if (model && window.location.pathname === '/') {
        router.push(phoneHref(model));
        setRedirected(true);
      }
    }, START_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [models, router]);

  useEffect(() => {
    if (!note) return;
    // iPhone visitors get longer to spot their model among the switches.
    const id = window.setTimeout(() => setNote(null), note.others.length > 0 ? AUTO_HIDE_MS * 2 : AUTO_HIDE_MS);
    return () => window.clearTimeout(id);
  }, [note]);

  const nameOf = (slug: string) => models.find((x) => x.slug === slug)?.model ?? slug;
  const switchTo = (slug: string) => {
    setPhone(slug);
    setNote(null);
    const model = models.find((x) => x.slug === slug);
    // Follow the switch when the visitor is on the page we opened (or any phone page).
    if (model && (redirected || window.location.pathname.startsWith('/phones/'))) router.push(phoneHref(model));
  };
  const openPicker = () => {
    setNote(null);
    pickerSheet.open();
  };

  return (
    <AnimatePresence>
      {note && (
        <m.div
          key="device-detect"
          role="status"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: 'spring', ...SPRING_UI }}
          className={`fixed left-4 right-20 z-50 rounded-xl border border-border bg-paper p-3.5 shadow-[0_12px_32px_-12px_color-mix(in_srgb,var(--color-shadow)_30%,transparent)] transition-[bottom] duration-(--dur-ui) sm:right-auto sm:w-[22rem] lg:left-6 ${
            stickyVisible ? 'bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] lg:bottom-[6.25rem]' : 'bottom-[calc(env(safe-area-inset-bottom)+1rem)] lg:bottom-6'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
              <Smartphone className="size-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-fg">
                Showing covers for your <strong className="font-bold">{nameOf(note.slug)}</strong>.
              </p>
              {note.others.length > 0 ? (
                <>
                  <p className="mt-1 text-caption text-fg-muted">Not this iPhone? Tap yours:</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {note.others.map((slug) => (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => switchTo(slug)}
                        className="h-9 rounded-full border border-border px-3 text-sm font-medium text-fg transition-colors outline-none hover:border-fg focus-visible:outline-2 focus-visible:outline-brand"
                      >
                        {nameOf(slug)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={openPicker}
                      className="h-9 rounded-full px-3 text-sm font-medium text-fg-muted transition-colors outline-none hover:text-fg focus-visible:outline-2 focus-visible:outline-brand"
                    >
                      Other
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={openPicker}
                  className="mt-1 rounded-sm text-sm font-semibold text-brand underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-brand"
                >
                  Not your phone? Change
                </button>
              )}
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setNote(null)}
              className="-m-1 grid size-8 shrink-0 place-items-center rounded-full text-fg-muted transition-colors outline-none hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-brand"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export default DeviceDetect;
