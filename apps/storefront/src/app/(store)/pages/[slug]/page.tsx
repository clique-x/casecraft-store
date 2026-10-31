import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Fragment } from 'react';
import { Crumbs } from '@/components/listing/Crumbs';
import { PAGE_SHELL } from '@/components/listing/ListingHeader';
import { BRAND_NAME, SITE_URL } from '@/lib/brand';
import { getPolicy, POLICIES, POLICIES_UPDATED, POLICY_SLUGS, type Block, type Inline } from '@/lib/content/policies';

interface PolicyPageProps {
  params: Promise<{ slug: string }>;
}

const UPDATED_LABEL = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
  new Date(`${POLICIES_UPDATED}T00:00:00Z`),
);

const LINK =
  'rounded-sm font-semibold text-fg underline underline-offset-4 transition-colors duration-(--dur-micro) hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2';

// The six help pages; any other slug falls through to notFound().
export function generateStaticParams(): { slug: string }[] {
  return POLICY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getPolicy(slug);
  if (!page) return { title: 'Page not found', robots: { index: false, follow: true } };
  const url = new URL(`/pages/${page.slug}`, SITE_URL).toString();
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      siteName: BRAND_NAME,
      title: `${page.title} · ${BRAND_NAME}`,
      description: page.description,
      url,
    },
  };
}

function InlineText({ parts }: { parts: readonly Inline[] }) {
  return parts.map((part, i) => {
    if (typeof part === 'string') return <Fragment key={i}>{part}</Fragment>;
    if (part.href.startsWith('/')) {
      return (
        <Link key={i} href={part.href} className={LINK}>
          {part.label}
        </Link>
      );
    }
    return (
      <a key={i} href={part.href} target="_blank" rel="noopener noreferrer" className={LINK}>
        {part.label}
      </a>
    );
  });
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'p':
      return (
        <p className="text-body text-pretty text-fg-muted">
          <InlineText parts={block.text} />
        </p>
      );
    case 'list':
      return (
        <ul className="flex list-disc flex-col gap-2 pl-5 text-body text-fg-muted marker:text-fg-muted">
          {block.items.map((item, i) => (
            <li key={i} className="text-pretty">
              <InlineText parts={item} />
            </li>
          ))}
        </ul>
      );
    case 'facts':
      return (
        <dl className="divide-y divide-border rounded-card border border-border bg-surface-2">
          {block.rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-6">
              <dt className="shrink-0 text-sm font-semibold text-fg sm:w-36">{row.label}</dt>
              <dd className="text-body text-fg-muted">
                <InlineText parts={row.value} />
              </dd>
            </div>
          ))}
        </dl>
      );
  }
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = await params;
  const page = getPolicy(slug);
  if (!page) notFound();

  const others = POLICY_SLUGS.filter((s) => s !== page.slug).map((s) => POLICIES[s]);

  return (
    <div className={PAGE_SHELL}>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <article className="flex max-w-3xl flex-col gap-4 lg:col-span-8">
          <Crumbs trail={[{ name: page.title, href: `/pages/${page.slug}` }]} />
          <h1 className="font-display text-h2 font-extrabold text-balance text-fg">{page.title}</h1>
          <p className="text-caption text-fg-muted">
            Last updated <time dateTime={POLICIES_UPDATED}>{UPDATED_LABEL}</time>
          </p>
          <p className="mt-2 text-lg text-pretty text-fg">
            <InlineText parts={page.intro} />
          </p>

          {page.sections.map((section) => (
            <section key={section.heading} className="mt-6 flex flex-col gap-3">
              <h2 className="font-sans text-h3 text-fg">{section.heading}</h2>
              {section.blocks.map((block, i) => (
                <BlockView key={i} block={block} />
              ))}
            </section>
          ))}
        </article>

        <aside className="lg:col-span-4 lg:pt-10">
          <nav aria-label="Help and policies" className="rounded-card border border-border p-5 lg:sticky lg:top-28">
            <h2 className="font-sans text-label font-bold tracking-[0.2em] text-fg-muted uppercase">Help &amp; policies</h2>
            <ul className="mt-4 flex flex-col gap-1">
              {others.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/pages/${other.slug}`}
                    className="flex min-h-11 items-center rounded-[10px] px-3 text-sm font-semibold text-fg transition-colors duration-(--dur-micro) hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
                  >
                    {other.navLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}
