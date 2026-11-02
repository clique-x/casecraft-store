/**
 * Gadgets sold alongside the covers: wireless audio, chargers and data cables. None of them is cut
 * for one phone, so each comes in options (colours, or cable lengths) instead of phone models.
 * PLACEHOLDER CONTENT: names, specs and prices are examples to replace with the real stock.
 */

export type Department = 'audio' | 'charging';
export type GadgetType = 'earbuds' | 'neckband' | 'speaker' | 'charger' | 'car-charger' | 'cable';

export interface GadgetOption {
  slug: string;
  name: string;
  /** Product art colour (hex is allowed in product content). */
  hex: string;
  /** Price for this option when it differs from the product's (a longer cable). */
  priceInr?: number;
  regularInr?: number;
}

export interface GadgetEntry {
  id: string;
  handle: string;
  title: string;
  type: GadgetType;
  priceInr: number;
  regularInr: number;
  short: string;
  description: string;
  features: [string, string, string];
  /** Key specs, shown as a list on the product page. */
  specs: readonly { label: string; value: string }[];
  inBox: string;
  /** What the options are: colour swatches, or cable lengths as buttons. */
  optionKind: 'colour' | 'length';
  options: readonly GadgetOption[];
  /**
   * Made by the phone brand itself and sold sealed. Only set this for stock bought from the brand or
   * its authorised distributor, with a GST invoice; it shows an "Original <brand>" badge.
   */
  original?: { brand: string };
  /** Cables: the connector at the phone end, to say whether it fits the visitor's phone. */
  phoneEnd?: 'usb-c' | 'lightning';
  /** Cables: the connector at the charger end (USB-C unless set). */
  hostEnd?: 'usb-c' | 'usb-a';
  /** Chargers: ports on the face, left to right. */
  ports?: readonly ('usb-c' | 'usb-a')[];
  /** Chargers and cables: phone brands it fast-charges at full speed. */
  fastFor?: readonly string[];
}

export const GADGET_TYPE_LABEL: Record<GadgetType, string> = {
  earbuds: 'Wireless earbuds',
  neckband: 'Neckband',
  speaker: 'Bluetooth speaker',
  charger: 'Charger',
  'car-charger': 'Car charger',
  cable: 'Data cable',
};

export const DEPARTMENT_OF: Record<GadgetType, Department> = {
  earbuds: 'audio',
  neckband: 'audio',
  speaker: 'audio',
  charger: 'charging',
  'car-charger': 'charging',
  cable: 'charging',
};

export interface DepartmentInfo {
  path: string;
  /** Breadcrumb and nav name. */
  name: string;
  title: string;
  intro: string;
  sections: readonly { id: string; types: readonly GadgetType[]; heading: string; intro: string }[];
}

export const DEPARTMENTS: Record<Department, DepartmentInfo> = {
  audio: {
    path: '/audio',
    name: 'Audio',
    title: 'Wireless audio',
    intro: 'Earbuds, neckbands and speakers that work with any phone. Pick a colour on the product page.',
    sections: [
      { id: 'earbuds', types: ['earbuds'], heading: 'Wireless earbuds', intro: 'True wireless, with a charging case. Pairs with Android and iPhone.' },
      { id: 'neckband', types: ['neckband'], heading: 'Neckbands', intro: 'All-day battery and clear calls, always round your neck.' },
      { id: 'speaker', types: ['speaker'], heading: 'Bluetooth speakers', intro: 'From pocket-size to party-size.' },
    ],
  },
  charging: {
    path: '/charging',
    name: 'Chargers & cables',
    title: 'Chargers and data cables',
    intro: 'Fast chargers and original brand cables. Pick your phone and each product says whether it fits and fast-charges it.',
    sections: [
      { id: 'chargers', types: ['charger', 'car-charger'], heading: 'Chargers', intro: 'USB-C fast chargers for the wall and the car. Cables are sold separately.' },
      { id: 'cables', types: ['cable'], heading: 'Data cables', intro: 'Original cables from the phone brands, sealed, plus our braided cables in two lengths.' },
    ],
  },
};

