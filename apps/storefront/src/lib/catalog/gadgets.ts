/**
 * Gadgets sold alongside the covers: wireless audio, chargers and data cables. None of them is cut
 * for one phone, so each comes in options (colours, or cable lengths) instead of phone models.
 *
 * Audio is the shop's real stock: sealed boAt and realme earbuds and neckbands, with the brand's
 * own product images (see `photos`; realme T200 family from its Flipkart listings). The charging department has no
 * products yet; its types stay for when real chargers and cables are photographed.
 *
 * PRICES: `priceInr` is the shop's sticker where one was photographed (Airdopes Alpha Gen 2,
 * realme Buds T200x); otherwise it is the brand's own online price on 2 Nov 2026, and
 * `regularInr` is the printed MRP. Where the MRP is not known the two are equal, so no discount
 * is shown. Change them here; the backend catalogue is regenerated with `pnpm catalog:export`.
 */

import { CAMERAS, SPEAKERS, STORAGE } from './gadget-ranges';

export type Department = 'audio' | 'charging' | 'storage' | 'cameras';
export type GadgetType =
  | 'earbuds'
  | 'neckband'
  | 'speaker'
  | 'charger'
  | 'car-charger'
  | 'cable'
  | 'pen-drive'
  | 'memory-card'
  | 'ssd'
  | 'ram'
  | 'enclosure'
  | 'otg'
  | 'camera';

/** What a product's options are: colour swatches, or buttons for cable length, capacity, camera resolution or model. */
export type OptionKind = 'colour' | 'length' | 'capacity' | 'resolution' | 'model';

export const OPTION_LABEL: Record<OptionKind, string> = {
  colour: 'Colour',
  length: 'Length',
  capacity: 'Capacity',
  resolution: 'Resolution',
  model: 'Model',
};

/** Dispatch time for options the shop orders in after the sale instead of keeping on the shelf. */
export const ORDER_IN_WINDOW = '3–5 days';

export interface GadgetOption {
  slug: string;
  name: string;
  /** Product art colour (hex is allowed in product content). */
  hex: string;
  /** Price for this option when it differs from the product's (a longer cable). */
  priceInr?: number;
  regularInr?: number;
  /** Not on the shelf: the shop orders it in after the sale, so it ships in ORDER_IN_WINDOW. */
  orderIn?: boolean;
}

/** Official product images, written by scripts/photo-gadgets.mjs under /products/photos/gadgets/<id>/. */
export interface GadgetPhotos {
  /** Folder name; the gadget id unless the images are shared. */
  id: string;
  /** One caption per image in display order; image n is g-<n>-<w>.webp (square) and card-<n>-<w>.webp (4:5). */
  gallery: readonly string[];
  /** Gallery index shown on the card and stage for an option slug; 0 when the option has none. */
  heroByOption?: Readonly<Record<string, number>>;
  /** The first image lifted off its backdrop (cut-480/960.webp, transparent), with its pixel size. */
  cut?: { w: number; h: number };
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
  /** What the options are: colour swatches, or lengths, capacities or resolutions as buttons. */
  optionKind: OptionKind;
  options: readonly GadgetOption[];
  /**
   * Made by the phone brand itself and sold sealed. Only set this for stock bought from the brand or
   * its authorised distributor, with a GST invoice; it shows an "Original <brand>" badge.
   */
  original?: { brand: string };
  /** The maker's warranty, claimed at the brand's authorised service centres with our GST invoice. */
  warrantyMonths?: number;
  /** Official product images; the drawn GadgetArt is used when absent. */
  photos?: GadgetPhotos;
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
  'pen-drive': 'Pen drive',
  'memory-card': 'Memory card',
  ssd: 'SSD',
  ram: 'RAM',
  enclosure: 'Drive case',
  otg: 'OTG adapter',
  camera: 'Wi-Fi camera',
};

export const DEPARTMENT_OF: Record<GadgetType, Department> = {
  earbuds: 'audio',
  neckband: 'audio',
  speaker: 'audio',
  charger: 'charging',
  'car-charger': 'charging',
  cable: 'charging',
  'pen-drive': 'storage',
  'memory-card': 'storage',
  ssd: 'storage',
  ram: 'storage',
  enclosure: 'storage',
  otg: 'storage',
  camera: 'cameras',
};

export interface DepartmentInfo {
  path: string;
  /** Breadcrumb and nav name. */
  name: string;
  title: string;
  intro: string;
  /** The promise in the listing header's badge. */
  badge: string;
  sections: readonly { id: string; types: readonly GadgetType[]; heading: string; intro: string }[];
}

