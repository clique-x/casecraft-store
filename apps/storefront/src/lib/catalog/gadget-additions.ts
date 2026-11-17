/**
 * Products added from the owner's image batch of 17 Nov 2026 (GadgetsHub - Complete Image Collection.zip).
 *
 * PRICES: the owner's rule (7 Nov): the Flipkart price on 17 Nov less ₹100, ending in 9; `regularInr` is the MRP printed on
 * the box (or on the brand's page where the box label was not photographed). The Honeywell hub is not on Flipkart: its price
 * is set below Honeywell's own ₹439. Specs are the brands' own published figures or the box print.
 *
 * PHOTOS: the shop's own photos cut off the green backdrop and placed on the teal stage, the brands' official product images
 * (boAt, Samsung, Ant Esports), and only those of the owner's creatives whose box art matches the real box. Creatives with
 * altered box text (Aavante 2.0 150 #1–3, Aavante Bar 490, KM1410, Samsung 45W, Samsung 25W #2–3) are not used.
 *
 * `original` is not set on any of these until the owner confirms they came from the brand or its authorised distributor.
 * Held back, with the reasons in catalog-sources/batch-2026-11-17/README.md: Apple 20W and 40W adapters, Apple 60W cable,
 * Samsung USB-C to USB-C cable, the unidentified boAt speaker, and the two Dell Latitude laptops.
 */

import type { GadgetEntry } from './gadgets';

const BOAT_YEAR = '1 year from boAt, with our GST invoice';
const ANT_YEAR = '1 year from Ant Esports, with our GST invoice';
const SAMSUNG_ACCESSORY = '6 months, exchanged at Samsung service centres, with our GST invoice';

export const SOUNDBARS: readonly GadgetEntry[] = [
  {
    id: 'boat-aavante-2-150',
    handle: 'boat-aavante-2-0-150',
    title: 'boAt Aavante 2.0 150',
    type: 'soundbar',
    priceInr: 1399,
    regularInr: 3990,
    short: '16 W 2.0 soundbar, RGB LEDs, Bluetooth 5.4',
    description:
      'A 16 W portable soundbar with two full-range drivers in a 2.0-channel layout and RGB lights at both ends. Play over Bluetooth 5.4, AUX, a USB drive or a TF card, pair two Aavante 2.0 150s in TWS mode for more sound, and take calls through the built-in mic. Music, News and Movie EQ modes tune the sound, and a charge over USB-C lasts up to 5 hours.',
    features: ['16 W RMS, two full-range drivers', 'Bluetooth 5.4, AUX, USB and TF card', 'RGB LEDs and TWS pairing'],
    specs: [
      { label: 'Output', value: '16 W RMS (8 W × 2), boAt Signature Sound' },
      { label: 'Channels', value: '2.0, two 2-inch full-range drivers' },
      { label: 'Playback', value: 'Up to 5 h per charge' },
      { label: 'Charging', value: 'USB-C, 5 to 6 h' },
      { label: 'Bluetooth', value: '5.4' },
      { label: 'Other inputs', value: 'AUX, USB drive, TF card' },
      { label: 'Pairing', value: 'TWS: pair two Aavante 2.0 150s' },
      { label: 'EQ modes', value: 'Music, News, Movie' },
      { label: 'Size', value: '385 × 74 × 73 mm' },
      { label: 'Model number', value: 'HA0111' },
      { label: 'Warranty', value: BOAT_YEAR },
    ],
    inBox: 'Soundbar, USB-C charging cable, AUX cable and user manual, in the sealed boAt box.',
    optionKind: 'colour',
    options: [{ slug: 'premium-black', name: 'Premium Black', hex: '#1b1c1e' }],
    warrantyMonths: 12,
    photos: {
      id: 'boat-aavante-2-150',
      gallery: ['Premium Black', 'Sealed box', '16 W boAt Signature Sound', '2.0 channel soundbar', 'RGB LEDs'],
    },
  },
  {
    id: 'boat-aavante-bar-490',
    handle: 'boat-aavante-bar-490',
    title: 'boAt Aavante Bar 490',
    type: 'soundbar',
    priceInr: 999,
    regularInr: 3490,
    short: '10 W soundbar, up to 7 h playback, Bluetooth 5.3',
    description:
      'A slim 10 W Bluetooth soundbar with two full-range drivers, for a desk, a bedside or under a TV. It plays for up to 7 hours on a charge, also takes AUX, a USB drive or a TF card, pairs with a second Aavante Bar in TWS mode and has a mic for hands-free calls.',
    features: ['10 W RMS, two full-range drivers', 'Up to 7 h playback', 'Bluetooth 5.3, AUX, USB and TF card'],
    specs: [
      { label: 'Output', value: '10 W RMS (5 W × 2)' },
      { label: 'Channels', value: '2.0, two 2-inch full-range drivers' },
      { label: 'Playback', value: 'Up to 7 h per charge' },
      { label: 'Bluetooth', value: '5.3' },
      { label: 'Other inputs', value: 'AUX, USB drive, TF card' },
      { label: 'Pairing', value: 'TWS: pair two for more sound' },
      { label: 'Calls', value: 'Built-in mic' },
      { label: 'Size', value: '387 × 55 × 65 mm' },
      { label: 'Warranty', value: BOAT_YEAR },
    ],
    inBox: 'Soundbar with its accessories and user manual, as packed by boAt in the sealed box.',
    optionKind: 'colour',
    options: [{ slug: 'classic-black', name: 'Classic Black', hex: '#1b1c1e' }],
    warrantyMonths: 12,
    photos: { id: 'boat-aavante-bar-490', gallery: ['Sealed box', 'Box, side view'] },
  },
];

