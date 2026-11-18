'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { Download, Share, Smartphone, SquarePlus, X } from 'lucide-react';
import { INTRO_DOM } from '@/components/intro/intro-config';
import { BRAND_NAME, SITE_URL } from '@/lib/brand';
import { useCart } from '@/lib/cart/cart-context';
import { useInView } from '@/lib/device/use-in-view';
import { INSTALLED_EVENT, installMethod, isStandalone, markShown, mayAsk, rememberInstalled, snooze } from '@/lib/install/install';
import { useDeviceNoteVisible, useHeroPresent, useStickyCtaVisible } from '@/lib/layout/chrome-store';
import { SPRING_UI } from '@/lib/motion/tokens';
import { pickerSheet, usePickerSheetOpen } from '@/lib/phone/picker-sheet-store';
import { useMyPhone } from '@/lib/phone/use-my-phone';
import { cn } from '@/lib/utils';

/** The pop-up never shows sooner than this after the page loads (ms). */
const FIRST_LOOK_MS = 9000;
/** It waits for the visitor to have scrolled this far (px), or to have stayed this long (ms). */
const ENGAGED_SCROLL_PX = 320;
const ENGAGED_MS = 22_000;
/** Left alone, it goes away by itself after this long (ms). The pointer or focus on it holds it. */
const AUTO_HIDE_MS = 22_000;
/** It stops looking for its moment after this long (ms): a visitor that far in is busy. */
const GIVE_UP_MS = 180_000;

/** "gadgetshub.io": the address under the app's name, as a browser's own install dialog shows it. */
const SITE_HOST = new URL(SITE_URL).host;
const PRIMARY =
  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-gh-ink px-4 text-[0.8125rem] font-semibold whitespace-nowrap text-white outline-none transition-[background-color,transform] hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.97]';

type Outcome = 'shown' | 'accepted' | 'declined' | 'closed' | 'how-to' | 'model';

/** For the shop's analytics, if its tag manager listens for it. No visitor details. */
function track(outcome: Outcome): void {
  (window as Window & { dataLayer?: unknown[] }).dataLayer?.push({ event: 'install_prompt', install_prompt_outcome: outcome });
}