export const DEPARTMENTS: Record<Department, DepartmentInfo> = {
  audio: {
    path: '/audio',
    name: 'Audio',
    title: 'boAt and realme earbuds, neckbands and speakers',
    badge: 'Sealed, brand warranty',
    intro: 'Sealed boAt and realme earbuds, neckbands and speakers with the brand warranty. They pair with any phone; pick a colour on the product page.',
    sections: [
      { id: 'earbuds', types: ['earbuds'], heading: 'Earbuds', intro: 'True wireless, with a charging case. Pairs with Android and iPhone.' },
      { id: 'neckband', types: ['neckband'], heading: 'Neckbands', intro: 'All-day battery and clear calls, always round your neck.' },
      { id: 'speakers', types: ['speaker'], heading: 'Bluetooth speakers', intro: 'Portable boAt speakers with big bass, TWS pairing and a splash-proof body.' },
    ],
  },
  charging: {
    path: '/charging',
    name: 'Chargers & cables',
    title: 'Chargers and data cables',
    badge: 'Sealed, brand warranty',
    intro: 'Fast chargers and original brand cables. Pick your phone and each product says whether it fits and fast-charges it.',
    sections: [
      { id: 'chargers', types: ['charger', 'car-charger'], heading: 'Chargers', intro: 'USB-C fast chargers for the wall and the car. Cables are sold separately.' },
      { id: 'cables', types: ['cable'], heading: 'Data cables', intro: 'Original cables from the phone brands, sealed, plus our braided cables in two lengths.' },
    ],
  },
  storage: {
    path: '/storage',
    name: 'Storage',
    title: 'Memory cards, pen drives, SSDs and RAM',
    badge: 'Brand warranty',
    intro: `Pen drives, microSD cards, SSDs and RAM from SanDisk, Samsung, WD and Consistent. Pick the capacity on the product page; sizes we order in for you ship in ${ORDER_IN_WINDOW}.`,
    sections: [
      { id: 'cards', types: ['memory-card', 'pen-drive'], heading: 'Memory cards and pen drives', intro: 'microSD cards for phones, cameras and dashcams, and USB pen drives.' },
      { id: 'ssd', types: ['ssd'], heading: 'SSDs', intro: '2.5-inch SATA and M.2 NVMe drives to speed up a laptop or desktop.' },
      { id: 'ram', types: ['ram'], heading: 'RAM', intro: 'Samsung and SK hynix memory for laptops and desktops, listed by brand with photos of that brand’s module and label. Check your machine takes the same type before you order.' },
      { id: 'adapters', types: ['enclosure', 'otg'], heading: 'Drive cases and adapters', intro: 'Turn a spare SSD into a portable drive, or plug a pen drive into your phone.' },
    ],
  },
  cameras: {
    path: '/cameras',
    name: 'Cameras',
    title: 'CP Plus Wi-Fi security cameras',
    badge: 'Sealed, brand warranty',
    intro: 'CP Plus pan-and-tilt Wi-Fi cameras for the home and shop, with night vision, two-way talk and the ezyKam+ app.',
    sections: [{ id: 'wifi', types: ['camera'], heading: 'Wi-Fi cameras', intro: 'Plug in, connect to 2.4 GHz Wi-Fi, and watch live from your phone.' }],
  },
};

/** boAt and realme give one year on earbuds and neckbands, through their service centres. */
const ONE_YEAR = 12;
const BOAT = { brand: 'boAt' } as const;
const REALME = { brand: 'realme' } as const;
const SEALED_BUDS = 'Earbuds, charging case, USB-C charging cable, spare ear tips and the user guide, in the sealed brand box.';
const SEALED_NECKBAND = 'Neckband, USB-C charging cable, spare ear tips and the user guide, in the sealed brand box.';