export const CHARGING: readonly GadgetEntry[] = [
  {
    id: 'samsung-25w-adapter',
    handle: 'samsung-25w-usb-c-power-adapter-white',
    title: 'Samsung 25W USB-C power adapter (white)',
    type: 'charger',
    priceInr: 899,
    regularInr: 1699,
    short: '25 W Super Fast Charging, USB-C, cable sold separately',
    description:
      'Samsung’s own 25 W wall adapter with one USB-C port. It Super Fast Charges Galaxy phones that support 25 W charging (USB PD 3.0 with PPS) and charges any other USB-C phone or earbuds at their normal speed. It draws under 5 mW when nothing is plugged in. The box holds the adapter only: pair it with a USB-C cable.',
    features: ['25 W Super Fast Charging', 'USB PD 3.0 with PPS', 'Low standby power, under 5 mW'],
    specs: [
      { label: 'Output', value: 'Up to 25 W, USB PD 3.0 with PPS (Super Fast Charging)' },
      { label: 'Port', value: '1 × USB-C' },
      { label: 'Input', value: '100–240 V, 50–60 Hz' },
      { label: 'Standby power', value: 'Under 5 mW' },
      { label: 'Size and weight', value: '46 × 26.2 × 68.9 mm, 73 g' },
      { label: 'Part number', value: 'EP-T2510NWNGIN' },
      { label: 'Warranty', value: SAMSUNG_ACCESSORY },
    ],
    inBox: 'Power adapter and leaflet. No cable in the box.',
    optionKind: 'colour',
    options: [{ slug: 'white', name: 'White', hex: '#f1f1ee' }],
    warrantyMonths: 6,
    ports: ['usb-c'],
    fastFor: ['Samsung'],
    photos: { id: 'samsung-25w-adapter', gallery: ['Adapter', 'Sealed box', 'Side view', 'USB-C port'] },
  },
  {
    id: 'samsung-45w-adapter',
    handle: 'samsung-45w-usb-c-power-adapter-black',
    title: 'Samsung 45W USB-C power adapter (black)',
    type: 'charger',
    priceInr: 2299,
    regularInr: 3499,
    short: '45 W Super Fast Charging 2.0, USB-C, cable sold separately',
    description:
      'Samsung’s 45 W wall adapter with one USB-C port. It charges at the full 45 W the Galaxy phones that support Super Fast Charging 2.0 (Samsung lists the S23+, S23 Ultra, S24+ and S24 Ultra among them), and other USB-C phones at the speed they support. The box holds the adapter only: Samsung asks for a 5 A USB-C cable for the full 45 W.',
    features: ['45 W Super Fast Charging 2.0', 'USB PD 3.0 with PPS', 'Low standby power, under 5 mW'],
    specs: [
      { label: 'Output', value: 'Up to 45 W, USB PD 3.0 with PPS (Super Fast Charging 2.0)' },
      { label: 'Port', value: '1 × USB-C' },
      { label: 'Input', value: '100–240 V, 50–60 Hz' },
      { label: 'Standby power', value: 'Under 5 mW' },
      { label: 'Part number', value: 'EP-T4511' },
      { label: 'Warranty', value: SAMSUNG_ACCESSORY },
    ],
    inBox: 'Power adapter and leaflet. No cable in the box.',
    optionKind: 'colour',
    options: [{ slug: 'black', name: 'Black', hex: '#1c1c1e' }],
    warrantyMonths: 6,
    ports: ['usb-c'],
    fastFor: ['Samsung'],
    photos: { id: 'samsung-45w-adapter', gallery: ['Adapter', 'Sealed box'] },
  },
  {
    id: 'samsung-cable-a-c-white',
    handle: 'samsung-usb-a-to-usb-c-cable-1-5m-white',
    title: 'Samsung USB-A to USB-C cable, 1.5 m (white)',
    type: 'cable',
    priceInr: 279,
    regularInr: 550,
    short: 'USB-A to USB-C data and charging cable, 1.5 m',
    description:
      'Samsung’s USB-A to USB-C cable in white, 1.5 m long. Use it to charge a USB-C phone or earbuds from a USB-A charger, laptop or car port, and to move photos and files between your phone and a computer.',
    features: ['USB-A to USB-C', '1.5 m long', 'Charging and data'],
    specs: [
      { label: 'Connectors', value: 'USB-A to USB-C' },
      { label: 'Length', value: '1.5 m' },
      { label: 'Colour', value: 'White' },
      { label: 'Part number', value: 'EP-DG930IWEGIN' },
      { label: 'Warranty', value: SAMSUNG_ACCESSORY },
    ],
    inBox: 'Cable and leaflet.',
    optionKind: 'length',
    options: [{ slug: '1-5m', name: '1.5 m', hex: '#f1f1ee' }],
    warrantyMonths: 6,
    phoneEnd: 'usb-c',
    hostEnd: 'usb-a',
    photos: { id: 'samsung-cable-a-c-white', gallery: ['Sealed box', 'USB-A to USB-C', '1.5 metre length'] },
  },
];

