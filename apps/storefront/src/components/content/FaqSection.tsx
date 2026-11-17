import { faqJsonLd, type Faq } from '@/lib/seo/structured-data';

interface FaqSectionProps {
  faqs: readonly Faq[];
  heading?: string;
  /** Unique on the page; ties the heading to the section. */
  id?: string;
  className?: string;
}

/**
 * Common questions as plain text (visible to buyers and to search engines), with matching FAQPage data.
 * Every answer must be true for the page it is on: build them from the product data and the shop's policies.
 */
export function FaqSection({ faqs, heading = 'Questions before you buy', id = 'faq', className = '' }: FaqSectionProps) {
  if (faqs.length === 0) return null;
  return (
    <section aria-labelledby={`${id}-heading`} className={className}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd(faqs) }} />
      <h2 id={`${id}-heading`} className="font-sans text-h3 font-bold text-fg">
        {heading}
      </h2>
      <div className="mt-4 flex flex-col divide-y divide-border rounded-[1rem] border border-border bg-paper">
        {faqs.map((f) => (
          <div key={f.q} className="px-5 py-4">
            <h3 className="font-semibold text-fg">{f.q}</h3>
            <p className="mt-1.5 text-sm text-pretty text-fg-muted">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
