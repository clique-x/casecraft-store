'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { PhoneModel } from '@/lib/medusa/fixtures';
import { usePickerSheetOpen } from '@/lib/phone/picker-sheet-store';

const PhonePickerSheet = dynamic(
  () => import('./PhonePickerSheet.client').then((mod) => mod.PhonePickerSheet),
  { ssr: false, loading: () => null },
);

/** Mounts the picker sheet chunk on first open and keeps it mounted so close animations run. */
export function PhonePickerSheetMount({ models }: { models: PhoneModel[] }) {
  const open = usePickerSheetOpen();
  const [everOpened, setEverOpened] = useState(false);
  if (open && !everOpened) setEverOpened(true);
  if (!everOpened && !open) return null;
  return <PhonePickerSheet models={models} />;
}

export default PhonePickerSheetMount;
