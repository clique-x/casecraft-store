'use client';

import Link from 'next/link';
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Dialog } from 'radix-ui';
import {
  Cctv,
  ChevronRight,
  HardDrive,
  Headphones,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Smartphone,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Wordmark } from '@/components/brand/Wordmark';
import { logoIsWordmark, PhoneBrandLogo } from '@/components/brand/PhoneBrandLogo';
import { SearchForm } from '@/components/search/SearchForm';
import { BRAND_NAME, BUSINESS, REPLACEMENT_DAYS, WHATSAPP_NUMBER } from '@/lib/brand';
import { groupByBrand } from '@/lib/catalog/listing';
import { useMyPhone } from '@/lib/phone/use-my-phone';
import { cn } from '@/lib/utils';

export type MobileMenuDepartmentId = 'covers' | 'audio' | 'storage' | 'cameras' | 'protection';

/** One department row; `sections` are its in-page jump links (empty when the page has a single section). */
export interface MobileMenuDepartment {
  id: MobileMenuDepartmentId;
  href: string;
  label: string;
  note: string;
  sections: readonly { href: string; label: string }[];
}

interface MobileMenuProps {
  /** Built by the server Header from the catalogue's DEPARTMENTS, so the catalogue stays out of the client bundle. */
  departments: readonly MobileMenuDepartment[];
  supportHours: string;
  triggerClassName: string;
}

const DEPARTMENT_ICON: Record<MobileMenuDepartmentId, LucideIcon> = {
  covers: Smartphone,
  audio: Headphones,
  storage: HardDrive,
  cameras: Cctv,
  protection: ShieldCheck,
};

/** The cover shortcuts from the desktop Shop menu. */
const COVER_LINKS: readonly { href: string; label: string; note: string }[] = [
  { href: '/trending', label: 'Trending', note: 'What shoppers pick this week' },
  { href: '/collections/new', label: 'New arrivals', note: 'Just photographed in the shop' },
  { href: '/categories', label: 'Shop by look', note: 'Carbon, clear, solid, stands' },
  { href: '/phones', label: 'Shop by phone', note: 'Covers cut for your model' },
];

/** The footer's Help column, plus shipping from its Policies column. */
const HELP_LINKS: readonly { href: string; label: string }[] = [
  { href: '/account', label: 'Track your order' },
  { href: '/pages/shipping', label: 'Shipping & delivery' },
  { href: '/pages/returns', label: `Returns & ${REPLACEMENT_DAYS}-day replacement` },
  { href: '/pages/contact', label: 'Contact us' },
  { href: '/pages/about', label: 'About us' },
];

