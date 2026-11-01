'use client';

import { AudioArt } from '@/components/audio/AudioArt';
import type { AudioEntry } from '@/lib/catalog/audio';
import { useVariantSelection } from '@/lib/product/variant-store';

/** Product image in the colour picked in the buy box (its slug is kept in the selection's modelSlug). */
export function AudioStage({ audio, title }: { audio: AudioEntry; title: string }) {
  const { modelSlug } = useVariantSelection();
  const colour = audio.colours.find((c) => c.slug === modelSlug) ?? audio.colours[0];
  return (
    <div className="relative aspect-[4/5] max-h-[60svh] w-full overflow-hidden rounded-card bg-surface-2 lg:max-h-none">
      <AudioArt audio={audio} hex={colour?.hex} title={colour ? `${title} in ${colour.name}` : title} />
      {colour && (
        <span className="absolute bottom-3 left-3 rounded-full bg-paper/90 px-3 py-1 text-caption font-semibold text-fg backdrop-blur">
          {colour.name}
        </span>
      )}
    </div>
  );
}
