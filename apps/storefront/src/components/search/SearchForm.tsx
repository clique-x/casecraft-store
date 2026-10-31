import Form from 'next/form';
import { SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchFormProps {
  defaultValue?: string;
  /** Distinguishes the input id when two forms share a page. */
  id?: string;
  className?: string;
}

/** GET form to /search; works without JavaScript and navigates client-side with it. */
export function SearchForm({ defaultValue = '', id = 'search-q', className }: SearchFormProps) {
  return (
    <Form action="/search" role="search" className={cn('flex w-full max-w-xl gap-2', className)}>
      <label htmlFor={id} className="sr-only">
        Search covers
      </label>
      <div className="relative min-w-0 flex-1">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-muted"
        />
        <input
          // Remount on a new query so the uncontrolled value follows client-side navigation.
          key={defaultValue}
          id={id}
          name="q"
          type="search"
          defaultValue={defaultValue}
          maxLength={80}
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Phone model, design or brand"
          className="h-12 w-full rounded-[10px] border border-border bg-paper pr-3 pl-10 text-base text-fg outline-none placeholder:text-fg-muted focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/25"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-12 shrink-0 items-center rounded-[10px] bg-fg px-5 text-sm font-semibold text-paper transition-colors duration-(--dur-micro) hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Search
      </button>
    </Form>
  );
}
