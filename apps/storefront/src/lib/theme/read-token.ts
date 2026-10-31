'use client';

import { Color } from 'three';

export function readToken(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function tokenColor(name: string): Color {
  const value = readToken(name);
  const color = new Color();
  if (value) color.setStyle(value);
  return color;
}
