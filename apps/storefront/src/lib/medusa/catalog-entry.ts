import { ACCESSORIES } from '@/lib/catalog/accessories';
import { GADGETS } from '@/lib/catalog/gadgets';
import { PHOTOS } from '@/lib/catalog/photos';
import { DESIGNS } from '@/lib/designs/catalog';

type Metadata = Record<string, unknown> | null | undefined;

function str(meta: Metadata, key: string): string | undefined {
  const v = meta?.[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function num(meta: Metadata, key: string): number | undefined {
  const v = meta?.[key];
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Whether a store product matches an entry of the site's own catalogue, by the same metadata lookups
 * catalog.ts makes to show it (accessory_id, gadget_id or the first seed's audio_id, photo_id, design_id).
 * A product that is still in the store but retired from the catalogue does not, so src/proxy.ts answers its
 * address with a real 404.
 */
export function hasCatalogEntry(meta: Metadata): boolean {
  const kind = str(meta, 'kind');
  if (kind === 'accessory') return ACCESSORIES.some((a) => a.id === str(meta, 'accessory_id'));
  if (kind === 'gadget' || kind === 'audio') {
    const id = str(meta, 'gadget_id') ?? str(meta, 'audio_id');
    return GADGETS.some((g) => g.id === id);
  }
  const photoId = num(meta, 'photo_id');
  if (photoId !== undefined && PHOTOS.some((e) => e.id === photoId)) return true;
  return DESIGNS.some((d) => d.id === str(meta, 'design_id'));
}