/** Real stock, photographed in the shop on 2 Nov 2026. Each colour is a variant; stock lives in Medusa. */
const AUDIO: readonly GadgetEntry[] = [
  {
    id: 'boat-alpha-gen2',
    handle: 'boat-airdopes-alpha-gen-2',
    title: 'boAt Airdopes Alpha Gen 2',
    type: 'earbuds',
    priceInr: 1400,
    regularInr: 3990,
    short: '45 h playback, quad mics, 50 ms BEAST mode',
    description:
      'The second-generation Airdopes Alpha: a stem-style earbud with a 45-hour total playtime, four mics with ENx noise reduction for calls, and a 50 ms BEAST mode for games and video. The 13 mm drivers carry boAt’s signature bass, Bluetooth 5.4 holds a steady link, and IWP pairs the buds the moment the lid opens. Ten minutes on the charger buys two and a half hours of music.',
    features: ['Up to 45 h with the case', 'Quad mics with ENx for calls', '10 min charge for 150 min'],
    specs: [
      { label: 'Playback', value: 'Up to 45 h with the case' },
      { label: 'Drivers', value: '13 mm, boAt Signature Sound' },
      { label: 'Calls', value: 'Quad mics with ENx noise reduction' },
      { label: 'Latency', value: 'BEAST mode, 50 ms' },
      { label: 'Bluetooth', value: '5.4, IWP instant pairing' },
      { label: 'Water resistance', value: 'IPX5 sweat and splash' },
      { label: 'Charging', value: 'USB-C; ASAP charge, 10 min for 150 min' },
      { label: 'Warranty', value: '1 year from boAt, with our GST invoice' },
    ],
    inBox: SEALED_BUDS,
    optionKind: 'colour',
    options: [
      { slug: 'midnight-black', name: 'Midnight Black', hex: '#1c1d21' },
      { slug: 'ocean-blue', name: 'Ocean Blue', hex: '#2a3a68' },
    ],
    original: BOAT,
    warrantyMonths: ONE_YEAR,
    photos: {
      id: 'boat-alpha-gen2',
      cut: { w: 872, h: 1293 },
      gallery: ['Midnight Black', 'Ocean Blue', 'boAt Signature Sound', 'Features', '45 hours of playback', 'Quad mics with ENx', 'ASAP charge'],
      heroByOption: { 'midnight-black': 0, 'ocean-blue': 1 },
    },
  },
  {
    id: 'boat-alpha',
    handle: 'boat-airdopes-alpha',
    title: 'boAt Airdopes Alpha',
    type: 'earbuds',
    priceInr: 799,
    regularInr: 3490,
    short: '35 h playback, dual mics with ENx, 13 mm drivers',
    description:
      'A light stem-style earbud with 35 hours of total playtime and boAt Signature Sound from 13 mm drivers. Dual mics with ENx keep your voice clear on calls, BEAST mode drops latency to 50 ms for games, and IWP connects the buds as soon as the case opens. Ten minutes of ASAP charge gives two hours of playback.',
    features: ['Up to 35 h with the case', 'Dual mics with ENx for calls', '10 min charge for 120 min'],
    specs: [
      { label: 'Playback', value: 'Up to 35 h with the case' },
      { label: 'Drivers', value: '13 mm, boAt Signature Sound' },
      { label: 'Calls', value: 'Dual mics with ENx noise reduction' },
      { label: 'Latency', value: 'BEAST mode, 50 ms' },
      { label: 'Bluetooth', value: '5.3, IWP instant pairing' },
      { label: 'Water resistance', value: 'IPX5 sweat and splash' },
      { label: 'Charging', value: 'USB-C; ASAP charge, 10 min for 120 min' },
      { label: 'Warranty', value: '1 year from boAt, with our GST invoice' },
    ],
    inBox: SEALED_BUDS,
    optionKind: 'colour',
    options: [
      { slug: 'deep-blue', name: 'Deep Blue', hex: '#26365e' },
      { slug: 'pine-green', name: 'Pine Green', hex: '#2f4a3c' },
    ],
    original: BOAT,
    warrantyMonths: ONE_YEAR,
    photos: {
      id: 'boat-alpha',
      gallery: ['Deep Blue', 'Pine Green', '35 hours of playback', '13 mm drivers', 'BEAST mode low latency', 'ENx clear calls', 'Features'],
      heroByOption: { 'deep-blue': 0, 'pine-green': 1 },
    },
  },
  {
    id: 'boat-161',
    handle: 'boat-airdopes-161-metallic',
    title: 'boAt Airdopes 161 Metallic',
    type: 'earbuds',
    priceInr: 799,
    regularInr: 2490,
    short: '50 h playback, metallic case, dual EQ',
    description:
      'The metallic edition of boAt’s long-running Airdopes 161: a brushed-finish case with 50 hours of total playtime and 13 mm drivers. Dual EQ switches between Signature and Balanced sound, BEAST mode keeps games at 50 ms, and IWP pairs the buds when the lid opens. Ten minutes of ASAP charge gives two hours of music.',
    features: ['Up to 50 h with the case', 'Dual EQ: Signature and Balanced', '10 min charge for 120 min'],
    specs: [
      { label: 'Playback', value: 'Up to 50 h with the case' },
      { label: 'Drivers', value: '13 mm, boAt Signature Sound' },
      { label: 'Sound modes', value: 'Dual EQ, Signature and Balanced' },
      { label: 'Latency', value: 'BEAST mode, 50 ms' },
      { label: 'Bluetooth', value: '5.3, IWP instant pairing' },
      { label: 'Water resistance', value: 'IPX4 sweat and splash' },
      { label: 'Charging', value: 'USB-C; ASAP charge, 10 min for 120 min' },
      { label: 'Warranty', value: '1 year from boAt, with our GST invoice' },
    ],
    inBox: SEALED_BUDS,
    optionKind: 'colour',
    options: [
      { slug: 'carbon-black', name: 'Carbon Black', hex: '#2a2b2f' },
      { slug: 'ash-grey', name: 'Ash Grey', hex: '#b9bbbd' },
    ],
    original: BOAT,
    warrantyMonths: ONE_YEAR,
    photos: {
      id: 'boat-161',
      gallery: ['Carbon Black', 'Ash Grey', '50 hours of playback', 'ASAP charge', 'ENx clear calls', 'IPX4 sweat and splash resistance', 'BEAST mode low latency'],
      heroByOption: { 'carbon-black': 0, 'ash-grey': 1 },
    },
  },
  {
    id: 'boat-212',
    handle: 'boat-airdopes-212',
    title: 'boAt Airdopes 212',
    type: 'earbuds',
    priceInr: 899,
    regularInr: 3290,
    short: '50 h playback, translucent lid, 45 ms BEAST mode',
    description:
      'A compact case with a translucent lid and 50 hours of total playtime. Dual mics with ENx handle calls, BEAST mode brings latency down to 45 ms for games and video, and IWP with Bluetooth 5.4 connects the buds as the lid opens. Ten minutes of ASAP charge gives 140 minutes of playback.',
    features: ['Up to 50 h with the case', 'Translucent lid', '10 min charge for 140 min'],
    specs: [
      { label: 'Playback', value: 'Up to 50 h with the case' },
      { label: 'Sound', value: 'boAt Signature Sound' },
      { label: 'Calls', value: 'Dual mics with ENx noise reduction' },
      { label: 'Latency', value: 'BEAST mode, 45 ms' },
      { label: 'Bluetooth', value: '5.4, IWP instant pairing' },
      { label: 'Water resistance', value: 'IPX4 sweat and splash' },
      { label: 'Charging', value: 'USB-C; ASAP charge, 10 min for 140 min' },
      { label: 'Warranty', value: '1 year from boAt, with our GST invoice' },
    ],
    inBox: SEALED_BUDS,
    optionKind: 'colour',
    options: [{ slug: 'ivory', name: 'Ivory', hex: '#ecebe6' }],
    original: BOAT,
    warrantyMonths: ONE_YEAR,
    photos: {
      id: 'boat-212',
      gallery: ['Ivory', '50 hours of playback', 'Translucent lid', 'boAt Signature Sound', 'ENx clear calls', 'Features', 'More features'],
    },
  },
  {
    id: 'boat-219',
    handle: 'boat-airdopes-219',
    title: 'boAt Airdopes 219',
    type: 'earbuds',
    priceInr: 999,
    regularInr: 3990,
    short: '40 h playback, quad mics, made in India',
    description:
      'In-ear buds with silicone tips that seal out the street, 40 hours of total playtime and four mics with ENx for calls. The 13 mm drivers carry boAt Signature Sound, BEAST mode keeps games at 45 ms, and IWP with Bluetooth 5.4 pairs the buds when the lid opens. Made in India; ten minutes of ASAP charge gives two hours of music.',
    features: ['Up to 40 h with the case', 'Quad mics with ENx for calls', 'In-ear fit with silicone tips'],
    specs: [
      { label: 'Playback', value: 'Up to 40 h with the case' },
      { label: 'Drivers', value: '13 mm, boAt Signature Sound' },
      { label: 'Calls', value: 'Quad mics with ENx noise reduction' },
      { label: 'Latency', value: 'BEAST mode, 45 ms' },
      { label: 'Bluetooth', value: '5.4, IWP instant pairing' },
      { label: 'Water resistance', value: 'IPX4 sweat and splash' },
      { label: 'Charging', value: 'USB-C; ASAP charge, 10 min for 120 min' },
      { label: 'Warranty', value: '1 year from boAt, with our GST invoice' },
    ],
    inBox: SEALED_BUDS,
    optionKind: 'colour',
    options: [{ slug: 'carbon-black', name: 'Carbon Black', hex: '#232427' }],
    original: BOAT,
    warrantyMonths: ONE_YEAR,
    photos: {
      id: 'boat-219',
      cut: { w: 1346, h: 1423 },
      gallery: ['Carbon Black', 'Four mics with ENx', 'IPX4 and instant pairing', 'BEAST mode low latency', '13 mm drivers', '40 hours of playback', 'Features'],
    },
  },
  {
    id: 'boat-800-hidef',
    handle: 'boat-airdopes-prime-800-hidef',
    title: 'boAt Airdopes Prime 800 HiDef',
    type: 'earbuds',
    priceInr: 1499,
    regularInr: 7490,
    short: 'Hi-Res Audio with LDAC, adaptive EQ, multipoint',
    description:
      'boAt Labs’ Hi-Res earbud: LDAC streams up to 990 kbps from phones that support it, a HiFi DSP core renders 24-bit spatial audio, and Adaptive EQ by Mimi tunes the sound to your hearing profile. Four mics with AI ENx are trained on Indian street noise, Google Fast Pair and in-ear detection handle the everyday, and multipoint keeps the buds on your phone and laptop at once. Forty hours of total playtime; ten minutes of ASAP charge gives 200 minutes.',
    features: ['Hi-Res Audio with LDAC', 'Adaptive EQ by Mimi', 'Multipoint: phone and laptop together'],
    specs: [
      { label: 'Playback', value: 'Up to 40 h with the case' },
      { label: 'Audio', value: 'Hi-Res Audio Wireless, LDAC up to 990 kbps, 24-bit spatial audio' },
      { label: 'Sound modes', value: 'Adaptive EQ by Mimi, boAt Signature Sound' },
      { label: 'Calls', value: '4 mics with AI ENx noise reduction' },
      { label: 'Connectivity', value: 'Multipoint, Google Fast Pair, in-ear detection, 12 m range' },
      { label: 'Water resistance', value: 'Sweat and water resistant' },
      { label: 'Charging', value: 'USB-C; ASAP charge, 10 min for 200 min' },
      { label: 'App', value: 'boAt Hearables app for controls, EQ and firmware updates' },
      { label: 'Warranty', value: '1 year from boAt, with our GST invoice' },
    ],
    inBox: SEALED_BUDS,
    optionKind: 'colour',
    options: [{ slug: 'graphite-grey', name: 'Graphite Grey', hex: '#6d6f74' }],
    original: BOAT,
    warrantyMonths: ONE_YEAR,
    photos: {
      id: 'boat-800-hidef',
      cut: { w: 960, h: 933 },
      gallery: ['Graphite Grey', 'Features', 'Hi-Res Audio with LDAC', 'boAt Signature Sound', 'AI ENx clear calls', 'Multipoint connectivity', '40 hours of playback'],
    },
  },
  {
    id: 'realme-t200',
    handle: 'realme-buds-t200',
    title: 'realme Buds T200',
    type: 'earbuds',
    priceInr: 1999,
    regularInr: 1999,
    short: '32 dB ANC, Hi-Res Audio with LDAC, 50 h playback',
    description:
      'realme’s mid-range earbud with active noise cancellation up to 32 dB, Hi-Res Audio over LDAC and 3D spatial audio. The 12.4 mm dynamic bass driver fills in the low end, total playtime with the case reaches 50 hours, and IP55 covers dust, sweat and rain. Bluetooth 5.4 pairs with Android and iPhone; the realme Link app sets the EQ and the touch controls.',
    features: ['Active noise cancellation up to 32 dB', 'Hi-Res Audio with LDAC', 'Up to 50 h with the case'],
    specs: [
      { label: 'Playback', value: 'Up to 50 h with the case' },
      { label: 'Drivers', value: '12.4 mm dynamic bass driver' },
      { label: 'Noise control', value: 'Active noise cancellation up to 32 dB' },
      { label: 'Audio', value: 'Hi-Res Audio Wireless, LDAC, 3D spatial audio' },
      { label: 'Bluetooth', value: '5.4' },
      { label: 'Water resistance', value: 'IP55 dust and water' },
      { label: 'Charging', value: 'USB-C' },
      { label: 'Warranty', value: '1 year from realme, with our GST invoice' },
    ],
    inBox: SEALED_BUDS,
    optionKind: 'colour',
    options: [
      { slug: 'black', name: 'Black', hex: '#1f2023' },
      { slug: 'white', name: 'White', hex: '#eeeeea' },
    ],
    original: REALME,
    warrantyMonths: ONE_YEAR,
    photos: {
      id: 'realme-t200',
      cut: { w: 1318, h: 1369 },
      gallery: ['Black', 'White', 'Hi-Res certified'],
      heroByOption: { black: 0, white: 1 },
    },
  },
  {
    id: 'realme-t200-lite',
    handle: 'realme-buds-t200-lite',
    title: 'realme Buds T200 Lite',
    type: 'earbuds',
    priceInr: 1399,
    regularInr: 1399,
    short: '48 h playback, AI ENC calls, 12.4 mm driver',
    description:
      'The entry point to realme’s T200 family: a 12.4 mm dynamic bass driver, 48 hours of total playtime with the case and AI environmental noise cancellation on calls. A low-latency game mode keeps audio in step with the screen, Google Fast Pair connects it to an Android phone in one tap, and the buds are IPX4 rated for sweat.',
    features: ['Up to 48 h with the case', 'AI ENC for clear calls', 'Low-latency game mode'],
    specs: [
      { label: 'Playback', value: 'Up to 48 h with the case' },
      { label: 'Drivers', value: '12.4 mm dynamic bass driver' },
      { label: 'Calls', value: 'AI environmental noise cancellation' },
      { label: 'Connectivity', value: 'Bluetooth 5.4, Google Fast Pair' },
      { label: 'Water resistance', value: 'IPX4 sweat and splash' },
      { label: 'Charging', value: 'USB-C' },
      { label: 'Warranty', value: '1 year from realme, with our GST invoice' },
    ],
    inBox: SEALED_BUDS,
    optionKind: 'colour',
    options: [{ slug: 'black', name: 'Black', hex: '#1f2023' }],
    original: REALME,
    warrantyMonths: ONE_YEAR,
    photos: {
      id: 'realme-t200-lite',
      gallery: ['Black', 'Features', '48 hours of playback', '12.4 mm bass driver'],
      heroByOption: { black: 0 },
    },
  },
  {
    id: 'realme-t200x',
    handle: 'realme-buds-t200x',
    title: 'realme Buds T200x',
    type: 'earbuds',
    priceInr: 1600,
    regularInr: 2499,
    short: '25 dB ANC, 48 h playback, IP55',
    description:
      'Active noise cancellation up to 25 dB at an everyday price, with realme’s 12.4 mm dynamic bass driver, 48 hours of total playtime with the case and an IP55 rating against dust, sweat and rain. Bluetooth 5.4 pairs with Android and iPhone, and three sizes of ear tips come in the box so the seal fits.',
    features: ['Active noise cancellation up to 25 dB', 'Up to 48 h with the case', 'IP55 dust and water resistance'],
    specs: [
      { label: 'Playback', value: 'Up to 48 h with the case' },
      { label: 'Drivers', value: '12.4 mm dynamic bass driver' },
      { label: 'Noise control', value: 'Active noise cancellation up to 25 dB' },
      { label: 'Bluetooth', value: '5.4' },
      { label: 'Water resistance', value: 'IP55 dust and water' },
      { label: 'Charging', value: 'USB-C' },
      { label: 'Model', value: 'RMA2415-A' },
      { label: 'Warranty', value: '1 year from realme, with our GST invoice' },
    ],
    inBox: 'Earbuds, charging case, user guide and ear tips in S, M and L, in the sealed realme box.',
    optionKind: 'colour',
    options: [{ slug: 'black', name: 'Black', hex: '#1f2023' }],
    original: REALME,
    warrantyMonths: ONE_YEAR,
    photos: {
      id: 'realme-t200x',
      gallery: ['Black', 'Earbuds', 'Case closed'],
      heroByOption: { black: 0 },
    },
  },
  {
    id: 'realme-t310',
    handle: 'realme-buds-t310',
    title: 'realme Buds T310',
    type: 'earbuds',
    priceInr: 2199,
    regularInr: 2499,
    short: '46 dB hybrid ANC, 360° spatial audio, 40 h playback',
    description:
      'Hybrid active noise cancellation up to 46 dB with three mics on each bud, adjustable in three levels, plus AI deep call noise reduction. The 12.4 mm dynamic bass driver and 360° spatial audio handle music and film, a 45 ms game mode keeps games in sync, and IP55 covers dust and rain. Forty hours of total playtime with ANC off, 26 with it on; ten minutes of charge gives five hours.',
    features: ['Hybrid ANC up to 46 dB', '360° spatial audio', '10 min charge for 5 h'],
    specs: [
      { label: 'Playback', value: 'Up to 40 h with the case (26 h with ANC)' },
      { label: 'Drivers', value: '12.4 mm dynamic bass driver' },
      { label: 'Noise control', value: 'Hybrid ANC up to 46 dB, three levels; AI deep call noise cancellation' },
      { label: 'Audio', value: '360° spatial audio; AAC and SBC' },
      { label: 'Latency', value: 'Game mode, 45 ms' },
      { label: 'Bluetooth', value: '5.4' },
      { label: 'Water resistance', value: 'IP55 dust and water' },
      { label: 'Charging', value: 'USB-C; 10 min for 5 h' },
      { label: 'Warranty', value: '1 year from realme, with our GST invoice' },
    ],
    inBox: SEALED_BUDS,
    optionKind: 'colour',
    options: [{ slug: 'white', name: 'White', hex: '#eeeeea' }],
    original: REALME,
    warrantyMonths: ONE_YEAR,
    photos: {
      id: 'realme-t310',
      gallery: ['White', 'Agile White', '360 degree spatial audio'],
      heroByOption: { white: 0 },
    },
  },
  {
    id: 'realme-air-7',
    handle: 'realme-buds-air-7',
    title: 'realme Buds Air 7',
    type: 'earbuds',
    priceInr: 2999,
    regularInr: 3299,
    short: '52 dB ANC, Hi-Res Audio with LHDC, 52 h playback',
    description:
      'realme’s flagship-grade earbud: active noise cancellation up to 52 dB, Hi-Res Audio over LHDC and a 12.4 mm dynamic bass driver. Total playtime with the case reaches 52 hours, IP55 covers dust and rain, and Bluetooth 5.4 pairs with Android and iPhone. The realme Link app sets the EQ, the ANC level and the touch controls.',
    features: ['Active noise cancellation up to 52 dB', 'Hi-Res Audio with LHDC', 'Up to 52 h with the case'],
    specs: [
      { label: 'Playback', value: 'Up to 52 h with the case' },
      { label: 'Drivers', value: '12.4 mm dynamic bass driver' },
      { label: 'Noise control', value: 'Active noise cancellation up to 52 dB' },
      { label: 'Audio', value: 'Hi-Res Audio Wireless, LHDC' },
      { label: 'Bluetooth', value: '5.4' },
      { label: 'Water resistance', value: 'IP55 dust and water' },
      { label: 'Charging', value: 'USB-C' },
      { label: 'Warranty', value: '1 year from realme, with our GST invoice' },
    ],
    inBox: SEALED_BUDS,
    optionKind: 'colour',
    // realme's name for the dark grey in stock; the slug stays so existing SKUs keep working.
    options: [{ slug: 'black', name: 'Slate Grey', hex: '#3b3d40' }],
    original: REALME,
    warrantyMonths: ONE_YEAR,
    photos: {
      id: 'realme-air-7',
      cut: { w: 1232, h: 1337 },
      gallery: ['Slate Grey', 'Slate Grey finish'],
      heroByOption: { black: 0 },
    },
  },
  {
    id: 'boat-rockerz-110',
    handle: 'boat-rockerz-110',
    title: 'boAt Rockerz 110',
    type: 'neckband',
    priceInr: 799,
    regularInr: 2490,
    short: '40 h playback, dual pairing, 10 min charge for 10 h',
    description:
      'A flexible neckband with 40 hours of playtime, made in India. ENx mics keep calls clear, BEAST mode holds latency at 60 ms for games, and Bluetooth 5.3 with dual pairing keeps it on your phone and laptop at once. The magnetic earbuds clip together round your neck, IPX5 shrugs off sweat, and ten minutes of ASAP charge gives ten hours.',
    features: ['Up to 40 h playback', '10 min charge for 10 h', 'Dual pairing on Bluetooth 5.3'],
    specs: [
      { label: 'Playback', value: 'Up to 40 h' },
      { label: 'Drivers', value: '10 mm, boAt Signature Sound' },
      { label: 'Calls', value: 'ENx noise reduction mic' },
      { label: 'Latency', value: 'BEAST mode, 60 ms' },
      { label: 'Bluetooth', value: '5.3, dual pairing' },
      { label: 'Water resistance', value: 'IPX5 sweat and splash' },
      { label: 'Charging', value: 'USB-C; ASAP charge, 10 min for 10 h' },
      { label: 'Warranty', value: '1 year from boAt, with our GST invoice' },
    ],
    inBox: SEALED_NECKBAND,
    optionKind: 'colour',
    options: [{ slug: 'active-black', name: 'Active Black', hex: '#1f2023' }],
    original: BOAT,
    warrantyMonths: ONE_YEAR,
    photos: {
      id: 'boat-rockerz-110',
      cut: { w: 1403, h: 1286 },
      gallery: ['Active Black', '40 hours of playback', 'ENx clear calls', 'BEAST mode low latency', 'boAt Signature Sound', 'Features', 'Also in Deep Purple'],
    },
  },
  {
    id: 'boat-rockerz-235-pro',
    handle: 'boat-rockerz-235-pro',
    title: 'boAt Rockerz 235 Pro',
    type: 'neckband',
    priceInr: 699,
    regularInr: 1990,
    short: '20 h playback, vibration call alert, 10 min charge for 10 h',
    description:
      'A workout neckband with secure-fit ear hooks, 20 hours of playtime and a vibration alert so you feel an incoming call over the music. ENx mics cut wind and street noise on calls, BEAST mode keeps video in sync, and the magnetic earbuds snap together when you take them out. Ten minutes of ASAP charge gives ten hours.',
    features: ['Up to 20 h playback', 'Vibration call alert', '10 min charge for 10 h'],
    specs: [
      { label: 'Playback', value: 'Up to 20 h' },
      { label: 'Drivers', value: '10 mm' },
      { label: 'Calls', value: 'ENx noise reduction mic, vibration call alert' },
      { label: 'Latency', value: 'BEAST mode' },
      { label: 'Bluetooth', value: '5.2' },
      { label: 'Water resistance', value: 'IPX5 sweat and splash' },
      { label: 'Charging', value: 'USB-C; ASAP charge, 10 min for 10 h' },
      { label: 'Warranty', value: '1 year from boAt, with our GST invoice' },
    ],
    inBox: SEALED_NECKBAND,
    optionKind: 'colour',
    options: [{ slug: 'grey', name: 'Grey', hex: '#8a8c90' }],
    original: BOAT,
    warrantyMonths: ONE_YEAR,
    photos: {
      id: 'boat-rockerz-235-pro',
      cut: { w: 1024, h: 1328 },
      gallery: ['Grey', 'Features', 'BEAST mode low latency', 'Vibration call alert', 'ASAP charge', 'Also in Black', 'Also in Blue'],
    },
  },
  {
    id: 'boat-rockerz-245-pro',
    handle: 'boat-rockerz-245-pro',
    title: 'boAt Rockerz 245 Pro',
    type: 'neckband',
    priceInr: 999,
    regularInr: 2499,
    short: '20 h playback, 40 ms BEAST mode, dual pairing',
    description:
      'boAt’s neckband for games and calls: BEAST mode brings latency down to 40 ms, ENx mics pick up your voice and drop the background, and Bluetooth 5.3 with dual pairing keeps it on two devices. Twenty hours of playtime, magnetic earbuds, IPX4 against sweat, and ten minutes of ASAP charge for ten hours.',
    features: ['Up to 20 h playback', 'BEAST mode, 40 ms', '10 min charge for 10 h'],
    specs: [
      { label: 'Playback', value: 'Up to 20 h' },
      { label: 'Calls', value: 'ENx noise reduction mic' },
      { label: 'Latency', value: 'BEAST mode, 40 ms' },
      { label: 'Bluetooth', value: '5.3, dual pairing' },
      { label: 'Water resistance', value: 'IPX4 sweat and splash' },
      { label: 'Charging', value: 'USB-C; ASAP charge, 10 min for 10 h' },
      { label: 'Warranty', value: '1 year from boAt, with our GST invoice' },
    ],
    inBox: SEALED_NECKBAND,
    optionKind: 'colour',
    options: [{ slug: 'fusion-black', name: 'Fusion Black', hex: '#202125' }],
    original: BOAT,
    warrantyMonths: ONE_YEAR,
    photos: {
      id: 'boat-rockerz-245-pro',
      gallery: ['Fusion Black', 'ENx clear calls', '20 hours of playback', 'Features', 'BEAST mode low latency', 'Also in Red', 'Also in Cool Blue'],
    },
  },
];

