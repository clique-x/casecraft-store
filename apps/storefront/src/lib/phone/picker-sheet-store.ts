import { useSyncExternalStore } from 'react';

let open = false;
const listeners = new Set<() => void>();

function emit() {
  for (const cb of listeners) cb();
}

export const pickerSheet = {
  open(): void {
    if (open) return;
    open = true;
    emit();
  },
  close(): void {
    if (!open) return;
    open = false;
    emit();
  },
  subscribe(cb: () => void): () => void {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  isOpen(): boolean {
    return open;
  },
};

const getServerSnapshot = () => false;

export function usePickerSheetOpen(): boolean {
  return useSyncExternalStore(pickerSheet.subscribe, pickerSheet.isOpen, getServerSnapshot);
}
