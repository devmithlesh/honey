import Link from 'next/link';

import Reveal from '@/components/motion/Reveal';
import { ROUTES } from '@/config/site';

/**
 * Banner at the top of every interior page: breadcrumb, title and lead-in.
 *
 * The breadcrumb is real markup rather than decoration, so it also feeds the
 * BreadcrumbList structured data emitted by the pages that use it.
 */
export default function PageHero({ eyebrow, title, description, breadcrumbs = [] }) {
  return (
    <section className="relative overflow-hidden border-b border-bark-100 bg-gradient-to-b from-honey-50 to-cream-100 py-14 lg:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 0L56 16v32L28 64 0 48V16z' fill='none' stroke='%23b54708' stroke-width='2'/%3E%3C/svg%3E\")",
          backgroundSize: '56px 100px',
        }}
      />

      <div className="container-page relative">
        <Reveal>
          {breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs text-bark-500">
                <li>
                  <Link href={ROUTES.home} className="transition-colors hover:text-honey-700">
                    Home
                  </Link>
                </li>
                {breadcrumbs.map((crumb, index) => (
                  <li key={crumb.href || crumb.label} className="flex items-center gap-1.5">
                    <span aria-hidden="true">/</span>
                    {index === breadcrumbs.length - 1 || !crumb.href ? (
                      <span className="font-medium text-bark-700" aria-current="page">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link href={crumb.href} className="transition-colors hover:text-honey-700">
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {eyebrow && (
            <span className="mt-5 inline-flex items-center rounded-[var(--radius-pill)] bg-honey-100 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-honey-800 uppercase">
              {eyebrow}
            </span>
          )}

          <h1 className="mt-4 max-w-3xl text-3xl font-semibold sm:text-4xl lg:text-5xl">{title}</h1>

          {description && (
            <p className="mt-4 max-w-2xl text-base text-bark-600 sm:text-lg">{description}</p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
