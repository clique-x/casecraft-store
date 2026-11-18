import Link from 'next/link';
import { BanknoteIcon, ChevronDownIcon, LandmarkIcon, MessageCircleIcon, WalletIcon, type LucideIcon } from 'lucide-react';
import { Wordmark } from '@/components/brand/Wordmark';
import { EarthCliqueMark } from '@/components/brand/EarthCliqueMark';
import { BRAND_NAME, BUSINESS, BUSINESS_ADDRESS, COD_FEE_INR, EARTHCLIQUE_URL, PARENT_BRAND, REPLACEMENT_DAYS, SHOP_CITY } from '@/lib/brand';
import { SUPPORT_HOURS, WHATSAPP_HREF } from '@/lib/content/policies';
import { cn } from '@/lib/utils';

const COPYRIGHT_YEAR = 2026;

type FooterLink = { href: string; label: string };

const SHOP: readonly FooterLink[] = [
  { href: '/trending', label: 'Trending' },
  { href: '/phones', label: 'Phone covers' },
  { href: '/categories', label: 'Covers by look' },
  { href: '/accessories', label: 'Screen guards' },
  { href: '/audio', label: 'Earbuds & speakers' },
  { href: '/charging', label: 'Chargers & cables' },
  { href: '/storage', label: 'Memory cards & SSDs' },
  { href: '/cameras', label: 'Wi-Fi cameras' },
  { href: '/laptops', label: 'Refurbished laptops' },
  { href: '/computer-accessories', label: 'Mice & keyboards' },
];

const HELP: readonly FooterLink[] = [
  { href: '/pages/contact', label: 'Contact us' },
  { href: '/pages/about', label: 'About us' },
  { href: '/account', label: 'My orders & tracking' },
  { href: '/pages/returns', label: `${REPLACEMENT_DAYS}-day replacement` },
];

// The pages Razorpay's website review asks for, under the names it uses. Always in view, never inside a fold.
const POLICIES: readonly FooterLink[] = [
  { href: '/pages/terms', label: 'Terms & conditions' },
  { href: '/pages/privacy', label: 'Privacy policy' },
  { href: '/pages/refunds', label: 'Cancellations & refunds' },
  { href: '/pages/shipping', label: 'Shipping & delivery' },
];

/**
 * The networks' own marks, as supplied (public/brand/payments; sources in catalog-sources/brand-assets). Each
 * sits in a tile of one size, at the height that gives the four the same visual weight.
 */
const MARKS: readonly { name: string; src: string; width: number; height: number; size: string }[] = [
  { name: 'UPI', src: '/brand/payments/upi.svg', width: 130.54, height: 46.118, size: 'h-[0.9375rem]' },
  { name: 'Visa', src: '/brand/payments/visa.svg', width: 1000, height: 324.68, size: 'h-3' },
  { name: 'Mastercard', src: '/brand/payments/mastercard.svg', width: 1000, height: 618, size: 'h-[1.125rem]' },
  { name: 'RuPay', src: '/brand/payments/rupay.svg', width: 71.867, height: 18.905, size: 'h-[0.6875rem]' },
];

/** Ways to pay that have no mark of their own: a coloured icon and the name. */
const METHODS: readonly { label: string; Icon: LucideIcon; tone: string }[] = [
  { label: 'Netbanking', Icon: LandmarkIcon, tone: 'text-brand' },
  { label: 'Wallets', Icon: WalletIcon, tone: 'text-[#b4530a]' },
  { label: COD_FEE_INR === 0 ? 'Cash on Delivery' : 'Cash on Delivery (fee at checkout)', Icon: BanknoteIcon, tone: 'text-success' },
];

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2';
const LINK = `rounded-sm text-fg-on-ink-muted transition-colors duration-(--dur-micro) hover:text-fg-on-ink ${FOCUS}`;
const HEADING = 'font-sans text-label font-bold tracking-[0.2em] text-fg-on-ink-muted uppercase';
const TILE = 'h-8 rounded-md border border-fg-on-ink/12 bg-white';

