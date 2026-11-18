/**
 * Installing the store as an app (the web app manifest in app/manifest.ts makes it installable).
 *
 * Chrome, Edge and Samsung Internet announce that the site can be installed with a `beforeinstallprompt` event,
 * once, soon after the page loads. The inline script below is in <head> so it is listening before then; it holds
 * the event for the install pop-up, which asks the browser to show its own install dialog when the visitor taps
 * Install. Safari on iPhone and iPad has no such event: the pop-up shows the two taps that add the store to the
 * home screen. Other browsers get nothing, since there is nothing we could do for them.
 */

/** The event Chromium browsers fire when the site can be installed. Not in the DOM typings. */
export interface InstallEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    /** The held install event; null once used or once the app is installed. */
    __ghInstall?: InstallEvent | null;
  }
}

/** Fired on window when an install event has been captured, and when the app has been installed. */
export const INSTALLABLE_EVENT = 'gh:installable';
export const INSTALLED_EVENT = 'gh:installed';

/** localStorage: `installed`, or the time (ms) until which the pop-up stays away after a "not now". */
const MEMORY_KEY = 'gh-install';
/** sessionStorage: set once the pop-up has had its turn in this tab. */
const SESSION_KEY = 'gh-install-shown';
/** A visitor who closes the pop-up or declines the install is not asked again for this long. */
const SNOOZE_DAYS = 30;

/** Runs before the page's own scripts: keeps the install event, and remembers an install. */
export function installBootScript(): string {
  return `(function(){try{window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__ghInstall=e;window.dispatchEvent(new Event('${INSTALLABLE_EVENT}'));});window.addEventListener('appinstalled',function(){window.__ghInstall=null;try{localStorage.setItem('${MEMORY_KEY}','installed');}catch(_){}window.dispatchEvent(new Event('${INSTALLED_EVENT}'));});}catch(_){}})();`;
}

/** Already running as the installed app. */
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/**
 * Safari (or another browser) on an iPhone or iPad, where "Add to Home Screen" is in the Share menu. An iPad
 * reports itself as a Mac, so touch points tell them apart. In-app browsers (Instagram, Facebook and the like)
 * have no such menu item and are left out.
 */
export function isIosBrowser(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return ios && !/FBAN|FBAV|Instagram|Line\/|MicroMessenger|GSA\//.test(ua);
}

/** How this browser installs the app, or null when it cannot. */
export function installMethod(): 'prompt' | 'ios' | null {
  if (isStandalone()) return null;
  if (window.__ghInstall) return 'prompt';
  return isIosBrowser() ? 'ios' : null;
}

/** False once installed, while snoozed after a "not now", or after its turn in this tab. */
export function mayAsk(): boolean {
  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) return false;
    const memory = window.localStorage.getItem(MEMORY_KEY);
    if (memory === 'installed') return false;
    if (memory && Number(memory) > Date.now()) return false;
  } catch {
    /* storage unavailable: asking once per page load is all we can do */
  }
  return true;
}

/** The pop-up has had its turn in this tab, however it ends. */
export function markShown(): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* see mayAsk */
  }
}

export function rememberInstalled(): void {
  try {
    window.localStorage.setItem(MEMORY_KEY, 'installed');
  } catch {
    /* see mayAsk */
  }
}

/** "Not now": stay away for SNOOZE_DAYS. */
export function snooze(): void {
  try {
    window.localStorage.setItem(MEMORY_KEY, String(Date.now() + SNOOZE_DAYS * 86_400_000));
  } catch {
    /* see mayAsk */
  }
}
