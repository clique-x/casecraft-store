import Link from 'next/link';
import { Search, ShoppingBag } from 'lucide-react';
import { BRAND_NAME, PARENT_BRAND, SHOW_PARENT_BRAND } from '@/lib/brand';
import { HeaderScrollState } from './HeaderScrollState.client';
import { MyPhoneChip } from './MyPhoneChip.client';

interface HeaderProps {
  solid?: boolean;
}

const NAV = [
  { href: '/trending', label: 'Trending' },
  { href: '/categories', label: 'Looks' },
  { href: '/phones', label: 'Phones' },
] as const;

const ICON_LINK =
  'inline-flex size-10 items-center justify-center rounded-pill text-fg-on-ink transition-colors duration-(--dur-micro) hover:bg-fg-on-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2';

export function Header({ solid = false }: HeaderProps) {
  return (
    <HeaderScrollState
      solid={solid}
      className="fixed inset-x-0 top-0 z-40 text-fg-on-ink transition-[background-color,box-shadow] duration-(--dur-ui) ease-out-expo data-scrolled:bg-ink/80 data-scrolled:shadow-[0_1px_0_0_var(--color-surface-glass)] data-scrolled:backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 flex-col rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
          aria-label={`${BRAND_NAME} home`}
        >
          <span className="truncate font-sans text-xl leading-none font-extrabold tracking-[-0.02em]">{BRAND_NAME}</span>
          {SHOW_PARENT_BRAND && (
            <span className="mt-1 hidden font-sans text-label leading-none font-bold tracking-[0.2em] text-fg-on-ink-muted uppercase md:block">
              by {PARENT_BRAND}
            </span>
          )}
        </Link>

        <nav aria-label="Primary" className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-pill px-3 py-2 text-sm font-semibold text-fg-on-ink-muted transition-colors duration-(--dur-micro) hover:bg-fg-on-ink/10 hover:text-fg-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <MyPhoneChip />
          <Link href="/search" className={ICON_LINK} aria-label="Search">
            <Search className="size-5" aria-hidden="true" />
          </Link>
          <Link href="/cart" className={ICON_LINK} aria-label="Cart">
            <ShoppingBag className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </HeaderScrollState>
  );
}

export default Header;