function Links({ links, className }: { links: readonly FooterLink[]; className?: string }) {
  return (
    <ul className={className}>
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className={cn('text-sm', LINK)}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** A column of links from md up. */
function Column({ heading, links, className, listClassName }: { heading: string; links: readonly FooterLink[]; className?: string; listClassName?: string }) {
  return (
    <nav aria-label={heading} className={className}>
      <h2 className={HEADING}>{heading}</h2>
      <Links links={links} className={cn('mt-3.5 grid gap-y-2.5', listClassName)} />
    </nav>
  );
}

/** The same links on phones, folded away under their heading until it is tapped. No script: a <details>. */
function Fold({ heading, links }: { heading: string; links: readonly FooterLink[] }) {
  return (
    <details className="group border-b border-fg-on-ink/10">
      <summary className={cn('flex h-12 cursor-pointer list-none items-center justify-between text-sm font-semibold text-fg-on-ink [&::-webkit-details-marker]:hidden', FOCUS)}>
        {heading}
        <ChevronDownIcon className="size-4 text-fg-on-ink-muted transition-transform duration-(--dur-ui) group-open:rotate-180" aria-hidden="true" />
      </summary>
      <nav aria-label={heading}>
        <Links links={links} className="grid grid-cols-2 gap-x-4 gap-y-3 pt-0.5 pb-4" />
      </nav>
    </details>
  );
}

/**
 * The site footer, kept short. On phones the shop and help links fold under their headings and everything else
 * is a few lines; from md the links are columns beside the shop's details. What Razorpay's review looks for
 * stays in plain view at every width: the business name, address, phone, email and the four policy pages.
 */
export function Footer() {
  return (
    <footer id="footer" className="border-t border-fg-on-ink/8 bg-ink text-fg-on-ink print:hidden">
      {/* The floating chat button sits beside the last row on phones, not over it, so the padding stays small. */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+2rem)] sm:px-6 md:pb-8 lg:px-8 lg:pt-12 home:max-w-[90rem] home:lg:px-10 home:xl:px-14">
        <div className="lg:grid lg:grid-cols-12 lg:gap-10">
          {/* Who we are and how to reach us. */}
          <div className="lg:col-span-4">
            <div className="flex items-center justify-between gap-4">
              <Wordmark className="text-xl" />
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className={cn('inline-flex h-9 items-center gap-1.5 rounded-pill border border-fg-on-ink/15 bg-white px-3.5 text-[0.8125rem] font-semibold text-fg-on-ink transition-colors duration-(--dur-micro) hover:border-fg-on-ink/40', FOCUS)}
              >
                <MessageCircleIcon className="size-4 text-[#128c4a]" aria-hidden="true" />
                WhatsApp
              </a>
            </div>
            <p className="mt-3 hidden max-w-sm text-sm text-pretty text-fg-on-ink-muted lg:block">
              Phone covers, audio, storage and screen protection, packed at our {SHOP_CITY} warehouse.
            </p>
            <address className="mt-3 max-w-sm text-[0.8125rem] leading-relaxed text-fg-on-ink-muted not-italic lg:mt-4">
              <p className="flex flex-wrap gap-x-2 text-sm text-fg-on-ink">
                <a href={BUSINESS.phone.href} className={cn('font-semibold tabular-nums', LINK, 'text-fg-on-ink')}>
                  {BUSINESS.phone.label}
                </a>
                <span aria-hidden="true" className="text-fg-on-ink-muted">
                  ·
                </span>
                <a href={`mailto:${BUSINESS.email}`} className={cn('font-semibold', LINK, 'text-fg-on-ink')}>
                  {BUSINESS.email}
                </a>
              </p>
              <p className="mt-1.5">{BUSINESS_ADDRESS}</p>
              <p>{SUPPORT_HOURS}</p>
            </address>
          </div>

          <div className="mt-5 lg:col-span-8 lg:mt-0">
            {/* Phones: the shop and help links, folded. */}
            <div className="border-t border-fg-on-ink/10 md:hidden">
              <Fold heading="Shop" links={SHOP} />
              <Fold heading="Help" links={HELP} />
            </div>
            <div className="md:grid md:grid-cols-[2fr_1fr_1.1fr] md:gap-x-8">
              <Column heading="Shop" links={SHOP} className="hidden md:block" listClassName="grid-cols-2 gap-x-6" />
              <Column heading="Help" links={HELP} className="hidden md:block" />
              {/* The policy pages: a wrapping line on phones, a column from md. One list, always visible. */}
              <nav aria-label="Policies" className="pt-4 md:pt-0">
                <h2 className={`${HEADING} hidden md:block`}>Policies</h2>
                <Links links={POLICIES} className="flex flex-wrap gap-x-4 gap-y-2 md:mt-3.5 md:grid md:gap-y-2.5" />
              </nav>
            </div>
          </div>
        </div>

        {/* How to pay: the networks' marks in tiles of one size, then the ways that have no mark. */}
        <div className="mt-6 flex flex-col gap-3 border-t border-fg-on-ink/10 pt-5 lg:mt-8 lg:flex-row lg:items-center lg:justify-between">
          <ul aria-label="Payment methods" className="flex flex-wrap items-center gap-1.5">
            {MARKS.map((mark) => (
              <li key={mark.name} className={cn(TILE, 'grid w-[3.25rem] place-items-center')}>
                {/* eslint-disable-next-line @next/next/no-img-element -- a brand mark, shipped as supplied */}
                <img src={mark.src} width={mark.width} height={mark.height} alt={mark.name} loading="lazy" decoding="async" className={cn('w-auto', mark.size)} />
              </li>
            ))}
            {METHODS.map(({ label, Icon, tone }) => (
              <li key={label} className={cn(TILE, 'inline-flex items-center gap-1.5 px-2.5 text-xs font-semibold whitespace-nowrap text-fg-on-ink')}>
                <Icon className={cn('size-4 shrink-0', tone)} strokeWidth={1.75} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
          <p className="text-xs text-fg-on-ink-muted">Online payments are processed securely by Razorpay.</p>
        </div>

        {/*
          The EarthClique mark is placed as supplied: 32 px, untouched, with 32 px of clear space on every side.
          The space above it is this row's own margin, the space below the footer's padding, and the gaps beside
          it are 32 px.
        */}
        <div className="mt-8 flex flex-col gap-8 text-xs text-fg-on-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="text-pretty">
            © {COPYRIGHT_YEAR} {BRAND_NAME}. Run by {BUSINESS.name}, SIDCUL, {SHOP_CITY}, {BUSINESS.address.state}.{' '}
            {BUSINESS.gstin ? `GSTIN ${BUSINESS.gstin}. Ships from India.` : 'Ships from India.'}
          </p>
          <a
            href={EARTHCLIQUE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('inline-flex shrink-0 items-center gap-8 self-start rounded-sm text-caption text-fg-on-ink-muted transition-colors duration-(--dur-micro) hover:text-fg-on-ink sm:self-auto', FOCUS)}
          >
            <EarthCliqueMark />
            An {PARENT_BRAND} product
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
