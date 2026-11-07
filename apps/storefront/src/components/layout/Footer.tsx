import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import { ClockIcon, MailIcon, MapPinIcon, MessageCircleIcon, PhoneIcon } from 'lucide-react';
import { Wordmark } from '@/components/brand/Wordmark';
import { EarthCliqueMark } from '@/components/brand/EarthCliqueMark';
import {
  BRAND_NAME,
  BUSINESS,
  BUSINESS_ADDRESS,
  COD_FEE_INR,
  EARTHCLIQUE_URL,
  FREE_SHIPPING_THRESHOLD_INR,
  PARENT_BRAND,
  REPLACEMENT_DAYS,
  SHOP_CITY,
} from '@/lib/brand';
import { SUPPORT_HOURS, WHATSAPP_HREF } from '@/lib/content/policies';

const COPYRIGHT_YEAR = 2026;

type FooterLink = { href: string; label: string };

const COLUMNS: readonly { heading: string; links: readonly FooterLink[] }[] = [
  {
    heading: 'Shop',
    links: [
      { href: '/trending', label: 'Trending' },
      { href: '/categories', label: 'Shop by look' },
      { href: '/phones', label: 'Shop by phone' },
      { href: '/accessories', label: 'Screen guards & protection' },
      { href: '/audio', label: 'Earbuds, neckbands & speakers' },
      { href: '/storage', label: 'Memory cards, SSDs & RAM' },
      { href: '/cameras', label: 'Wi-Fi cameras' },
      { href: '/search', label: 'Search' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { href: '/pages/contact', label: 'Contact us' },
      { href: '/pages/about', label: 'About us' },
      { href: '/account', label: 'Track your order' },
      { href: '/pages/returns', label: `${REPLACEMENT_DAYS}-day replacement` },
    ],
  },
  {
    // The pages Razorpay's website review asks for, under the names it uses.
    heading: 'Policies',
    links: [
      { href: '/pages/terms', label: 'Terms & conditions' },
      { href: '/pages/privacy', label: 'Privacy policy' },
      { href: '/pages/refunds', label: 'Cancellations & refunds' },
      { href: '/pages/shipping', label: 'Shipping & delivery' },
    ],
  },
];

const CONTACT: readonly { Icon: ComponentType<SVGProps<SVGSVGElement>>; label: string; href?: string; external?: boolean }[] = [
  { Icon: PhoneIcon, label: BUSINESS.phone.label, href: BUSINESS.phone.href },
  { Icon: MessageCircleIcon, label: 'Chat on WhatsApp', href: WHATSAPP_HREF, external: true },
  { Icon: MailIcon, label: BUSINESS.email, href: `mailto:${BUSINESS.email}` },
  { Icon: MapPinIcon, label: BUSINESS_ADDRESS },
  { Icon: ClockIcon, label: SUPPORT_HOURS },
];

const PAYMENTS = ['UPI', 'Cards', 'Netbanking', 'Wallets', COD_FEE_INR === 0 ? 'Cash on Delivery' : 'Cash on Delivery (fee at checkout)'];

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2';
const LINK = `rounded-sm text-sm text-fg-on-ink-muted transition-colors duration-(--dur-micro) hover:text-fg-on-ink ${FOCUS}`;

export function Footer() {
  return (
    <footer id="footer" className="bg-ink text-fg-on-ink">
      <div className="mx-auto w-full max-w-7xl px-4 pt-14 pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:px-6 md:pb-12 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Who we are and how to reach us: Razorpay's review looks for the address, phone and email. */}
          <div className="lg:col-span-5">
            <p>
              <Wordmark className="text-xl" />
            </p>
            <p className="mt-3 max-w-sm text-sm text-pretty text-fg-on-ink-muted">
              Phone covers, sealed earbuds and neckbands, and screen protection, packed at our {SHOP_CITY} warehouse. UPI, cards or Cash on
              Delivery. Free shipping over ₹{FREE_SHIPPING_THRESHOLD_INR}.
            </p>
            <address className="mt-6 flex max-w-sm flex-col gap-3 not-italic">
              {CONTACT.map(({ Icon, label, href, external }) => {
                const body = (
                  <>
                    <Icon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                    <span>{label}</span>
                  </>
                );
                return href ? (
                  <a
                    key={label}
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className={`flex items-start gap-3 ${LINK}`}
                  >
                    {body}
                  </a>
                ) : (
                  <p key={label} className="flex items-start gap-3 text-sm text-fg-on-ink-muted">
                    {body}
                  </p>
                );
              })}
            </address>
          </div>

          {/* Two columns of links on phones, three side by side from sm. */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-7">
            {COLUMNS.map((col) => (
              <nav key={col.heading} aria-label={col.heading}>
                <h2 className="font-sans text-label font-bold tracking-[0.2em] text-fg-on-ink-muted uppercase">{col.heading}</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={LINK}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-fg-on-ink/10 pt-6 sm:flex-row sm:items-center sm:gap-4">
          <p className="text-label font-bold tracking-[0.2em] text-fg-on-ink-muted uppercase">Pay with</p>
          <ul className="flex flex-wrap gap-2" aria-label="Payment methods">
            {PAYMENTS.map((method) => (
              <li key={method} className="rounded-pill border border-fg-on-ink/15 px-3 py-1 text-caption font-semibold text-fg-on-ink">
                {method}
              </li>
            ))}
          </ul>
          <p className="text-caption text-fg-on-ink-muted sm:ml-auto">Online payments are processed securely by Razorpay.</p>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-fg-on-ink/10 pt-6 text-xs text-fg-on-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <p>
              © {COPYRIGHT_YEAR} {BRAND_NAME}. Run by {BUSINESS.name}, SIDCUL, {SHOP_CITY}, {BUSINESS.address.state}.
            </p>
            <p>{BUSINESS.gstin ? `GSTIN ${BUSINESS.gstin} · Ships from India` : 'Ships from India'}</p>
          </div>
          {/* The mark is placed as supplied: 32 px, untouched, with 32 px of clear space around it. */}
          <a
            href={EARTHCLIQUE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-8 self-start rounded-sm py-8 pr-8 text-caption text-fg-on-ink-muted transition-colors duration-(--dur-micro) hover:text-fg-on-ink sm:self-auto sm:pl-8 ${FOCUS}`}
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
