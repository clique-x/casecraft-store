import type { DepartmentGuide as Guide } from '@/lib/content/department-guides';

/** A department's buying guide and common questions, under its products: plain text that buyers and search engines can read. */
export function DepartmentGuide({ guide, className = '' }: { guide: Guide; className?: string }) {
  return (
    <section aria-labelledby="department-guide" className={`grid gap-8 rounded-[1.25rem] border border-border bg-paper p-5 sm:p-8 lg:grid-cols-2 lg:gap-12 ${className}`}>
      <div>
        <h2 id="department-guide" className="text-[1.375rem] leading-tight font-bold tracking-[-0.02em] text-fg">
          {guide.heading}
        </h2>
        <dl className="mt-5 flex flex-col gap-4">
          {guide.tips.map((t) => (
            <div key={t.title}>
              <dt className="font-semibold text-fg">{t.title}</dt>
              <dd className="mt-1 text-sm text-fg-muted">{t.body}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <h2 className="text-[1.375rem] leading-tight font-bold tracking-[-0.02em] text-fg">Questions before you buy</h2>
        <div className="mt-5 flex flex-col gap-4">
          {guide.faqs.map((f) => (
            <div key={f.q}>
              <h3 className="font-semibold text-fg">{f.q}</h3>
              <p className="mt-1 text-sm text-fg-muted">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
