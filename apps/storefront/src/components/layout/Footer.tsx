import Link from 'next/link';
import { EarthCliqueMark } from '@/components/brand/EarthCliqueMark';
import {
  BRAND_NAME,
  DISPATCH_WINDOW,
  EARTHCLIQUE_URL,
  FREE_SHIPPING_THRESHOLD_INR,
  PARENT_BRAND,
  REPLACEMENT_DAYS,
  SHOP_CITY,
  WHATSAPP_NUMBER,
} from '@/lib/brand';

const COPYRIGHT_YEAR = 2026;

const COLUMNS: readonly { heading: string; links: readonly { href: string; label: string }[] }[] = [
  {
    heading: 'Shop',
    links: [
      { href: '/trending', label: 'Trending' },
      { href: '/categories', label: 'Shop by look' },
      { href: '/phones', label: 'Shop by phone' },
      { href: '/search', label: 'Search' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { href: '/pages/shipping', label: `Shipping (ships in ${DISPATCH_WINDOW})` },
      { href: '/pages/returns', label: `${REPLACEMENT_DAYS}-day replacement` },
      { href: '/pages/contact', label: 'Contact us' },
      { href: '/account', label: 'Track your order' },
    ],
  },
  {
    heading: 'Policies',
    links: [
      { href: '/pages/privacy', label: 'Privacy policy' },
      { href: '/pages/terms', label: 'Terms of service' },
      { href: '/pages/refunds', label: 'Cancellations & refunds' },
      { href: '/pages/shipping', label: 'Shipping policy' },
    ],
  },
];

const LINK =
  'rounded-sm text-sm text-fg-on-ink-muted transition-colors duration-(--dur-micro) hover:text-fg-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2';

export function Footer() {
  return (
    <footer id="footer" className="bg-ink text-fg-on-ink">
      <div className="mx-auto w-full max-w-7xl px-4 pt-14 pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:px-6 md:pb-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <p className="font-sans text-xl leading-none font-extrabold tracking-[-0.02em]">{BRAND_NAME}</p>
            <p className="mt-3 text-sm text-fg-on-ink-muted">
              Back covers photographed in our {SHOP_CITY} shop. UPI, cards and Cash on Delivery. Free shipping over ₹
              {FREE_SHIPPING_THRESHOLD_INR}.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex h-11 items-center rounded-pill border border-fg-on-ink/15 px-4 text-sm font-semibold transition-colors duration-(--dur-micro) hover:bg-fg-on-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
            >
              WhatsApp us
            </a>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="font-sans text-label font-bold tracking-[0.2em] text-fg-on-ink-muted uppercase">{col.heading}</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={`${col.heading}-${link.href}-${link.label}`}>
                    <Link href={link.href} className={LINK}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-fg-on-ink/10 pt-6 text-xs text-fg-on-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <p>© {COPYRIGHT_YEAR} {BRAND_NAME}. Covers photographed in our {SHOP_CITY} shop.</p>
            <p>GSTIN: pending registration · Ships from India</p>
          </div>
          {/* The mark is placed as supplied: 32 px, untouched, with 32 px of clear space around it. */}
          <a
            href={EARTHCLIQUE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-8 self-start rounded-sm py-8 pr-8 text-caption text-fg-on-ink-muted transition-colors duration-(--dur-micro) hover:text-fg-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2 sm:self-auto sm:pl-8"
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
