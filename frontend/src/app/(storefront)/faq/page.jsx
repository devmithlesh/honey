import Link from 'next/link';

import PageHero from '@/components/shared/PageHero';
import Accordion from '@/components/shared/Accordion';
import Reveal from '@/components/motion/Reveal';
import WhatsAppLink from '@/components/shared/WhatsAppLink';
import { FAQS } from '@/config/content';
import { ROUTES, siteConfig } from '@/config/site';

export const metadata = {
  title: 'Frequently asked questions',
  description:
    'Answers to the questions we hear most — about raw honey, crystallisation, delivery times, payment methods and returns.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: `FAQ | ${siteConfig.name}`,
    description: 'Everything customers ask us about our honey, delivery and returns.',
    url: '/faq',
  },
};

export default function FaqPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PageHero
        eyebrow="FAQ"
        title="Questions, answered"
        description="Everything customers ask us about the honey, the delivery and what happens if something goes wrong."
        breadcrumbs={[{ label: 'FAQ' }]}
      />

      <div className="container-page py-14 lg:py-20">
        <Reveal className="mx-auto max-w-3xl">
          <Accordion items={FAQS} defaultOpenIndex={0} />
        </Reveal>

        <Reveal className="mx-auto mt-14 max-w-3xl" delay={0.1}>
          <div className="rounded-[var(--radius-card)] bg-honey-50 px-6 py-10 text-center sm:px-10">
            <span className="text-3xl" aria-hidden="true">
              💬
            </span>
            <h2 className="mt-4 text-2xl font-semibold">Still have a question?</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-bark-600">
              We answer every message ourselves — no call centre, no scripts. Usually within a couple
              of hours during working days.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href={ROUTES.contact}
                className="inline-flex h-11 items-center rounded-[var(--radius-pill)] bg-honey-500 px-6 text-sm font-semibold text-bark-900 transition-colors hover:bg-honey-400"
              >
                Send us a message
              </Link>

              <WhatsAppLink
                message={`Hello ${siteConfig.name}, I have a question that is not in your FAQ.`}
                className="inline-flex h-11 items-center rounded-[var(--radius-pill)] border border-bark-200 bg-white px-6 text-sm font-semibold text-bark-800 transition-colors hover:bg-bark-50"
              >
                Chat on WhatsApp
              </WhatsAppLink>
            </div>
          </div>
        </Reveal>
      </div>
    </>
  );
}
