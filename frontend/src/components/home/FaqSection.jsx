import Link from 'next/link';

import Accordion from '@/components/shared/Accordion';
import SectionHeading from './SectionHeading';
import Reveal from '@/components/motion/Reveal';
import { FAQS } from '@/config/content';
import { ROUTES } from '@/config/site';

/** Home-page FAQ teaser — the first five questions, with a link to the rest. */
export default function FaqSection() {
  return (
    <section className="container-page py-20 lg:py-28">
      <SectionHeading
        eyebrow="Questions"
        title="Everything people ask us"
        description="If your question is not here, the full list is on our FAQ page — or just message us."
      />

      <Reveal className="mx-auto mt-12 max-w-3xl">
        <Accordion items={FAQS.slice(0, 5)} />

        <p className="mt-6 text-center text-sm text-bark-600">
          Still curious?{' '}
          <Link href={ROUTES.faq} className="font-semibold text-honey-700 underline underline-offset-4">
            Read all {FAQS.length} questions
          </Link>
        </p>
      </Reveal>
    </section>
  );
}
