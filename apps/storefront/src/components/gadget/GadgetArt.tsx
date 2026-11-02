import { useId } from 'react';
import type { GadgetEntry } from '@/lib/catalog/gadgets';
import { cn } from '@/lib/utils';

interface Props {
  gadget: Pick<GadgetEntry, 'id' | 'type' | 'title' | 'ports' | 'phoneEnd' | 'hostEnd'>;
  /** Product colour; defaults to black. */
  hex?: string;
  className?: string;
  title?: string;
}

/** Light colours need a darker outline to read on the light background. */
function isLight(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 180;
}

/** Drawn product shots for gadgets (no photos yet), in the selected colour. 4:5, like the cards. */
export function GadgetArt({ gadget, hex = '#1f2023', className, title }: Props) {
  const uid = useId().replace(/:/g, '');
  const light = isLight(hex);
  const edge = light ? '#c9c9c4' : 'none';
  const shade = light ? '#d9d9d3' : '#000000';

  return (
    <svg viewBox="0 0 200 250" role="img" aria-label={title} className={cn('block h-full w-full', className)}>
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6f5f1" />
          <stop offset="1" stopColor="#eceae4" />
        </linearGradient>
        <linearGradient id={`hl-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id={`sh-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#000" floodOpacity="0.18" />
        </filter>
        <pattern id={`grille-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.1" fill={shade} opacity={light ? 0.6 : 0.35} />
        </pattern>
      </defs>
      <rect width="200" height="250" fill={`url(#bg-${uid})`} />

      {gadget.type === 'earbuds' && (
        <g filter={`url(#sh-${uid})`}>
          {/* open case: lid and base */}
          <path d="M 52 112 Q 52 84 100 84 Q 148 84 148 112 L 148 118 L 52 118 Z" fill={hex} stroke={edge} />
          <rect x="52" y="122" width="96" height="62" rx="26" fill={hex} stroke={edge} />
          <rect x="52" y="122" width="96" height="62" rx="26" fill={`url(#hl-${uid})`} />
          <circle cx="100" cy="166" r="2.2" fill={light ? '#3c9a5f' : '#4ade80'} />
          {/* buds resting in the case */}
          {[78, 122].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy="128" rx="13" ry="11" fill={hex} stroke={light ? '#b8b8b2' : '#3a3b40'} strokeWidth="1.2" />
              <ellipse cx={x} cy="125" rx="6" ry="4" fill={light ? '#d6d6d0' : '#0f1012'} />
              <rect x={x - 4} y="134" width="8" height="26" rx="4" fill={hex} stroke={light ? '#b8b8b2' : '#3a3b40'} strokeWidth="1.2" />
            </g>
          ))}
        </g>
      )}

      {gadget.type === 'neckband' && (
        <g filter={`url(#sh-${uid})`}>
          <path d="M 46 82 Q 46 196 100 196 Q 154 196 154 82" fill="none" stroke={hex} strokeWidth="13" strokeLinecap="round" />
          {light && <path d="M 46 82 Q 46 196 100 196 Q 154 196 154 82" fill="none" stroke="#c9c9c4" strokeWidth="1" />}
          {/* control pods */}
          <rect x="37" y="76" width="18" height="44" rx="9" fill={hex} stroke={edge} />
          <rect x="145" y="76" width="18" height="44" rx="9" fill={hex} stroke={edge} />
          <rect x="40" y="88" width="12" height="3" rx="1.5" fill={shade} opacity="0.5" />
          <rect x="40" y="95" width="12" height="3" rx="1.5" fill={shade} opacity="0.5" />
          {/* cables and buds */}
          <path d="M 46 76 Q 52 50 76 46" fill="none" stroke={light ? '#9a9a94' : '#2a2b2f'} strokeWidth="2" />
          <path d="M 154 76 Q 148 50 124 46" fill="none" stroke={light ? '#9a9a94' : '#2a2b2f'} strokeWidth="2" />
          <circle cx="78" cy="44" r="9" fill={hex} stroke={edge} />
          <circle cx="122" cy="44" r="9" fill={hex} stroke={edge} />
          <circle cx="78" cy="44" r="4" fill={light ? '#d6d6d0' : '#0f1012'} />
          <circle cx="122" cy="44" r="4" fill={light ? '#d6d6d0' : '#0f1012'} />
        </g>
      )}

      {gadget.type === 'speaker' && gadget.id !== 'spk-party' && (
        <g filter={`url(#sh-${uid})`}>
          {/* strap */}
          <path d="M 70 84 Q 64 58 84 56 L 116 56 Q 136 58 130 84" fill="none" stroke={light ? '#9a9a94' : '#2a2b2f'} strokeWidth="5" />
          <rect x="44" y="80" width="112" height="104" rx="34" fill={hex} stroke={edge} />
          <rect x="54" y="90" width="92" height="84" rx="26" fill={`url(#grille-${uid})`} />
          <rect x="44" y="80" width="112" height="104" rx="34" fill={`url(#hl-${uid})`} />
          <rect x="84" y="186" width="32" height="5" rx="2.5" fill={shade} opacity="0.4" />
        </g>
      )}

      {gadget.id === 'spk-party' && (
        <g filter={`url(#sh-${uid})`}>
          <rect x="58" y="34" width="84" height="186" rx="22" fill={hex} stroke={edge} />
          <rect x="66" y="48" width="68" height="120" rx="14" fill={`url(#grille-${uid})`} />
          <circle cx="100" cy="88" r="26" fill="none" stroke={shade} strokeOpacity="0.5" strokeWidth="2" />
          <circle cx="100" cy="88" r="10" fill={shade} opacity="0.35" />
          <circle cx="100" cy="140" r="18" fill="none" stroke={shade} strokeOpacity="0.5" strokeWidth="2" />
          {/* light ring */}
          <ellipse cx="100" cy="196" rx="30" ry="7" fill="none" stroke="#0e6b76" strokeWidth="3" />
          <ellipse cx="100" cy="196" rx="30" ry="7" fill="none" stroke="#ee5a3c" strokeWidth="3" strokeDasharray="20 28" />
          <rect x="58" y="34" width="84" height="186" rx="22" fill={`url(#hl-${uid})`} />
        </g>
      )}
      {gadget.type === 'charger' && (
        <g filter={`url(#sh-${uid})`}>
          {/* two-pin Indian plug */}
          {[86, 114].map((x) => (
            <rect key={x} x={x - 4} y="58" width="8" height="30" rx="4" fill="#b9bcc2" />
          ))}
          <rect x="54" y="84" width="92" height="108" rx="20" fill={hex} stroke={edge} />
          <rect x="54" y="84" width="92" height="108" rx="20" fill={`url(#hl-${uid})`} />
          <text x="100" y="128" textAnchor="middle" fontSize="15" fontWeight="700" fill={light ? '#55565a' : '#d8d8d4'} fontFamily="system-ui, sans-serif">
            {watts(gadget.title)}
          </text>
          <Ports ports={gadget.ports ?? ['usb-c']} y={156} light={light} />
        </g>
      )}

      {gadget.type === 'car-charger' && (
        <g filter={`url(#sh-${uid})`}>
          <rect x="82" y="96" width="36" height="96" rx="16" fill={hex} stroke={edge} />
          <rect x="114" y="128" width="8" height="20" rx="3" fill="#b9bcc2" />
          <rect x="78" y="128" width="8" height="20" rx="3" fill="#b9bcc2" />
          <circle cx="100" cy="196" r="7" fill="#b9bcc2" />
          <rect x="64" y="48" width="72" height="52" rx="16" fill={hex} stroke={edge} />
          <rect x="64" y="48" width="72" height="52" rx="16" fill={`url(#hl-${uid})`} />
          <Ports ports={gadget.ports ?? ['usb-c']} y={74} light={light} />
          <circle cx="100" cy="92" r="1.8" fill="#0e6b76" />
        </g>
      )}

      {gadget.type === 'cable' && (
        <g filter={`url(#sh-${uid})`}>
          {/* coiled cable */}
          {[0, 1, 2].map((i) => (
            <ellipse
              key={i}
              cx={100 + i * 3}
              cy={146 + i * 6}
              rx={54 - i * 2}
              ry={38 - i * 1.5}
              fill="none"
              stroke={hex}
              strokeWidth="7"
            />
          ))}
          {light &&
            [0, 1, 2].map((i) => (
              <ellipse key={i} cx={100 + i * 3} cy={146 + i * 6} rx={54 - i * 2} ry={38 - i * 1.5} fill="none" stroke="#c9c9c4" strokeWidth="0.8" />
            ))}
          {gadget.id.startsWith('cab-braid') &&
            [0, 1, 2].map((i) => (
              <ellipse
                key={i}
                cx={100 + i * 3}
                cy={146 + i * 6}
                rx={54 - i * 2}
                ry={38 - i * 1.5}
                fill="none"
                stroke={light ? '#d2d2cc' : '#45464b'}
                strokeWidth="3"
                strokeDasharray="2 3"
              />
            ))}
          {/* leads up to the two plugs */}
          <path d="M 66 122 Q 60 96 72 78" fill="none" stroke={hex} strokeWidth="7" strokeLinecap="round" />
          <path d="M 136 124 Q 142 98 128 80" fill="none" stroke={hex} strokeWidth="7" strokeLinecap="round" />
          <Plug x={72} end={gadget.hostEnd ?? 'usb-c'} hex={hex} edge={edge} />
          <Plug x={128} end={gadget.phoneEnd ?? 'usb-c'} hex={hex} edge={edge} />
        </g>
      )}
    </svg>
  );
}

/** "45 W PPS fast charger" -> "45W". */
function watts(title: string): string {
  const m = /(\d+)\s*W\b/.exec(title);
  return m ? `${m[1]}W` : '';
}

function Ports({ ports, y, light }: { ports: readonly ('usb-c' | 'usb-a')[]; y: number; light: boolean }) {
  const widths = ports.map((p) => (p === 'usb-c' ? 20 : 26));
  const gap = 8;
  const total = widths.reduce((a, b) => a + b, 0) + gap * (ports.length - 1);
  const lefts = widths.map((_, i) => 100 - total / 2 + widths.slice(0, i).reduce((a, b) => a + b + gap, 0));
  const slot = light ? '#3a3b40' : '#0b0c0e';
  return (
    <>
      {ports.map((p, i) =>
        p === 'usb-c' ? (
          <rect key={i} x={lefts[i]} y={y - 3.5} width={widths[i]} height="7" rx="3.5" fill={slot} />
        ) : (
          <g key={i}>
            <rect x={lefts[i]} y={y - 5} width={widths[i]} height="10" rx="1" fill={slot} />
            <rect x={lefts[i] + 3} y={y - 5} width={widths[i] - 6} height="4" fill="#9aa0a8" />
          </g>
        ),
      )}
    </>
  );
}

/** A cable plug pointing up, centred on x: the moulded body and its connector. */
function Plug({ x, end, hex, edge }: { x: number; end: 'usb-c' | 'usb-a' | 'lightning'; hex: string; edge: string }) {
  return (
    <g>
      <rect x={x - 9} y="50" width="18" height="34" rx="6" fill={hex} stroke={edge} />
      {end === 'usb-c' && <rect x={x - 6} y="36" width="12" height="16" rx="5" fill="#c3c6cc" />}
      {end === 'lightning' && (
        <g>
          <rect x={x - 4} y="34" width="8" height="18" rx="3" fill="#d4d6da" />
          {[38, 42, 46].map((y) => (
            <rect key={y} x={x - 2.5} y={y} width="5" height="2" rx="1" fill="#c7a15a" />
          ))}
        </g>
      )}
      {end === 'usb-a' && (
        <g>
          <rect x={x - 8} y="32" width="16" height="20" rx="1.5" fill="#c3c6cc" />
          <rect x={x - 5} y="35" width="10" height="5" fill="#6b7077" />
        </g>
      )}
    </g>
  );
}