const BLACK: GadgetOption = { slug: 'black', name: 'Black', hex: '#1f2023' };
const WHITE: GadgetOption = { slug: 'white', name: 'White', hex: '#eeeeea' };
const BLUE: GadgetOption = { slug: 'blue', name: 'Blue', hex: '#2f4a6d' };
const GREEN: GadgetOption = { slug: 'green', name: 'Green', hex: '#3d5a48' };
const RED: GadgetOption = { slug: 'red', name: 'Red', hex: '#a3302b' };
/** Cable lengths; the hex is the cable's colour in the art. */
const length = (metres: 1 | 2, hex: string, priceInr?: number, regularInr?: number): GadgetOption => ({
  slug: `${metres}m`,
  name: `${metres} m`,
  hex,
  ...(priceInr !== undefined ? { priceInr } : {}),
  ...(regularInr !== undefined ? { regularInr } : {}),
});

/** Phone brands whose own fast charging runs over USB-C Power Delivery (PD) or PPS. */
const PD_BRANDS = ['Apple', 'Google', 'Nothing'] as const;
const PPS_BRANDS = ['Apple', 'Samsung', 'Google', 'Nothing'] as const;

const AUDIO: readonly GadgetEntry[] = [
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
    optionKind: 'colour',
    options: [BLACK, WHITE],
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
    optionKind: 'colour',
    options: [BLACK, WHITE, BLUE],
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
    optionKind: 'colour',
    options: [BLACK, BLUE],
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
    optionKind: 'colour',
    options: [BLACK, GREEN],
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
    optionKind: 'colour',
    options: [BLACK, BLUE, RED],
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
    optionKind: 'colour',
    options: [BLACK],
  },
];

