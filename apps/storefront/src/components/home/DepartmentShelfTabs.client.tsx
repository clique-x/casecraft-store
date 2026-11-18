'use client';

import type { ReactNode } from 'react';
import { Tabs } from 'radix-ui';

interface Props {
  tabs: readonly { key: string; label: string }[];
  /** One panel per tab, in the same order; rendered on the server. */
  panels: ReactNode[];
}

/**
 * The tab strip of the department shelf. Every panel stays in the page (hidden while its tab is not chosen), so
 * its product links are there for search engines and switching is instant; a hidden panel's images are lazy and
 * not laid out, so they are not downloaded until its tab is opened.
 */
export function DepartmentShelfTabs({ tabs, panels }: Props) {
  if (tabs.length === 0) return null;
  return (
    <Tabs.Root defaultValue={tabs[0].key}>
      <Tabs.List
        aria-label="Departments"
        className="-mx-4 flex gap-2 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => (
          <Tabs.Trigger
            key={t.key}
            value={t.key}
            className="h-10 shrink-0 cursor-pointer rounded-full border border-border bg-paper px-4 text-sm font-semibold whitespace-nowrap text-fg outline-none transition-colors duration-200 hover:border-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand data-[state=active]:border-fg data-[state=active]:bg-fg data-[state=active]:text-paper"
          >
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((t, i) => (
        <Tabs.Content
          key={t.key}
          value={t.key}
          forceMount
          className="mt-6 outline-none duration-300 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=inactive]:hidden"
        >
          {panels[i]}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

export default DepartmentShelfTabs;