const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}`;
/** The header's md breakpoint: the text nav takes over from here, so an open drawer closes. */
const DESKTOP_NAV_QUERY = '(min-width: 48rem)';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';
const FOCUS_INSET = 'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand';
const HEADING = 'px-1 pb-2 text-label font-bold tracking-[0.18em] text-gh-ink-muted uppercase';
/** 36 px chip whose hit area grows to 44 px through the 8 px row gap. */
const CHIP = cn(
  "relative inline-flex h-9 items-center gap-2 rounded-pill bg-white px-3.5 text-caption font-semibold text-gh-ink ring-1 ring-gh-line transition-colors duration-(--dur-micro) before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] hover:bg-gh-ivory-2",
  FOCUS,
);

/**
 * Phone navigation (below md, where the header's text nav is hidden): a menu button and a sheet from the
 * left with search, every department, the cover shortcuts, phone brands and help. Built on the Radix
 * Dialog behind ui/sheet, which handles the focus trap, Escape, outside taps and the body scroll lock.
 */
export function MobileMenu({ departments, supportHours, triggerClassName }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  // The links close the sheet as they navigate; back/forward and growing past md close it too.
  // (No usePathname: under cacheComponents it would make every route dynamic.)
  useEffect(() => {
    if (!open) return;
    const onPop = () => setOpen(false);
    const mq = window.matchMedia(DESKTOP_NAV_QUERY);
    const onMq = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    window.addEventListener('popstate', onPop);
    mq.addEventListener('change', onMq);
    return () => {
      window.removeEventListener('popstate', onPop);
      mq.removeEventListener('change', onMq);
    };
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" aria-label="Menu" className={cn(triggerClassName, 'md:hidden')}>
          <Menu className="size-[1.375rem]" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-gh-night/55 md:hidden',
            'data-open:animate-in data-open:fade-in-0 data-open:duration-(--dur-ui) data-closed:animate-out data-closed:fade-out-0 data-closed:duration-200',
          )}
        />
        <Dialog.Content
          aria-modal="true"
          onOpenAutoFocus={(e) => {
            // The close button, not the search field: focusing an input would raise the keyboard.
            e.preventDefault();
            closeRef.current?.focus();
          }}
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-[min(23rem,calc(100%-3rem))] flex-col bg-gh-ivory pl-[env(safe-area-inset-left)] text-gh-ink shadow-[24px_0_60px_-24px_rgba(0,22,25,.5)] outline-none md:hidden',
            'data-open:animate-in data-open:slide-in-from-left data-open:duration-(--dur-ui) data-open:ease-out-expo',
            'data-closed:animate-out data-closed:slide-out-to-left data-closed:duration-200 data-closed:ease-in',
          )}
        >
          <div className="box-content flex h-16 shrink-0 items-center justify-between gap-2 border-b border-gh-line pt-[env(safe-area-inset-top)] pr-2 pl-4">
            <Link href="/" onNavigate={close} aria-label={`${BRAND_NAME} home`} className={cn('rounded-sm', FOCUS)}>
              <Wordmark className="text-[1.375rem]" />
            </Link>
            <Dialog.Title className="sr-only">Menu</Dialog.Title>
            <Dialog.Description className="sr-only">Search, departments, cover shortcuts and help.</Dialog.Description>
            <Dialog.Close asChild>
              <button
                ref={closeRef}
                type="button"
                aria-label="Close menu"
                className={cn(
                  'inline-flex size-11 items-center justify-center rounded-pill text-gh-ink transition-colors duration-(--dur-micro) hover:bg-gh-ink/5',
                  FOCUS,
                )}
              >
                <X className="size-[1.375rem]" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
            {/* The /search form itself; it navigates client-side, and the submit bubbles up to close the sheet. */}
            <div onSubmit={close}>
              <SearchForm id="mobile-menu-q" className="max-w-none" />
            </div>

            <MenuSection heading="Departments" className="mt-7">
              <ul className="flex flex-col">
                {departments.map((d) => (
                  <DepartmentItem key={d.id} department={d} onNavigate={close} />
                ))}
              </ul>
            </MenuSection>

            <MenuSection heading="Covers" className="mt-6">
              <ul className="grid grid-cols-2 gap-2">
                {COVER_LINKS.map((link) => (
                  <li key={link.href} className="flex">
                    <Link
                      href={link.href}
                      onNavigate={close}
                      className={cn(
                        'flex min-h-[4.75rem] w-full flex-col justify-center rounded-xl bg-white px-3 py-2.5 ring-1 ring-gh-line transition-colors duration-(--dur-micro) hover:bg-gh-ivory-2',
                        FOCUS,
                      )}
                    >
                      <span className="text-[0.9375rem] leading-snug font-semibold">{link.label}</span>
                      <span className="mt-0.5 text-caption text-gh-ink-muted">{link.note}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <BrandChips onNavigate={close} />
            </MenuSection>

            <MenuSection heading="Help" className="mt-7">
              <ul className="divide-y divide-gh-line overflow-hidden rounded-xl bg-white ring-1 ring-gh-line">
                {HELP_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onNavigate={close}
                      className={cn(
                        'flex min-h-12 items-center justify-between gap-3 px-4 text-[0.9375rem] font-medium transition-colors duration-(--dur-micro) hover:bg-gh-ivory-2',
                        FOCUS_INSET,
                      )}
                    >
                      {link.label}
                      <ChevronRight className="size-4 shrink-0 text-gh-ink-muted" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-3 rounded-xl bg-gh-teal p-4 text-white">
                <p className="text-[0.9375rem] font-semibold">Talk to the shop</p>
                <p className="mt-0.5 text-caption text-white/70">{supportHours}</p>
                <div className="mt-3 flex flex-col gap-2">
                  <a
                    href={WHATSAPP_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={close}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-pill bg-whatsapp px-4 text-sm font-bold text-gh-night transition-[filter] duration-(--dur-micro) hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gh-mint"
                  >
                    <MessageCircle className="size-4.5" aria-hidden="true" />
                    Chat on WhatsApp
                  </a>
                  <a
                    href={BUSINESS.phone.href}
                    onClick={close}
                    aria-label={`Call ${BUSINESS.phone.label}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-pill px-4 text-sm font-semibold text-white ring-1 ring-white/25 transition-colors duration-(--dur-micro) hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gh-mint"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    <span className="tabular-nums">{BUSINESS.phone.label}</span>
                  </a>
                </div>
              </div>
            </MenuSection>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MenuSection({ heading, className, children }: { heading: string; className?: string; children: ReactNode }) {
  const id = useId();
  return (
    <nav aria-labelledby={id} className={className}>
      <h2 id={id} className={HEADING}>
        {heading}
      </h2>
      {children}
    </nav>
  );
}

function DepartmentItem({ department: d, onNavigate }: { department: MobileMenuDepartment; onNavigate: () => void }) {
  const Icon = DEPARTMENT_ICON[d.id];
  return (
    <li className="border-b border-gh-line/70 last:border-b-0">
      <Link
        href={d.href}
        onNavigate={onNavigate}
        className={cn(
          '-mx-1 flex min-h-15 items-center gap-3 rounded-xl px-1 py-2 transition-colors duration-(--dur-micro) hover:bg-gh-ivory-2',
          FOCUS_INSET,
        )}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gh-teal text-gh-mint">
          <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[0.9375rem] leading-snug font-semibold">{d.label}</span>
          <span className="text-caption text-gh-ink-muted">{d.note}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-gh-ink-muted" aria-hidden="true" />
      </Link>
      {d.sections.length > 0 && (
        <ul aria-label={`${d.label} sections`} className="flex flex-wrap gap-2 pt-1 pb-3 pl-[3.25rem]">
          {d.sections.map((s) => (
            <li key={s.href}>
              <Link href={s.href} onNavigate={onNavigate} className={CHIP}>
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** Phone makers in the order /phones lists them, each to its brand page, with the same logos. */
function BrandChips({ onNavigate }: { onNavigate: () => void }) {
  const { models } = useMyPhone();
  const brands = useMemo(() => groupByBrand(models).map(({ brand, slug }) => ({ brand, slug })), [models]);
  if (brands.length === 0) return null;
  return (
    <>
      <h3 className="mt-5 px-1 pb-2 text-caption font-semibold text-gh-ink-muted">Covers for your phone brand</h3>
      <ul className="flex flex-wrap gap-2">
        {brands.map(({ brand, slug }) => (
          <li key={slug}>
            <Link href={`/phones/${slug}`} onNavigate={onNavigate} aria-label={`${brand} covers`} className={CHIP}>
              <PhoneBrandLogo brand={brand} />
              {!logoIsWordmark(brand) && <span>{brand}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default MobileMenu;
