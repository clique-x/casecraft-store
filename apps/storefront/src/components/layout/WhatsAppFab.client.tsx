'use client';

import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { WHATSAPP_NUMBER } from '@/lib/brand';
import { useInView } from '@/lib/device/use-in-view';
import { useHeroPresent, useStickyCtaVisible } from '@/lib/layout/chrome-store';
import { useMyPhone } from '@/lib/phone/use-my-phone';
import { usePickerSheetOpen } from '@/lib/phone/picker-sheet-store';
import { cn } from '@/lib/utils';

export function WhatsAppFab() {
  const { phone } = useMyPhone();
  const sheetOpen = usePickerSheetOpen();
  // Below lg the hero CTAs sit where the button floats, so it waits until the hero scrolls away.
  // SSR assumes a hero so the button never paints over the CTAs before hydration.
  const heroPresent = useHeroPresent(true);
  const heroInView = useInView('#hero', heroPresent);
  const overHero = heroPresent && heroInView !== false;
  const stickyVisible = useStickyCtaVisible();
  // Checkout has its own fixed action bar on phones and a WhatsApp link in the page.
  const onCheckout = usePathname()?.startsWith('/checkout') ?? false;

  const text = phone
    ? `Hi! I'm looking for a back cover for my ${phone.model}.`
    : "Hi! I'm looking for a phone back cover.";
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      aria-hidden={sheetOpen || undefined}
      tabIndex={sheetOpen ? -1 : undefined}
      className={cn(
        'fixed right-4 z-40 inline-flex size-14 items-center justify-center rounded-pill bg-whatsapp text-fg-on-ink shadow-lg shadow-shadow/15 transition-[opacity,transform,visibility,bottom] duration-(--dur-ui) ease-out-expo hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2 lg:right-6',
        // The sticky bar (lg:hidden) is 72 px plus the safe area; sit above it only while it shows.
        stickyVisible
          ? 'bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] lg:bottom-[6rem]'
          : 'bottom-[calc(env(safe-area-inset-bottom)+1rem)] lg:bottom-6',
        sheetOpen && 'pointer-events-none translate-y-4 opacity-0',
        overHero && 'max-lg:invisible max-lg:translate-y-4 max-lg:opacity-0',
        onCheckout && 'max-lg:hidden',
      )}
    >
      <MessageCircle className="size-7" aria-hidden="true" />
    </a>
  );
}

export default WhatsAppFab;
