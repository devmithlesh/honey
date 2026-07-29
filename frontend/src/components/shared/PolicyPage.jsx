import Link from 'next/link';

import PageHero from './PageHero';
import Reveal from '@/components/motion/Reveal';
import { ROUTES, siteConfig } from '@/config/site';

const RELATED = [
  { href: ROUTES.privacyPolicy, label: 'Privacy policy' },
  { href: ROUTES.termsConditions, label: 'Terms & conditions' },
  { href: ROUTES.shippingPolicy, label: 'Shipping policy' },
  { href: ROUTES.refundPolicy, label: 'Refund policy' },
];

/**
 * Shared renderer for the four legal pages.
 *
 * Each page supplies only its content object from `config/content.js`, so the
 * layout, table of contents and cross-links stay identical across all of them.
 */
export default function PolicyPage({ policy, currentHref, lastUpdated = '29 July 2026' }) {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title={policy.title}
        description={policy.intro}
        breadcrumbs={[{ label: policy.title }]}
      />

      <div className="container-page py-14 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_16rem] lg:gap-14">
          <Reveal>
            <p className="text-sm text-bark-500">Last updated: {lastUpdated}</p>

            <div className="mt-8 space-y-10">
              {policy.sections.map((section, index) => (
                <section key={section.heading} id={`section-${index + 1}`} className="scroll-mt-24">
                  <h2 className="text-xl font-semibold text-bark-900 sm:text-2xl">
                    {index + 1}. {section.heading}
                  </h2>

                  <div className="mt-4 space-y-4">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-sm leading-relaxed text-bark-600 sm:text-base">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-12 rounded-[var(--radius-card)] bg-cream-200 p-6">
              <h2 className="text-base font-semibold text-bark-900">Questions about this policy?</h2>
              <p className="mt-2 text-sm text-bark-600">
                Write to us at{' '}
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="font-semibold text-honey-700 underline underline-offset-4"
                >
                  {siteConfig.contact.email}
                </a>{' '}
                or call {siteConfig.contact.phone} and we will explain anything that is unclear.
              </p>
            </div>
          </Reveal>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav
              aria-label="On this page"
              className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5"
            >
              <p className="text-xs font-semibold tracking-wide text-bark-500 uppercase">
                On this page
              </p>
              <ol className="mt-3 space-y-2">
                {policy.sections.map((section, index) => (
                  <li key={section.heading}>
                    <a
                      href={`#section-${index + 1}`}
                      className="block text-sm text-bark-600 transition-colors hover:text-honey-700"
                    >
                      {index + 1}. {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <nav
              aria-label="Other policies"
              className="mt-4 rounded-[var(--radius-card)] border border-bark-100 bg-white p-5"
            >
              <p className="text-xs font-semibold tracking-wide text-bark-500 uppercase">
                Other policies
              </p>
              <ul className="mt-3 space-y-2">
                {RELATED.filter((item) => item.href !== currentHref).map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block text-sm text-bark-600 transition-colors hover:text-honey-700"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      </div>
    </>
  );
}
