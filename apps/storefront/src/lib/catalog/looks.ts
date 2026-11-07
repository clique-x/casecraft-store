import { PHOTOS, type PhotoEntry } from './photos';

export interface Look {
  /** Route handle under /categories/[handle]; fixed by the store spec. */
  handle: string;
  name: string;
  blurb: string;
  match: (e: PhotoEntry) => boolean;
}

export interface LookWithCover {
  look: Look;
  cover: PhotoEntry;
  /** The next covers in the look (up to two), shown as thumbnails on the tile. */
  others: PhotoEntry[];
  count: number;
}

export const LOOKS: readonly Look[] = [
  {
    handle: 'carbon-and-aramid',
    name: 'Carbon & aramid',
    blurb: 'Woven fibre backs: thin, stiff and matte.',
    match: (e) => e.look === 'carbon-and-aramid',
  },
  {
    handle: 'animal-print',
    name: 'Animal print',
    blurb: 'Tiger and horse artwork across the back.',
    match: (e) => e.look === 'animal-print',
  },
  {
    handle: 'print',
    name: 'Prints & checks',
    blurb: 'Woven-check, printed and cartoon backs.',
    match: (e) => e.look === 'print',
  },
  {
    handle: 'solid',
    name: 'Solid',
    blurb: 'One colour and a textured grip.',
    match: (e) => e.look === 'solid',
  },
  {
    handle: 'clear',
    name: 'Clear & frosted',
    blurb: 'See-through and frosted backs that show off the phone.',
    match: (e) => e.look === 'clear',
  },
  {
    handle: 'stand',
    name: 'Ring & stand',
    blurb: 'Fold-out rings, camera sliders and flip stands.',
    match: (e) => e.look === 'stand',
  },
];

function byTrending(a: PhotoEntry, b: PhotoEntry): number {
  return (a.trendingRank ?? Infinity) - (b.trendingRank ?? Infinity);
}

/** Each look with its lead cover (best `trendingRank` not already leading a look), two more, and the count. */
export function looksWithCovers(): LookWithCover[] {
  const out: LookWithCover[] = [];
  const used = new Set<number>();
  for (const look of LOOKS) {
    const items = PHOTOS.filter(look.match).sort(byTrending);
    // Looks overlap (a sparkle cover can also be a hinge cover), so lead with one no earlier tile used.
    const cover = items.find((e) => !used.has(e.id)) ?? items[0];
    if (!cover) continue;
    used.add(cover.id);
    out.push({ look, cover, others: items.filter((e) => e !== cover).slice(0, 2), count: items.length });
  }
  return out;
}
