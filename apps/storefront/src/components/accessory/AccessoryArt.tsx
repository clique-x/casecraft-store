import { useId } from 'react';
import type { AccessoryEntry } from '@/lib/catalog/accessories';
import type { PhoneModel } from '@/lib/medusa/fixtures';
import { cn } from '@/lib/utils';

type Island = PhoneModel['islandStyle'];

interface Props {
  accessory: Pick<AccessoryEntry, 'type' | 'finish'>;
  /** Camera island shape of the phone it is shown for; square when unknown. */
  island?: Island;
  className?: string;
  title?: string;
}

// Product art: hex colours are allowed here, as in the design catalogue.
const BODY = '#1c1c1e';
const FRAME = '#3a3a3c';
const GLASS = '#e9f1f4';

/** Camera lenses inside an island at (x, y), scaled by `s`. */
function Lenses({ island, x, y, s, ring }: { island: Island; x: number; y: number; s: number; ring?: boolean }) {
  const lens = (cx: number, cy: number, r: number, key: string) => (
    <g key={key}>
      {ring && <circle cx={cx} cy={cy} r={r + 2.2 * s} fill="none" stroke="#c9ced3" strokeWidth={1.6 * s} />}
      <circle cx={cx} cy={cy} r={r} fill="#0a0a0c" />
      <circle cx={cx} cy={cy} r={r * 0.55} fill="#22303a" />
      <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.18} fill="#ffffff" opacity="0.55" />
      {ring && <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy - r}`} stroke="#ffffff" strokeOpacity="0.7" strokeWidth={1.1 * s} fill="none" />}
    </g>
  );
  if (island === 'circle') {
    return (
      <g>
        <circle cx={x + 22 * s} cy={y + 22 * s} r={22 * s} fill={FRAME} />
        {lens(x + 14 * s, y + 15 * s, 6 * s, 'a')}
        {lens(x + 30 * s, y + 15 * s, 6 * s, 'b')}
        {lens(x + 22 * s, y + 30 * s, 6 * s, 'c')}
      </g>
    );
  }
  if (island === 'pills') {
    return (
      <g>
        <rect x={x} y={y} width={18 * s} height={46 * s} rx={9 * s} fill={FRAME} />
        {lens(x + 9 * s, y + 10 * s, 6 * s, 'a')}
        {lens(x + 9 * s, y + 25 * s, 6 * s, 'b')}
        {lens(x + 9 * s, y + 39 * s, 4.5 * s, 'c')}
      </g>
    );
  }
  return (
    <g>
      <rect x={x} y={y} width={42 * s} height={42 * s} rx={11 * s} fill={FRAME} />
      {lens(x + 12 * s, y + 12 * s, 7 * s, 'a')}
      {lens(x + 12 * s, y + 30 * s, 7 * s, 'b')}
      {lens(x + 30 * s, y + 21 * s, 7 * s, 'c')}
    </g>
  );
}

/**
 * Drawn product shots for accessories (no photos yet): the screen guard lifting off a phone's
 * front, glass rings over the camera island, or a textured film on the back. 4:5, like the cards.
 */
export function AccessoryArt({ accessory, island = 'square', className, title }: Props) {
  const uid = useId().replace(/:/g, '');
  const { type, finish } = accessory;

  return (
    <svg viewBox="0 0 200 250" role="img" aria-label={title} className={cn('block h-full w-full', className)}>
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6f5f1" />
          <stop offset="1" stopColor="#eceae4" />
        </linearGradient>
        <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.35" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`screen-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b4a5a" />
          <stop offset="1" stopColor="#0f2530" />
        </linearGradient>
        <pattern id={`carbon-${uid}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#26272a" />
          <rect width="4" height="4" fill="#323438" />
          <rect x="4" y="4" width="4" height="4" fill="#323438" />
        </pattern>
        <filter id={`grain-${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0.18 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id={`shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.18" />
        </filter>
      </defs>
      <rect width="200" height="250" fill={`url(#bg-${uid})`} />

      {type === 'screen-guard' && (
        <g>
          {/* phone front */}
          <g filter={`url(#shadow-${uid})`}>
            <rect x="52" y="30" width="96" height="196" rx="18" fill={BODY} />
            <rect x="57" y="35" width="86" height="186" rx="14" fill={`url(#screen-${uid})`} />
            <rect x="88" y="42" width="24" height="7" rx="3.5" fill="#000" />
          </g>
          {/* the guard, lifted and offset */}
          <g transform="translate(-14 -12)">
            <rect
              x="57"
              y="35"
              width="86"
              height="186"
              rx="14"
              fill={finish === 'privacy' ? '#0b0d10' : GLASS}
              fillOpacity={finish === 'privacy' ? 0.55 : 0.45}
              stroke="#ffffff"
              strokeOpacity="0.9"
              strokeWidth="1.5"
            />
            <rect x="57" y="35" width="86" height="186" rx="14" fill={`url(#sheen-${uid})`} />
            <rect x="89" y="43" width="22" height="6" rx="3" fill="none" stroke="#ffffff" strokeOpacity="0.8" />
          </g>
          {finish === 'privacy' && (
            <g opacity="0.85">
              <path d="M 20 128 L 44 118 L 44 138 Z" fill="#0b0d10" opacity="0.25" />
              <path d="M 180 128 L 156 118 L 156 138 Z" fill="#0b0d10" opacity="0.25" />
            </g>
          )}
        </g>
      )}

      {type === 'lens-protector' && (
        <g>
          <g filter={`url(#shadow-${uid})`}>
            <rect x="40" y="20" width="120" height="230" rx="24" fill={BODY} />
          </g>
          <Lenses island={island} x={58} y={40} s={1.55} ring />
          <rect x="40" y="20" width="120" height="230" rx="24" fill={`url(#sheen-${uid})`} opacity="0.35" />
        </g>
      )}

      {type === 'back-film' && (
        <g>
          <g filter={`url(#shadow-${uid})`}>
            <rect x="52" y="24" width="96" height="202" rx="18" fill={finish === 'carbon' ? `url(#carbon-${uid})` : '#2a2c30'} />
          </g>
          {finish === 'matte' && <rect x="52" y="24" width="96" height="202" rx="18" fill="#ffffff" filter={`url(#grain-${uid})`} />}
          <Lenses island={island} x={62} y={36} s={0.9} />
          {/* film edge peeling at the corner */}
          <path d="M 148 196 L 148 208 Q 148 226 130 226 L 118 226 Z" fill="#e8e6e0" />
          <path d="M 118 226 L 148 196" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1" />
          <rect x="52" y="24" width="96" height="202" rx="18" fill={`url(#sheen-${uid})`} opacity="0.4" />
        </g>
      )}
    </svg>
  );
}
