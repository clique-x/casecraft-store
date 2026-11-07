'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/** Every department, so the routes the old flat nav linked to (Trending, Looks, Phones) stay one click away. */
const GROUPS: readonly { heading: string; links: readonly { href: string; label: string; note: string }[] }[] = [
  {
    heading: 'Covers',
    links: [
      { href: '/trending', label: 'Trending', note: 'What shoppers pick this week' },
      { href: '/collections/new', label: 'New arrivals', note: 'Just photographed in the shop' },
      { href: '/categories', label: 'Shop by look', note: 'Carbon, clear, solid, stands' },
      { href: '/phones', label: 'Shop by phone', note: 'Covers cut for your model' },
    ],
  },
  {
    heading: 'More',
    links: [
      { href: '/audio', label: 'Audio', note: 'boAt and realme earbuds and speakers' },
      { href: '/storage', label: 'Storage', note: 'Memory cards, pen drives, SSDs, RAM' },
      { href: '/cameras', label: 'Cameras', note: 'CP Plus Wi-Fi security cameras' },
      { href: '/accessories', label: 'Protection', note: 'FLAYR and G-TEL glass, back films' },
    ],
  },
];

/** "Shop" disclosure in the header: a button that shows a panel of department links. */
export function ShopMenu({ triggerClassName }: { triggerClassName: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onBlur={(e) => {
        // Tabbing out of the trigger and panel closes the menu.
        if (open && !wrapRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={triggerClassName}
      >
        Shop
        <ChevronDown
          className={cn('size-4 opacity-70 transition-transform duration-(--dur-ui) ease-out-expo', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute top-full left-0 z-50 mt-3 w-[34rem] rounded-2xl bg-gh-ivory p-3 text-gh-ink shadow-[0_24px_60px_-24px_rgba(0,22,25,.45)] ring-1 ring-gh-line"
      >
        <div className="grid grid-cols-2 gap-2">
          {GROUPS.map((group) => (
            <div key={group.heading}>
              <p className="px-3 pt-2 pb-1 text-label font-bold tracking-[0.18em] text-gh-ink-muted uppercase">{group.heading}</p>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onNavigate={() => setOpen(false)}
                      className="flex min-h-11 flex-col justify-center rounded-xl px-3 py-2 transition-colors duration-(--dur-micro) hover:bg-gh-ivory-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
                    >
                      <span className="text-[0.9375rem] font-semibold">{link.label}</span>
                      <span className="text-caption text-gh-ink-muted">{link.note}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ShopMenu;
