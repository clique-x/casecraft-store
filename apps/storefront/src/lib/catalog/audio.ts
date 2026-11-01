/**
 * Wireless audio sold alongside the covers. Not cut for a phone: each product comes in colours.
 * PLACEHOLDER CONTENT: names, specs and prices are examples to replace with the real stock.
 */

export type AudioType = 'earbuds' | 'neckband' | 'speaker';

export interface AudioColour {
  slug: string;
  name: string;
  /** Product art colour (hex is allowed in product content). */
  hex: string;
}

export interface AudioEntry {
  id: string;
  handle: string;
  title: string;
  type: AudioType;
  priceInr: number;
  regularInr: number;
  short: string;
  description: string;
  features: [string, string, string];
  /** Key specs, shown as a list on the product page. */
  specs: readonly { label: string; value: string }[];
  inBox: string;
  colours: readonly AudioColour[];
}

export const AUDIO_TYPE_LABEL: Record<AudioType, string> = {
  earbuds: 'Wireless earbuds',
  neckband: 'Neckband',
  speaker: 'Bluetooth speaker',
};

const BLACK: AudioColour = { slug: 'black', name: 'Black', hex: '#1f2023' };
const WHITE: AudioColour = { slug: 'white', name: 'White', hex: '#eeeeea' };
const BLUE: AudioColour = { slug: 'blue', name: 'Blue', hex: '#2f4a6d' };
const GREEN: AudioColour = { slug: 'green', name: 'Green', hex: '#3d5a48' };
const RED: AudioColour = { slug: 'red', name: 'Red', hex: '#a3302b' };

export const AUDIO: readonly AudioEntry[] = [
  {
    id: 'buds-anc',
    handle: 'wireless-earbuds-anc',
    title: 'Wireless earbuds ANC',
    type: 'earbuds',
    priceInr: 1999,
    regularInr: 3999,
    short: 'Noise cancelling, 40 h with the case',
    description:
      'In-ear wireless earbuds with active noise cancellation for the metro and the office, and a transparency mode for when you need to hear the announcement. Four mics keep calls clear, and the case charges over USB-C.',
    features: ['Active noise cancellation', 'Up to 40 h with the case', 'Four mics for clear calls'],
    specs: [
      { label: 'Playback', value: 'Up to 8 h per charge, 40 h with the case' },
      { label: 'Bluetooth', value: '5.3, pairs with Android and iPhone' },
      { label: 'Noise control', value: 'Active noise cancellation and transparency mode' },
      { label: 'Water resistance', value: 'IPX5 (sweat and rain)' },
      { label: 'Charging', value: 'USB-C, 10 min for 2 h of playback' },
    ],
    inBox: 'Earbuds, charging case, USB-C cable, three sizes of ear tips.',
    colours: [BLACK, WHITE],
  },
  {
    id: 'buds-lite',
    handle: 'wireless-earbuds-lite',
    title: 'Wireless earbuds Lite',
    type: 'earbuds',
    priceInr: 999,
    regularInr: 1999,
    short: '30 h playback, low-latency game mode',
    description:
      'Light everyday earbuds with a game mode that cuts audio delay for videos and mobile games. Tap controls on each bud, and they reconnect to your phone as soon as you open the case.',
    features: ['Up to 30 h with the case', 'Low-latency game mode', 'Auto-connect on opening'],
    specs: [
      { label: 'Playback', value: 'Up to 6 h per charge, 30 h with the case' },
      { label: 'Bluetooth', value: '5.3' },
      { label: 'Latency', value: 'Game mode for lower audio delay' },
      { label: 'Water resistance', value: 'IPX4 (sweat)' },
      { label: 'Charging', value: 'USB-C' },
    ],
    inBox: 'Earbuds, charging case, USB-C cable, spare ear tips.',
    colours: [BLACK, WHITE, BLUE],
  },
  {
    id: 'neck-pro',
    handle: 'neckband-pro',
    title: 'Neckband Pro',
    type: 'neckband',
    priceInr: 1299,
    regularInr: 2499,
    short: 'Clear calls, 40 h, 10 min charge for 10 h',
    description:
      'A flexible neckband that sits comfortably all day, with call noise reduction for busy streets and magnetic earbuds that clip together when you are not listening. Ten minutes on the charger gives a full day of commuting.',
    features: ['Up to 40 h playback', '10 min charge for 10 h', 'Magnetic earbuds'],
    specs: [
      { label: 'Playback', value: 'Up to 40 h' },
      { label: 'Fast charge', value: '10 min for up to 10 h' },
      { label: 'Calls', value: 'Environmental noise cancellation (ENC) mic' },
      { label: 'Bluetooth', value: '5.3, dual pairing' },
      { label: 'Water resistance', value: 'IPX5' },
    ],
    inBox: 'Neckband, USB-C cable, spare ear tips.',
    colours: [BLACK, BLUE],
  },
  {
    id: 'neck-basic',
    handle: 'neckband',
    title: 'Neckband',
    type: 'neckband',
    priceInr: 799,
    regularInr: 1499,
    short: '24 h playback, light and flexible',
    description:
      'A light, simple neckband for music and calls, with buttons you can find without looking and a flexible band that packs into a pocket.',
    features: ['Up to 24 h playback', 'Physical buttons', 'Flexible, pocketable band'],
    specs: [
      { label: 'Playback', value: 'Up to 24 h' },
      { label: 'Bluetooth', value: '5.3' },
      { label: 'Water resistance', value: 'IPX4' },
      { label: 'Charging', value: 'USB-C' },
    ],
    inBox: 'Neckband, USB-C cable.',
    colours: [BLACK, GREEN],
  },
  {
    id: 'spk-mini',
    handle: 'pocket-bluetooth-speaker',
    title: 'Pocket speaker',
    type: 'speaker',
    priceInr: 1199,
    regularInr: 2199,
    short: '5 W, 12 h, waterproof, with a strap',
    description:
      'A small, waterproof speaker with a strap for bags and bikes. Loud enough for a room, and two of them pair together for stereo.',
    features: ['5 W sound, 12 h playback', 'IPX7 waterproof', 'Pairs two for stereo'],
    specs: [
      { label: 'Output', value: '5 W' },
      { label: 'Playback', value: 'Up to 12 h' },
      { label: 'Water resistance', value: 'IPX7 (splashes and dunks)' },
      { label: 'Bluetooth', value: '5.3, stereo pairing (TWS)' },
      { label: 'Charging', value: 'USB-C' },
    ],
    inBox: 'Speaker, strap, USB-C cable.',
    colours: [BLACK, BLUE, RED],
  },
  {
    id: 'spk-party',
    handle: 'party-bluetooth-speaker',
    title: 'Party speaker',
    type: 'speaker',
    priceInr: 2999,
    regularInr: 5999,
    short: '20 W with deep bass and light ring',
    description:
      'A 20 W speaker with a passive bass radiator for fuller sound and a light ring that follows the beat. Fifteen hours of playback covers a long evening, and it charges your phone in a pinch.',
    features: ['20 W with bass radiator', 'Up to 15 h playback', 'Light ring, stereo pairing'],
    specs: [
      { label: 'Output', value: '20 W with passive bass radiator' },
      { label: 'Playback', value: 'Up to 15 h' },
      { label: 'Water resistance', value: 'IPX5' },
      { label: 'Bluetooth', value: '5.3, stereo pairing (TWS)' },
      { label: 'Extras', value: 'Light ring, power-bank out over USB' },
    ],
    inBox: 'Speaker, USB-C cable, AUX cable.',
    colours: [BLACK],
  },
];
