'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { Smartphone, X } from 'lucide-react';
import { useStickyCtaVisible } from '@/lib/layout/chrome-store';
import type { PhoneModel } from '@/lib/medusa/fixtures';
import { SPRING_UI } from '@/lib/motion/tokens';
import { detectDevice, type Detection } from '@/lib/phone/detect-device';
import { pickerSheet } from '@/lib/phone/picker-sheet-store';
import { useMyPhone } from '@/lib/phone/use-my-phone';

/** Detection runs once per browser; a phone the visitor picked themselves always wins. */
const DONE_KEY = 'device-detect-v1';
const START_DELAY_MS = 1200;
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

type Note = Exclude<Detection, null>;

/**
 * Detects the visitor's phone (lib/phone/detect-device.ts) and either selects it, with a note
 * offering to change it, or, on an iPhone, asks which of the few matching models it is.
 */
export function DeviceDetect({ models }: { models: PhoneModel[] }) {
  const { setPhone } = useMyPhone();
  const setPhoneRef = useRef(setPhone);
  useEffect(() => {
    setPhoneRef.current = setPhone;
  }, [setPhone]);
  const stickyVisible = useStickyCtaVisible();
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    if (hasPhoneCookie() || alreadyDone()) return;
    let cancelled = false;
    const id = window.setTimeout(async () => {
      const found = await detectDevice(models);
      if (cancelled || hasPhoneCookie()) return;
      markDone();
      if (!found) return;
      if (found.kind === 'exact') setPhoneRef.current(found.slug);
      setNote(found);
    }, START_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [models]);

  useEffect(() => {
    if (note?.kind !== 'exact') return;
    const id = window.setTimeout(() => setNote(null), AUTO_HIDE_MS);
    return () => window.clearTimeout(id);
  }, [note]);

  const nameOf = (slug: string) => models.find((x) => x.slug === slug)?.model ?? slug;
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
              {note.kind === 'exact' ? (
                <>
                  <p className="text-sm text-fg">
                    Showing covers for your <strong className="font-bold">{nameOf(note.slug)}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={openPicker}
                    className="mt-1 rounded-sm text-sm font-semibold text-brand underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    Not your phone? Change
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-fg">Which iPhone are you using?</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {note.candidates.map((slug) => (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => {
                          setPhone(slug);
                          setNote(null);
                        }}
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
