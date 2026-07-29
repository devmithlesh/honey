'use client';

import { motion, useReducedMotion } from 'framer-motion';

import SectionHeading from './SectionHeading';

const STEPS = [
  {
    number: '01',
    title: 'Place the hives',
    body: 'Colonies are set at the forest edge, moved with the blossom so the bees always have clean forage.',
  },
  {
    number: '02',
    title: 'Let the bees work',
    body: 'We wait until the comb is capped, which is the bees telling us the honey is ripe and low in moisture.',
  },
  {
    number: '03',
    title: 'Cold extract',
    body: 'Frames are spun at room temperature. No heat, so nothing living in the honey is destroyed.',
  },
  {
    number: '04',
    title: 'Strain, never filter',
    body: 'A coarse strain removes wax only. The pollen — the part that makes honey traceable — stays in.',
  },
  {
    number: '05',
    title: 'Test every batch',
    body: 'Each batch is checked for purity, moisture and residue before a single jar is filled.',
  },
  {
    number: '06',
    title: 'Jar and dispatch',
    body: 'Filled into glass, batch-coded and shipped within days of leaving the hive.',
  },
];

/**
 * Process timeline.
 *
 * The connector line scales in as the section scrolls into view, so the steps
 * read as a sequence rather than six unrelated cards.
 */
export default function BeeFarmingProcess() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="container-page py-20 lg:py-28">
      <SectionHeading
        eyebrow="Our process"
        title="From blossom to jar in six steps"
        description="Nothing here is complicated. It is just slower and more careful than the industrial alternative."
      />

      <div className="relative mt-16">
        <motion.div
          aria-hidden="true"
          className="absolute top-0 left-[19px] hidden w-0.5 origin-top bg-gradient-to-b from-honey-300 via-honey-200 to-transparent lg:block"
          style={{ height: '100%' }}
          initial={prefersReducedMotion ? false : { scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />

        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 lg:gap-0">
          {STEPS.map((step, index) => (
            <motion.li
              key={step.number}
              className="relative lg:flex lg:gap-8 lg:pb-10 lg:pl-0"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="z-10 grid size-10 shrink-0 place-items-center rounded-full bg-honey-500 font-[family-name:var(--font-display)] text-sm font-bold text-bark-900">
                {step.number}
              </span>

              <div className="mt-4 rounded-[var(--radius-card)] border border-bark-100 bg-white p-5 lg:mt-0 lg:flex-1 lg:border-0 lg:bg-transparent lg:p-0 lg:pt-1.5">
                <h3 className="text-base font-semibold text-bark-900">{step.title}</h3>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-bark-600">{step.body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
