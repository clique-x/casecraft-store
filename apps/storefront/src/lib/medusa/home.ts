import { looksWithCovers, type LookWithCover } from '@/lib/catalog/looks';
import { getCatalog } from './catalog';
import { THEMES, type HomeProduct, type PhoneModel, type Theme } from './fixtures';

function byTrending(a: HomeProduct, b: HomeProduct): number {
  return (a.trendingRank ?? Infinity) - (b.trendingRank ?? Infinity);
}

async function photoProducts(): Promise<HomeProduct[]> {
  return (await getCatalog()).products.filter((p) => p.photo !== undefined);
}

/** Photographed stock by `trendingRank`. */
export async function getTrending(): Promise<HomeProduct[]> {
  return (await photoProducts()).filter((p) => p.trendingRank !== undefined).sort(byTrending);
}

/** Photographed stock flagged `isNew`. */
export async function getNewArrivals(): Promise<HomeProduct[]> {
  return (await photoProducts()).filter((p) => p.isNew === true).sort(byTrending);
}

/** The procedural trending list, kept for `/trending` later. */
export async function getProceduralTrending(): Promise<HomeProduct[]> {
  return (await getCatalog()).products.filter((p) => !p.photo && p.trendingRank !== undefined).sort(byTrending);
}

export async function getLooks(): Promise<LookWithCover[]> {
  return looksWithCovers();
}

export async function getPhoneModels(): Promise<PhoneModel[]> {
  return (await getCatalog()).phoneModels;
}

export async function getThemes(): Promise<Theme[]> {
  return [...THEMES];
}

export async function getProductsForPhone(slug: string): Promise<HomeProduct[]> {
  return (await getCatalog()).products.filter((p) => p.fitsModels.includes(slug));
}