/** Speakers, storage and cameras live in gadget-ranges.ts (added 7 Nov 2026; prices from the owner's price sheet). */
export const GADGETS: readonly GadgetEntry[] = [...AUDIO, ...SPEAKERS, ...STORAGE, ...CAMERAS];

/** Price of one option, falling back to the product's. */
export function optionPrice(entry: GadgetEntry, option: GadgetOption): { priceInr: number; regularInr: number } {
  return { priceInr: option.priceInr ?? entry.priceInr, regularInr: option.regularInr ?? entry.regularInr };
}

/** Widths written by scripts/photo-gadgets.mjs. */
export const GADGET_GALLERY_WIDTHS = [160, 480, 960, 1440] as const;
export const GADGET_CARD_WIDTHS = [320, 480, 720] as const;

export function gadgetGallerySrc(photos: GadgetPhotos, n: number, w: (typeof GADGET_GALLERY_WIDTHS)[number] = 960): string {
  return `/products/photos/gadgets/${photos.id}/g-${n}-${w}.webp`;
}

export function gadgetGallerySrcSet(photos: GadgetPhotos, n: number): string {
  return GADGET_GALLERY_WIDTHS.map((w) => `${gadgetGallerySrc(photos, n, w)} ${w}w`).join(', ');
}

export const GADGET_CUT_WIDTHS = [480, 960] as const;

