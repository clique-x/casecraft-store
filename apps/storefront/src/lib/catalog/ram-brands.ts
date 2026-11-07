/**
 * How a buyer can tell a memory module's brand from the module itself: the label, the part number and the chip markings.
 * Facts only (the brands' own numbering): Samsung M471/M378 and K4A/K4B, SK hynix HMA/HMT and H5A/H5T, Crucial CT… on Micron chips.
 */
export interface RamBrand {
  name: 'Samsung' | 'SK hynix' | 'Crucial';
  points: readonly string[];
}

export const RAM_BRANDS: readonly RamBrand[] = [
  {
    name: 'Samsung',
    points: [
      'White label with the blue SAMSUNG logo',
      'Part number starts M471 on laptop modules and M378 on desktop modules',
      'Memory chips printed SAMSUNG or SEC; chip codes start K4A on DDR4 and K4B on DDR3',
    ],
  },
  {
    name: 'SK hynix',
    points: [
      'White label with the SK hynix logo (hynix on older modules)',
      'Part number starts HMA on DDR4 and HMT on DDR3; an S after the size code means laptop, a U desktop (HMAA1GS6…, HMA81GU6…)',
      'Memory chips printed SK hynix; chip codes start H5A on DDR4 and H5T on DDR3',
    ],
  },
  {
    name: 'Crucial',
    points: [
      'Label with the Crucial logo and a part number starting CT',
      'On DDR4, SF in the part number means laptop and DF desktop (CT8G4SFRA32A, CT8G4DFRA32A)',
      'Memory chips made by Micron, Crucial’s parent company, printed with the Micron logo',
    ],
  },
];

export const RAM_SPEED_LINE_TIP =
  'Every label also has a speed line that gives the type: PC4 is DDR4, PC3 is DDR3 and PC3L is low-voltage DDR3L. ' +
  'An S after the speed grade means a laptop module (PC4-3200AA-SA1, PC3L-12800S), a U a desktop one.';

/** The brand a RAM listing names in its specs, if it is one of the guide's brands. */
export function ramBrandOf(specs: readonly { label: string; value: string }[]): RamBrand['name'] | undefined {
  const value = specs.find((s) => s.label === 'Brand')?.value;
  return RAM_BRANDS.find((b) => b.name === value)?.name;
}