const CHARGING: readonly GadgetEntry[] = [
  {
    id: 'chg-20w',
    handle: '20w-usb-c-fast-charger',
    title: '20 W USB-C fast charger',
    type: 'charger',
    priceInr: 599,
    regularInr: 1199,
    short: 'USB-C Power Delivery, 0 to 50% in about 30 min on iPhone',
    description:
      'A compact 20 W USB-C wall charger with Power Delivery, the fast-charging standard iPhone, Pixel and Nothing phones use. It charges any USB-C phone, and cuts power if it gets too hot or sees a surge.',
    features: ['20 W USB-C Power Delivery', 'Compact, two-pin Indian plug', 'Surge and temperature protection'],
    specs: [
      { label: 'Output', value: '20 W, USB-C Power Delivery 3.0' },
      { label: 'Port', value: '1 × USB-C' },
      { label: 'Input', value: '100–240 V AC, 50/60 Hz' },
      { label: 'Fast charges', value: 'iPhone 8 and newer, Pixel, Nothing, and other USB-C PD phones' },
      { label: 'Protection', value: 'Over-voltage, over-current, short-circuit and temperature' },
    ],
    inBox: 'Charger. Cable sold separately.',
    optionKind: 'colour',
    options: [WHITE, BLACK],
    ports: ['usb-c'],
    fastFor: PD_BRANDS,
  },
  {
    id: 'chg-33w-dual',
    handle: '33w-dual-port-charger',
    title: '33 W dual-port charger',
    type: 'charger',
    priceInr: 899,
    regularInr: 1799,
    short: 'USB-C and USB-A: a phone and earbuds together',
    description:
      'One plug, two ports: USB-C for your phone and USB-A for earbuds, a watch or an older cable. It shares 33 W between them and works with almost any phone.',
    features: ['33 W across USB-C and USB-A', 'Charges two devices at once', 'Surge and temperature protection'],
    specs: [
      { label: 'Output', value: '33 W max; USB-C PD 30 W, USB-A QC 18 W' },
      { label: 'Ports', value: '1 × USB-C, 1 × USB-A' },
      { label: 'Input', value: '100–240 V AC, 50/60 Hz' },
      { label: 'Protection', value: 'Over-voltage, over-current, short-circuit and temperature' },
    ],
    inBox: 'Charger. Cable sold separately.',
    optionKind: 'colour',
    options: [WHITE],
    ports: ['usb-c', 'usb-a'],
    fastFor: PD_BRANDS,
  },
  {
    id: 'chg-45w-pps',
    handle: '45w-pps-fast-charger',
    title: '45 W PPS fast charger',
    type: 'charger',
    priceInr: 1299,
    regularInr: 2499,
    short: 'PPS for full speed on Galaxy phones, PD for iPhone and Pixel',
    description:
      'A 45 W USB-C charger with PPS, the variable-voltage fast charging that Samsung Galaxy phones need for their top speed. It also speaks Power Delivery, so it fast-charges iPhone, Pixel and Nothing phones and powers a tablet.',
    features: ['45 W USB-C with PPS and PD', 'Full speed on Galaxy phones', 'Charges tablets too'],
    specs: [
      { label: 'Output', value: '45 W, USB-C PD 3.0 with PPS (3.3–21 V)' },
      { label: 'Port', value: '1 × USB-C' },
      { label: 'Input', value: '100–240 V AC, 50/60 Hz' },
      { label: 'Fast charges', value: 'Samsung Galaxy (25 W and 45 W models), iPhone, Pixel, Nothing' },
      { label: 'Protection', value: 'Over-voltage, over-current, short-circuit and temperature' },
    ],
    inBox: 'Charger. Cable sold separately; use a 5 A USB-C cable for 45 W.',
    optionKind: 'colour',
    options: [BLACK, WHITE],
    ports: ['usb-c'],
    fastFor: PPS_BRANDS,
  },
  {
    id: 'chg-65w-gan',
    handle: '65w-gan-charger-3-port',
    title: '65 W GaN charger, 3 ports',
    type: 'charger',
    priceInr: 1999,
    regularInr: 3999,
    short: 'Phone, tablet and laptop from one small plug',
    description:
      'Gallium nitride (GaN) parts keep this 65 W charger about the size of a phone charger. Two USB-C ports and one USB-A share the power, enough for a laptop and a phone at the same time.',
    features: ['65 W GaN, pocket size', 'Two USB-C and one USB-A', 'Charges a laptop and a phone together'],
    specs: [
      { label: 'Output', value: '65 W max; single USB-C up to 65 W PD with PPS' },
      { label: 'Ports', value: '2 × USB-C, 1 × USB-A' },
      { label: 'Input', value: '100–240 V AC, 50/60 Hz' },
      { label: 'Fast charges', value: 'iPhone, Samsung Galaxy, Pixel, Nothing, USB-C laptops' },
      { label: 'Protection', value: 'Over-voltage, over-current, short-circuit and temperature' },
    ],
    inBox: 'Charger. Cable sold separately.',
    optionKind: 'colour',
    options: [BLACK, WHITE],
    ports: ['usb-c', 'usb-c', 'usb-a'],
    fastFor: PPS_BRANDS,
  },
  {
    id: 'chg-car-38w',
    handle: 'car-charger-38w',
    title: 'Car charger 38 W',
    type: 'car-charger',
    priceInr: 699,
    regularInr: 1299,
    short: 'USB-C 20 W and USB-A 18 W, fits any 12 V socket',
    description:
      'A small metal car charger that sits almost flush in the 12/24 V socket. USB-C fast-charges your phone on the way while USB-A looks after a passenger’s phone.',
    features: ['USB-C 20 W PD plus USB-A 18 W', 'Sits almost flush in the socket', 'Works in 12 V and 24 V vehicles'],
    specs: [
      { label: 'Output', value: '38 W max; USB-C PD 20 W, USB-A QC 18 W' },
      { label: 'Ports', value: '1 × USB-C, 1 × USB-A' },
      { label: 'Input', value: '12–24 V DC (car and truck sockets)' },
      { label: 'Protection', value: 'Over-voltage, over-current, short-circuit and temperature' },
    ],
    inBox: 'Car charger. Cable sold separately.',
    optionKind: 'colour',
    options: [BLACK],
    ports: ['usb-c', 'usb-a'],
    fastFor: PD_BRANDS,
  },
  {
    id: 'cab-apple-c',
    handle: 'original-apple-usb-c-cable',
    title: 'Original Apple USB-C to USB-C cable',
    type: 'cable',
    priceInr: 1900,
    regularInr: 1900,
    short: 'Apple woven charge cable, 1 m, for iPhone 15 and newer',
    description:
      'Apple’s own woven USB-C charge cable, sealed in its retail box. It fast-charges iPhone 15 and newer with a 20 W or higher USB-C charger, and syncs with a Mac or PC.',
    features: ['Made by Apple, sealed box', 'Woven, 1 m', 'Fast charging up to 60 W'],
    specs: [
      { label: 'Connectors', value: 'USB-C to USB-C' },
      { label: 'Length', value: '1 m' },
      { label: 'Power', value: 'Up to 60 W' },
      { label: 'Fits', value: 'iPhone 15 and newer, iPad and Mac with USB-C' },
      { label: 'Warranty', value: 'Apple’s warranty, with our GST invoice' },
    ],
    inBox: 'Apple USB-C charge cable (1 m), in Apple’s sealed box.',
    optionKind: 'length',
    options: [length(1, '#eeeeea')],
    original: { brand: 'Apple' },
    phoneEnd: 'usb-c',
    fastFor: ['Apple'],
  },
  {
    id: 'cab-apple-l',
    handle: 'original-apple-usb-c-to-lightning-cable',
    title: 'Original Apple USB-C to Lightning cable',
    type: 'cable',
    priceInr: 1900,
    regularInr: 1900,
    short: 'For iPhone 14 and older, 1 m',
    description:
      'Apple’s own USB-C to Lightning cable, sealed in its retail box. With a 20 W USB-C charger it fast-charges iPhone 8 to iPhone 14 to 50% in about 30 minutes.',
    features: ['Made by Apple, sealed box', 'Fast charging with a 20 W charger', '1 m'],
    specs: [
      { label: 'Connectors', value: 'USB-C to Lightning' },
      { label: 'Length', value: '1 m' },
      { label: 'Fits', value: 'iPhone 5 to iPhone 14, AirPods with Lightning' },
      { label: 'Warranty', value: 'Apple’s warranty, with our GST invoice' },
    ],
    inBox: 'Apple USB-C to Lightning cable (1 m), in Apple’s sealed box.',
    optionKind: 'length',
    options: [length(1, '#eeeeea')],
    original: { brand: 'Apple' },
    phoneEnd: 'lightning',
    fastFor: ['Apple'],
  },
  {
    id: 'cab-samsung',
    handle: 'original-samsung-usb-c-cable',
    title: 'Original Samsung USB-C cable 3 A',
    type: 'cable',
    priceInr: 799,
    regularInr: 799,
    short: 'Samsung’s own 25 W cable, 1 m',
    description:
      'Samsung’s own USB-C to USB-C cable, sealed. Rated for 3 A, it carries 25 W fast charging to Galaxy phones from a PPS charger.',
    features: ['Made by Samsung, sealed', '25 W fast charging on Galaxy', '1 m'],
    specs: [
      { label: 'Connectors', value: 'USB-C to USB-C' },
      { label: 'Length', value: '1 m' },
      { label: 'Current', value: '3 A (up to 25 W on Galaxy)' },
      { label: 'Fits', value: 'Galaxy phones and any USB-C phone' },
      { label: 'Warranty', value: 'Samsung’s warranty, with our GST invoice' },
    ],
    inBox: 'Samsung USB-C cable (1 m), sealed.',
    optionKind: 'colour',
    options: [WHITE, BLACK],
    original: { brand: 'Samsung' },
    phoneEnd: 'usb-c',
    fastFor: ['Samsung'],
  },
  {
    id: 'cab-oneplus',
    handle: 'original-oneplus-supervooc-cable',
    title: 'Original OnePlus SUPERVOOC cable',
    type: 'cable',
    priceInr: 699,
    regularInr: 699,
    short: 'USB-A to USB-C, for SUPERVOOC speed with a OnePlus charger',
    description:
      'OnePlus’s own SUPERVOOC cable, sealed. SUPERVOOC needs the brand’s cable and charger together; with them, a OnePlus phone charges at its full rated speed. It also charges any USB-C phone normally.',
    features: ['Made by OnePlus, sealed', 'Full SUPERVOOC speed with a OnePlus charger', '1 m'],
    specs: [
      { label: 'Connectors', value: 'USB-A to USB-C' },
      { label: 'Length', value: '1 m' },
      { label: 'Fits', value: 'OnePlus phones and any USB-C phone' },
      { label: 'Warranty', value: 'OnePlus warranty, with our GST invoice' },
    ],
    inBox: 'OnePlus SUPERVOOC cable (1 m), sealed.',
    optionKind: 'length',
    options: [length(1, '#eeeeea')],
    original: { brand: 'OnePlus' },
    phoneEnd: 'usb-c',
    hostEnd: 'usb-a',
    fastFor: ['OnePlus'],
  },
  {
    id: 'cab-braid-c',
    handle: 'braided-usb-c-cable-60w',
    title: 'Braided USB-C to USB-C cable 60 W',
    type: 'cable',
    priceInr: 399,
    regularInr: 799,
    short: 'Nylon braided, 60 W, in 1 m or 2 m',
    description:
      'Our everyday USB-C cable with a nylon braid and strain relief at both ends, so it survives bags and bedside tables. 60 W covers fast charging on every USB-C phone and most laptops.',
    features: ['Nylon braid, tested to 10,000 bends', 'Fast charging up to 60 W', '1 m or 2 m'],
    specs: [
      { label: 'Connectors', value: 'USB-C to USB-C' },
      { label: 'Power', value: 'Up to 60 W (3 A)' },
      { label: 'Data', value: 'USB 2.0, 480 Mbps' },
      { label: 'Fits', value: 'Every USB-C phone, iPhone 15 and newer' },
    ],
    inBox: 'Braided USB-C cable with a strap.',
    optionKind: 'length',
    options: [length(1, '#2b2c30'), length(2, '#2b2c30', 499, 999)],
    phoneEnd: 'usb-c',
  },
  {
    id: 'cab-braid-l',
    handle: 'braided-usb-c-to-lightning-cable',
    title: 'Braided USB-C to Lightning cable',
    type: 'cable',
    priceInr: 449,
    regularInr: 899,
    short: 'For iPhone 14 and older, 20 W fast charging, 1 m or 2 m',
    description:
      'A braided USB-C to Lightning cable for iPhone 14 and older. With a 20 W USB-C charger it fast-charges as quickly as the cable in Apple’s box.',
    features: ['Nylon braid, tested to 10,000 bends', '20 W fast charging for iPhone', '1 m or 2 m'],
    specs: [
      { label: 'Connectors', value: 'USB-C to Lightning' },
      { label: 'Power', value: 'Up to 20 W fast charging' },
      { label: 'Fits', value: 'iPhone 5 to iPhone 14' },
    ],
    inBox: 'Braided USB-C to Lightning cable with a strap.',
    optionKind: 'length',
    options: [length(1, '#eeeeea'), length(2, '#eeeeea', 549, 1099)],
    phoneEnd: 'lightning',
    fastFor: ['Apple'],
  },
];

export const GADGETS: readonly GadgetEntry[] = [...AUDIO, ...CHARGING];

/** Price of one option, falling back to the product's. */
export function optionPrice(entry: GadgetEntry, option: GadgetOption): { priceInr: number; regularInr: number } {
  return { priceInr: option.priceInr ?? entry.priceInr, regularInr: option.regularInr ?? entry.regularInr };
}