export const COMPUTER: readonly GadgetEntry[] = [
  {
    id: 'ant-esports-gm320',
    handle: 'ant-esports-gm320-rgb-gaming-mouse',
    title: 'Ant Esports GM320 RGB gaming mouse',
    type: 'mouse',
    priceInr: 579,
    regularInr: 2799,
    short: 'Wired, up to 12800 DPI, 8 programmable buttons',
    description:
      'A wired optical gaming mouse with eight programmable buttons and a fire button, multicolour lighting with 12 modes and a 1.5 m braided cable. Six DPI steps go up to 12800, the sensor reads 7000 frames a second and the switches are rated for 20 million clicks. A USB to Type-C adapter in the box lets it work with a phone or tablet too.',
    features: ['Up to 12800 DPI, optical sensor', '8 programmable buttons + fire button', 'Multicolour lighting, braided cable'],
    specs: [
      { label: 'Connection', value: 'Wired USB, 1.5 m braided cable' },
      { label: 'DPI', value: '1200, 1600, 2400, 3200, 4800, 12800' },
      { label: 'Sensor', value: 'Optical, 7000 FPS' },
      { label: 'Polling rate', value: '500 to 1000 Hz' },
      { label: 'Buttons', value: '8 programmable, plus a fire button' },
      { label: 'Lighting', value: 'Multicolour, 12 modes' },
      { label: 'Switches', value: 'Rated for 20 million clicks' },
      { label: 'Warranty', value: ANT_YEAR },
    ],
    inBox: 'Mouse, USB to Type-C OTG adapter and user manual.',
    optionKind: 'colour',
    options: [{ slug: 'black', name: 'Black', hex: '#1c1c1e' }],
    warrantyMonths: 12,
    photos: { id: 'ant-esports-gm320', gallery: ['Sealed box', 'Optical gaming mouse', 'Programmable controls', 'Multicolour lighting'] },
  },
  {
    id: 'ant-esports-gm320-pro',
    handle: 'ant-esports-gm320-pro-wireless-gaming-mouse',
    title: 'Ant Esports GM320 Pro wireless gaming mouse',
    type: 'mouse',
    priceInr: 849,
    regularInr: 3499,
    short: '2.4 GHz wireless, up to 4000 DPI, rechargeable',
    description:
      'The wireless version of the GM320: a 2.4 GHz USB receiver, a rechargeable 300 mAh battery that tops up in about an hour, five DPI steps up to 4000 and RGB lighting in seven colours. It has eight buttons, weighs about 95 g and works with Windows, Mac and Linux; the USB to Type-C adapter in the box connects the receiver to a phone or tablet.',
    features: ['2.4 GHz wireless, USB receiver', 'Up to 4000 DPI', 'Rechargeable, RGB lighting'],
    specs: [
      { label: 'Connection', value: '2.4 GHz wireless, USB receiver' },
      { label: 'DPI', value: '800, 1600, 2400, 3200, 4000' },
      { label: 'Battery', value: '300 mAh, rechargeable, about 1 h to charge' },
      { label: 'Buttons', value: '8' },
      { label: 'Lighting', value: 'RGB LED, 7 colours' },
      { label: 'Weight', value: 'About 95 g' },
      { label: 'Works with', value: 'Windows, Mac, Linux' },
      { label: 'Warranty', value: ANT_YEAR },
    ],
    inBox: 'Mouse, USB receiver, USB to Type-C OTG adapter, charging cable and user manual.',
    optionKind: 'colour',
    options: [{ slug: 'black', name: 'Black', hex: '#1c1c1e' }],
    warrantyMonths: 12,
    photos: { id: 'ant-esports-gm320-pro', gallery: ['Sealed box', 'Wireless gaming mouse', 'Gaming mouse controls'] },
  },
  {
    id: 'ant-esports-km1410',
    handle: 'ant-esports-km1410-gaming-keyboard-mouse-combo',
    title: 'Ant Esports KM1410 gaming keyboard and mouse combo',
    type: 'keyboard',
    priceInr: 699,
    regularInr: 1599,
    short: 'Backlit 104-key keyboard + 3600 DPI mouse, wired',
    description:
      'A full-size 104-key membrane keyboard with black and white keys and multicolour backlighting, paired with a matching wired gaming mouse that goes up to 3600 DPI. FN shortcuts on F1 to F12 control music, volume, mail, the browser and the calculator. Both plug in over USB with 1.5 m cables, and a Type-C adapter is in the box.',
    features: ['104-key backlit keyboard', 'Mouse up to 3600 DPI', 'FN media keys, plug and play'],
    specs: [
      { label: 'Keyboard', value: '104 keys, full size, membrane' },
      { label: 'Backlight', value: 'Multicolour' },
      { label: 'Media keys', value: 'FN + F1–F12: music, volume, mail, browser, calculator, lock' },
      { label: 'Mouse', value: '1200, 1800, 2400, 3600 DPI, 7 buttons, multicolour LED' },
      { label: 'Cables', value: 'USB, 1.5 m on both' },
      { label: 'Works with', value: 'Windows, macOS, Linux' },
      { label: 'Warranty', value: ANT_YEAR },
    ],
    inBox: 'Keyboard, mouse, USB to Type-C OTG adapter and user manual.',
    optionKind: 'colour',
    options: [{ slug: 'carbon-black', name: 'Carbon Black', hex: '#1c1c1e' }],
    warrantyMonths: 12,
    photos: { id: 'ant-esports-km1410', gallery: ['Keyboard and mouse', 'Sealed box'] },
  },
  {
    id: 'honeywell-usb-hub-4',
    handle: 'honeywell-4-port-usb-2-0-hub',
    title: 'Honeywell 4-port USB 2.0 hub',
    type: 'hub',
    priceInr: 399,
    regularInr: 799,
    short: '4 USB ports, 480 Mbps, 1.2 m cable, 3-year warranty',
    description:
      'Turns one USB port into four, for pen drives, a keyboard and mouse, a printer or a portable hard drive. It runs off the laptop or PC it is plugged into, with no power adapter, on a 1.2 m cable so the hub can sit on the desk. USB 2.0 moves data at up to 480 Mbps. Honeywell backs it with a 3-year warranty.',
    features: ['4 × USB 2.0 ports', '1.2 m cable, no adapter needed', '3-year Honeywell warranty'],
    specs: [
      { label: 'Ports', value: '4 × USB-A, USB 2.0' },
      { label: 'Speed', value: 'Up to 480 Mbps' },
      { label: 'Power', value: 'From the computer, up to 500 mA per port' },
      { label: 'Cable', value: '1.2 m, USB-A plug' },
      { label: 'Set-up', value: 'Plug and play, no drivers' },
      { label: 'Part number', value: 'HC000011/LAP/NPH/4U/BLK' },
      { label: 'Warranty', value: '3 years from Honeywell, with our GST invoice' },
    ],
    inBox: 'USB hub with its attached cable.',
    optionKind: 'colour',
    options: [{ slug: 'black', name: 'Black', hex: '#1c1c1e' }],
    warrantyMonths: 36,
    photos: { id: 'honeywell-usb-hub-4', gallery: ['Sealed box', '4 USB ports', 'USB 2.0, up to 480 Mbps', '120 cm cable'] },
  },
];
