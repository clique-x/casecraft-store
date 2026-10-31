import type { ReactNode } from 'react';
import { getPhoneModels } from '@/lib/medusa/home';
import { medusaEnabled } from '@/lib/medusa/client';
import { CartProvider } from '@/lib/cart/cart-context';
import { CartDrawer } from '@/components/cart/CartDrawer.client';
import { GsapMount } from '@/components/motion/GsapMount.client';
import { MotionProvider } from '@/components/motion/MotionProvider';
import { MyPhoneProvider } from '@/components/phone-picker/MyPhoneProvider';
import { DeviceDetect } from '@/components/phone-picker/DeviceDetect.client';
import { PhonePickerSheetMount } from '@/components/phone-picker/PhonePickerSheetMount.client';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppFab } from '@/components/layout/WhatsAppFab.client';

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const models = await getPhoneModels();

  // The server never reads `my_phone`, so every route keeps a fully static shell;
  // MyPhoneProvider reads the cookie on the client and swaps text in reserved slots.
  return (
    <MotionProvider>
      <GsapMount />
      <CartProvider enabled={medusaEnabled}>
        <MyPhoneProvider initialSlug={null} models={models}>
          <AnnouncementBar />
          <Header />
          <main id="main" className="flex flex-1 flex-col">
            {children}
          </main>
          <Footer />
          <WhatsAppFab />
          <PhonePickerSheetMount models={models} />
          <DeviceDetect models={models} />
          <CartDrawer />
        </MyPhoneProvider>
      </CartProvider>
      <div aria-hidden="true" className="grain-overlay" />
    </MotionProvider>
  );
}
