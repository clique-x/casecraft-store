'use client';

import { useMediaQuery } from './use-media-query';

export function useFinePointer(): boolean {
  return useMediaQuery('(pointer: fine)');
}