/** The transparent cutout of the first image; only for photos with `cut`. */
export function gadgetCutSrc(photos: GadgetPhotos, w: (typeof GADGET_CUT_WIDTHS)[number] = 960): string {
  return `/products/photos/gadgets/${photos.id}/cut-${w}.webp`;
}

export function gadgetCutSrcSet(photos: GadgetPhotos): string {
  return GADGET_CUT_WIDTHS.map((w) => `${gadgetCutSrc(photos, w)} ${w}w`).join(', ');
}

export function gadgetCardSrc(photos: GadgetPhotos, n: number, w: (typeof GADGET_CARD_WIDTHS)[number] = 480): string {
  return `/products/photos/gadgets/${photos.id}/card-${n}-${w}.webp`;
}

export function gadgetCardSrcSet(photos: GadgetPhotos, n: number): string {
  return GADGET_CARD_WIDTHS.map((w) => `${gadgetCardSrc(photos, n, w)} ${w}w`).join(', ');
}

/** Brand names of more than one word; every other gadget title starts with its one-word brand (boAt, SanDisk, WD_BLACK → WD). */
const MULTI_WORD_BRANDS = ['SK hynix', 'CP Plus'] as const;

/** The maker of a gadget: its `original` brand when set, otherwise the brand its title starts with. */
export function gadgetBrand(gadget: Pick<GadgetEntry, 'title' | 'original'>): string {
  if (gadget.original) return gadget.original.brand;
  return MULTI_WORD_BRANDS.find((b) => gadget.title.startsWith(`${b} `)) ?? gadget.title.split(/[\s_]/)[0];
}

/** The gallery image that shows an option (a colour), or the first image. */
export function gadgetHeroIndex(photos: GadgetPhotos, optionSlug: string | null | undefined): number {
  return (optionSlug && photos.heroByOption?.[optionSlug]) || 0;
}
