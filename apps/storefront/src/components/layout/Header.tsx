import Link from 'next/link';
import { Search } from 'lucide-react';
import { CartButton } from './CartButton.client';
import { Wordmark } from '@/components/brand/Wordmark';
import { BRAND_NAME, PARENT_BRAND, SHOW_PARENT_BRAND } from '@/lib/brand';
import { DEPARTMENTS, type DepartmentInfo } from '@/lib/catalog/gadgets';
import { SUPPORT_HOURS } from '@/lib/content/policies';
import { cn } from '@/lib/utils';
import { HeaderScrollState } from './HeaderScrollState.client';
import { MobileMenu, type MobileMenuDepartment } from './MobileMenu.client';
import { MyPhoneChip } from './MyPhoneChip.client';
import { ShopMenu } from './ShopMenu.client';

interface HeaderProps {
  solid?: boolean;
}

const NAV = [
  { href: '/covers', label: 'Cases' },
  { href: '/audio', label: 'Audio' },
  { href: '/storage', label: 'Storage' },
  { href: '/accessories', label: 'Accessories' },
] as const;

/** A gadget department from the catalogue, with jump links to its sections when it has more than one. */
function department(id: MobileMenuDepartment['id'], info: DepartmentInfo, note: string): MobileMenuDepartment {
  const sections = info.sections.length > 1 ? info.sections.map((s) => ({ href: `${info.path}#${s.id}`, label: s.heading })) : [];
  return { id, href: info.path, label: info.name, note, sections };
}

/** The phone menu's departments; the notes follow the desktop Shop menu's, kept to one line. */
const MOBILE_DEPARTMENTS: readonly MobileMenuDepartment[] = [
  { id: 'covers', href: '/covers', label: 'Phone cases', note: 'Back covers cut for your exact phone', sections: [] },
  department('audio', DEPARTMENTS.audio, 'boAt and realme, sealed in the box'),
  department('storage', DEPARTMENTS.storage, 'Memory cards, pen drives, SSDs, RAM'),
  department('cameras', DEPARTMENTS.cameras, 'CP Plus Wi-Fi security cameras'),
  { id: 'protection', href: '/accessories', label: 'Protection', note: 'FLAYR and G-TEL glass, back films', sections: [] },
];

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

const NAV_ITEM = cn(
  'inline-flex h-11 items-center gap-1 rounded-pill px-3.5 text-[0.9375rem] font-medium text-gh-ink transition-colors duration-(--dur-micro) hover:bg-gh-ink/5',
  'over-hero:text-white over-hero:hover:bg-white/10',
  FOCUS,
);

const ICON_LINK = cn(
  'inline-flex size-11 items-center justify-center rounded-pill text-gh-ink transition-colors duration-(--dur-micro) hover:bg-gh-ink/5',
  'over-hero:text-white over-hero:hover:bg-white/10',
  FOCUS,
);

/**
 * Site header: warm ivory with the wordmark, departments, "Find my device", search and bag. Below md the
 * departments move into the menu sheet (MobileMenu) opened from the button left of the wordmark.
 * On the home page below lg it starts transparent over the hero and turns ivory once the page scrolls
 * (the `over-hero` variants in globals.css); everywhere else it is always ivory.
 */
export function Header({ solid = false }: HeaderProps) {
  return (
    <HeaderScrollState
      solid={solid}
      className={cn(
        'fixed inset-x-0 top-8 z-40 border-b border-gh-line bg-gh-ivory text-gh-ink transition-[top,background-color,border-color] duration-(--dur-ui) ease-out-expo data-past:top-0',
        'home:top-0 home:pt-[env(safe-area-inset-top)]',
        'header-over-hero:border-transparent header-over-hero:bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center gap-2 px-4 sm:px-6 lg:px-10 xl:px-14">
        <MobileMenu triggerClassName={ICON_LINK} departments={MOBILE_DEPARTMENTS} supportHours={SUPPORT_HOURS} />
        <Link href="/" className={cn('flex shrink-0 flex-col rounded-sm', FOCUS)} aria-label={`${BRAND_NAME} home`}>
          <Wordmark
            className="text-[1.375rem] text-gh-ink transition-colors duration-(--dur-ui) over-hero:text-white lg:text-2xl"
            hubClassName="over-hero:text-white"
          />
          {SHOW_PARENT_BRAND && (
            <span className="mt-1 hidden font-sans text-label leading-none font-bold tracking-[0.2em] text-gh-ink-muted uppercase md:block">
              by {PARENT_BRAND}
            </span>
          )}
        </Link>

        <nav aria-label="Primary" className="ml-4 hidden items-center gap-0.5 md:flex lg:ml-12">
          <ShopMenu triggerClassName={NAV_ITEM} />
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={NAV_ITEM}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-0.5 sm:gap-1.5">
          <MyPhoneChip className="lg:mr-2" />
          <Link href="/search" className={ICON_LINK} aria-label="Search">
            <Search className="size-[1.375rem]" strokeWidth={1.75} aria-hidden="true" />
          </Link>
          <CartButton className={ICON_LINK} />
        </div>
      </div>
    </HeaderScrollState>
  );
}

export default Header;