/** A text field has focus: the visitor is typing, and a pop-up would be in the way. */
function typing(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

/**
 * A small glass card in the bottom corner that offers to install the store as an app, or to pick a phone model.
 * It is not a dialog: nothing is dimmed or blocked, focus stays where it is, and the page scrolls under it.
 *
 * It waits for a quiet moment. Not in the first seconds, not before the visitor has scrolled or stayed a while,
 * not over the hero on phones, not during the intro, while typing, on the checkout, or while the cart, the phone
 * picker or the "showing covers for your phone" note is up. Left alone it leaves by itself. It has one turn per
 * tab; closing it or declining the install keeps it away for a month, and it never shows in the installed app.
 *
 * Install asks the browser for its own install dialog (Chrome, Edge, Samsung Internet). On an iPhone or iPad,
 * where only the Share menu can install, Install shows those two taps instead. Browsers that cannot install get
 * nothing.
 */
export function InstallPrompt() {
  const { phone } = useMyPhone();
  const { drawerOpen } = useCart();
  const sheetOpen = usePickerSheetOpen();
  const noteUp = useDeviceNoteVisible();
  const stickyVisible = useStickyCtaVisible();
  // Below lg the hero's own buttons sit in this corner, so the card waits until the hero has scrolled away.
  const heroPresent = useHeroPresent(true);
  const heroInView = useInView('#hero', heroPresent);
  const overHero = heroPresent && heroInView !== false;

  const [open, setOpen] = useState<'prompt' | 'ios' | null>(null);
  const [steps, setSteps] = useState(false);
  const [held, setHeld] = useState(false);
  const [busy, setBusy] = useState(false);

  // What keeps the card waiting, read by the timer below without restarting it.
  const blocked = drawerOpen || sheetOpen || noteUp;
  const waitFor = useRef({ blocked, overHero });
  useEffect(() => {
    waitFor.current = { blocked, overHero };
  }, [blocked, overHero]);

  // Look for the moment once a second. Every check is a few property reads.
  useEffect(() => {
    const started = performance.now();
    let furthest = window.scrollY;
    const onScroll = () => {
      furthest = Math.max(furthest, window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    let timer = 0;
    const stop = () => {
      window.clearInterval(timer);
      window.removeEventListener('scroll', onScroll);
    };
    timer = window.setInterval(() => {
      const waited = performance.now() - started;
      if (isStandalone() || !mayAsk() || waited > GIVE_UP_MS) return stop();
      // The browser may announce that the store is installable a little after the page loads.
      const method = installMethod();
      if (!method || waited < FIRST_LOOK_MS) return;
      if (furthest < ENGAGED_SCROLL_PX && waited < ENGAGED_MS) return;
      const phoneWidth = window.matchMedia('(max-width: 63.99rem)').matches;
      if (waitFor.current.blocked || (phoneWidth && waitFor.current.overHero)) return;
      if (document.hidden || typing() || document.documentElement.hasAttribute(INTRO_DOM.stateAttr) || document.getElementById('checkout-form')) return;
      stop();
      markShown();
      track('shown');
      setOpen(method);
    }, 1000);
    return stop;
  }, []);

  // Installed from the browser's own menu while the card is up.
  useEffect(() => {
    const onInstalled = () => setOpen(null);
    window.addEventListener(INSTALLED_EVENT, onInstalled);
    return () => window.removeEventListener(INSTALLED_EVENT, onInstalled);
  }, []);

  // Left alone, it leaves. The iPhone steps stay until the visitor closes them: they are being read.
  const resting = open !== null && !held && !steps && !busy;
  useEffect(() => {
    if (!resting) return;
    const timer = window.setTimeout(() => setOpen(null), AUTO_HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [resting]);

  const close = () => {
    snooze();
    track('closed');
    setOpen(null);
  };

  const install = async () => {
    const event = window.__ghInstall;
    if (!event) return setOpen(null);
    setBusy(true);
    try {
      await event.prompt();
      const { outcome } = await event.userChoice;
      // The browser lets an install event be used once.
      window.__ghInstall = null;
      if (outcome === 'accepted') {
        rememberInstalled();
        track('accepted');
      } else {
        snooze();
        track('declined');
      }
    } finally {
      setBusy(false);
      setOpen(null);
    }
  };

  const pickModel = () => {
    track('model');
    setOpen(null);
    pickerSheet.open();
  };

  // The cart or the picker opening over it takes the card away; it does not come back in this tab.
  const visible = open !== null && !drawerOpen && !sheetOpen;

  return (
    <AnimatePresence>
      {visible && (
        <m.aside
          key="install-prompt"
          data-install-prompt=""
          aria-label={`Install the ${BRAND_NAME} app`}
          initial={{ y: 18, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 12, opacity: 0, scale: 0.98, transition: { duration: 0.18, ease: 'easeIn' } }}
          transition={{ type: 'spring', ...SPRING_UI }}
          onPointerEnter={(e) => e.pointerType === 'mouse' && setHeld(true)}
          onPointerLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={() => setHeld(false)}
          className={cn(
            // The corner the WhatsApp button leaves free; the same place as the device note.
            'fixed right-20 left-3 z-40 origin-bottom-left overflow-hidden rounded-[1.25rem] border border-white/70 bg-white/60 text-gh-ink shadow-[0_24px_60px_-26px_rgba(2,26,30,.6),0_2px_10px_rgba(2,26,30,.07)] backdrop-blur-lg backdrop-saturate-150 transition-[bottom] duration-(--dur-ui) sm:right-auto sm:w-[21.5rem] lg:left-6 print:hidden',
            stickyVisible ? 'bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] lg:bottom-[6.25rem]' : 'bottom-[calc(env(safe-area-inset-bottom)+0.875rem)] lg:bottom-6',
          )}
        >
          {/* The sheen that makes it read as glass on a plain page too, where there is nothing behind it to blur. */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.78)_0%,rgba(255,255,255,.14)_46%,rgba(166,240,220,.34)_100%)]" />

          <div className="relative p-3.5">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- the app's own icon, at a fixed size */}
              <img src="/icons/icon-192.png" width={40} height={40} alt="" className="size-10 shrink-0 rounded-[0.7rem] shadow-[0_6px_14px_-6px_rgba(2,26,30,.55)]" />
              <div className="min-w-0 flex-1">
                <p className="text-[0.9375rem] leading-tight font-bold">Install app on device</p>
                <p className="mt-0.5 truncate text-[0.75rem] leading-tight text-gh-ink/60">
                  {BRAND_NAME} · {SITE_HOST}
                </p>
              </div>
              <button
                type="button"
                aria-label="Not now"
                onClick={close}
                className="-my-1 -mr-1 grid size-8 shrink-0 place-items-center self-start rounded-full text-gh-ink/60 outline-none transition-colors hover:bg-gh-ink/8 hover:text-gh-ink focus-visible:outline-2 focus-visible:outline-brand"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-2.5 text-caption leading-snug text-pretty text-gh-ink/80">
              {phone ? `Keep everything that fits your ${phone.model} one tap away.` : 'To see what fits your phone, install the app or select your model.'}
            </p>

            {/* iPhone and iPad: the two taps, opened by Install. Rows of 0fr to 1fr, so nothing jumps. */}
            {open === 'ios' && (
              <div id="install-steps" className={cn('grid transition-[grid-template-rows,opacity] duration-300 ease-out-expo', steps ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                <ol inert={!steps} className="min-h-0 overflow-hidden text-caption leading-snug text-gh-ink/85">
                  <li className="mt-2.5 flex items-center gap-2">
                    <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-white/70 text-brand ring-1 ring-gh-ink/8">
                      <Share className="size-3.5" aria-hidden="true" />
                    </span>
                    <span>
                      Tap <strong className="font-semibold">Share</strong> in your browser&rsquo;s toolbar.
                    </span>
                  </li>
                  <li className="mt-1.5 flex items-center gap-2">
                    <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-white/70 text-brand ring-1 ring-gh-ink/8">
                      <SquarePlus className="size-3.5" aria-hidden="true" />
                    </span>
                    <span>
                      Choose <strong className="font-semibold">Add to Home Screen</strong>.
                    </span>
                  </li>
                </ol>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              {open === 'prompt' ? (
                <button type="button" disabled={busy} onClick={install} className={cn(PRIMARY, 'disabled:opacity-60')}>
                  <Download className="size-3.5" aria-hidden="true" />
                  Install
                </button>
              ) : (
                // Safari cannot be asked to install; Install shows the two taps that do it, then reads "Got it".
                <button
                  type="button"
                  aria-expanded={steps}
                  aria-controls="install-steps"
                  onClick={() => {
                    // "Got it": the visitor knows the two taps now, so the card is done.
                    if (steps) return close();
                    track('how-to');
                    setSteps(true);
                  }}
                  className={PRIMARY}
                >
                  {!steps && <Download className="size-3.5" aria-hidden="true" />}
                  {steps ? 'Got it' : 'Install'}
                </button>
              )}
              <button
                type="button"
                onClick={pickModel}
                className="inline-flex h-9 min-w-0 items-center gap-1.5 rounded-full border border-gh-ink/15 bg-white/50 px-3.5 text-[0.8125rem] font-semibold whitespace-nowrap text-gh-ink outline-none transition-colors hover:border-gh-ink/40 hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Smartphone className="size-3.5 shrink-0" aria-hidden="true" />
                {phone ? 'Change model' : 'Select your model'}
              </button>
            </div>
          </div>
        </m.aside>
      )}
    </AnimatePresence>
  );
}

export default InstallPrompt;
