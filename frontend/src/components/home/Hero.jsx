'use client';

import { motion, useReducedMotion } from 'framer-motion';

import Button from '@/components/ui/Button';
import { ROUTES } from '@/config/site';

const TRUST_POINTS = [
  { value: '100%', label: 'Raw & unfiltered' },
  { value: '40+', label: 'Hives we tend' },
  { value: '12k+', label: 'Happy customers' },
  { value: '4.8★', label: 'Average rating' },
];

/**
 * Landing hero.
 *
 * The honeycomb backdrop is an inline SVG pattern rather than an image, so it
 * costs nothing to download and scales crisply at any viewport size.
 */
export default function Hero() {
  const prefersReducedMotion = useReducedMotion();

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
  };

  const item = prefersReducedMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 22 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
      };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-honey-50 via-cream-100 to-cream-100 pt-10 pb-20 lg:pt-16 lg:pb-28">
      <HoneycombBackdrop />

      <div className="container-page relative">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-honey-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-honey-800 backdrop-blur"
          >
            <span aria-hidden="true">🍯</span> This season&apos;s harvest is in
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 text-4xl leading-[1.08] font-semibold sm:text-5xl lg:text-6xl"
          >
            Pure raw honey,
            <br />
            <span className="text-honey-600">straight from our hives</span>
          </motion.h1>

          <motion.p variants={item} className="mx-auto mt-6 max-w-xl text-lg text-bark-600">
            Cold-extracted, never heated and never blended. Every jar is traceable to the hive it
            came from and lab-tested before it reaches your kitchen.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap justify-center gap-3">
            <Button href={ROUTES.shop} size="lg">
              Shop our honey
            </Button>
            <Button href={ROUTES.about} variant="outline" size="lg">
              Meet the beekeepers
            </Button>
          </motion.div>

          <motion.dl
            variants={item}
            className="mx-auto mt-14 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4"
          >
            {TRUST_POINTS.map((point) => (
              <div key={point.label} className="text-center">
                <dt className="sr-only">{point.label}</dt>
                <dd>
                  <span className="block font-[family-name:var(--font-display)] text-2xl font-semibold text-bark-900 sm:text-3xl">
                    {point.value}
                  </span>
                  <span className="mt-1 block text-xs text-bark-500 sm:text-sm">{point.label}</span>
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>
      </div>
    </section>
  );
}

function HoneycombBackdrop() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 0L56 16v32L28 64 0 48V16z' fill='none' stroke='%23b54708' stroke-width='2'/%3E%3Cpath d='M28 64l28 16v32L28 128 0 112V80z' fill='none' stroke='%23b54708' stroke-width='2'/%3E%3C/svg%3E\")",
          backgroundSize: '56px 100px',
        }}
      />

      {/* Two slow-drifting blobs give the section depth without a hero image. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-honey-200/50 blur-3xl"
        animate={prefersReducedMotion ? undefined : { y: [0, 22, 0], x: [0, -14, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-leaf-200/40 blur-3xl"
        animate={prefersReducedMotion ? undefined : { y: [0, -18, 0], x: [0, 16, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
      />
    </>
  );
}
