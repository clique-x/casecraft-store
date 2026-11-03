import Link from 'next/link';
import { PhoneBrandLogo } from '@/components/brand/PhoneBrandLogo';
import { Reveal } from '@/components/motion/Reveal.client';
import { EYEBROW, SHELL } from './hub-styles';

export interface LogoBrand {
  /** Name for the link's accessible label. */
  name: string;
  href: string;
  /** What we sell of theirs, one or two words. */
  tag: string;
  /** An official logo file under /public, or a phone brand drawn by PhoneBrandLogo. */
  logo: { src: string; width: number; height: number } | { phoneBrand: string };
}

/** Real brand logos, one tap each: the audio makers we resell and the phones we cut covers for. */
export function BrandsWall({ brands }: { brands: LogoBrand[] }) {
  return (
    <section aria-labelledby="brands-heading" className="bg-paper py-12 text-fg lg:py-16">
      <div className={SHELL}>
        <Reveal>
          <h2 id="brands-heading" className={EYEBROW}>
            Shop by brand
          </h2>
        </Reveal>
        <ul className="mt-6 grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-6">
          {brands.map((b) => (
            <li key={b.name}>
              <Link
                href={b.href}
                aria-label={`${b.name}: ${b.tag}`}
                className="group/brand flex aspect-[4/3] flex-col overflow-hidden items-center justify-center gap-2 rounded-[18px] bg-surface-2 px-3 ring-1 ring-fg/5 transition-[transform,box-shadow,background-color] duration-(--dur-ui) ease-out-expo outline-none hover:-translate-y-0.5 hover:bg-paper hover:shadow-[0_16px_32px_-20px_color-mix(in_srgb,var(--color-shadow)_40%,transparent)] focus-visible:ring-2 focus-visible:ring-accent-2 motion-reduce:transition-none"
              >
                <span className="flex h-10 items-center justify-center">
                  {'src' in b.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- small official SVG logo
                    <img src={b.logo.src} alt="" width={b.logo.width} height={b.logo.height} className="h-7 w-auto sm:h-9" />
                  ) : (
                    <span className="flex items-center [zoom:1.15] sm:[zoom:1.5] lg:[zoom:1.9]">
                      <PhoneBrandLogo brand={b.logo.phoneBrand} />
                    </span>
                  )}
                </span>
                <span className="text-caption font-medium text-fg-muted">{b.tag}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
