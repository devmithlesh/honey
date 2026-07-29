'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import Rating from '@/components/ui/Rating';
import SectionHeading from './SectionHeading';

const TESTIMONIALS = [
  {
    name: 'Ananya Sharma',
    location: 'Bengaluru',
    rating: 5,
    quote:
      'I grew up on my grandmother’s honey and had given up finding anything close. This is closer than close — it even crystallises the same way.',
  },
  {
    name: 'Rahul Menon',
    location: 'Kochi',
    rating: 5,
    quote:
      'Ordered the forest honey on a whim and now it is a standing monthly order. Dark, malty and nothing like the supermarket stuff.',
  },
  {
    name: 'Priya Nair',
    location: 'Pune',
    rating: 4,
    quote:
      'Packaging arrived perfectly intact and the batch code actually works — you can see exactly which apiary your jar came from.',
  },
  {
    name: 'Vikram Desai',
    location: 'Ahmedabad',
    rating: 5,
    quote:
      'My son’s winter cough settles with a spoon of this before bed. That alone has earned it a permanent place in the kitchen.',
  },
];

const ROTATE_MS = 6500;

/**
 * Auto-rotating testimonial carousel.
 *
 * The timer pauses on hover and is disabled entirely under reduced-motion, so
 * the text never slides away from someone in the middle of reading it.
 */
export default function Testimonials() {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback((next) => {
    setIndex((next + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return undefined;

    const timer = setInterval(() => goTo(index + 1), ROTATE_MS);
    return () => clearInterval(timer);
  }, [index, isPaused, prefersReducedMotion, goTo]);

  const active = TESTIMONIALS[index];

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow="Testimonials"
          title="What our customers say"
          description="Over twelve thousand jars delivered, and these are the words we keep hearing back."
        />

        <div
          className="mx-auto mt-14 max-w-3xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          role="region"
          aria-roledescription="carousel"
          aria-label="Customer testimonials"
        >
          <div className="relative min-h-[19rem] sm:min-h-[15rem]">
            <AnimatePresence mode="wait">
              <motion.figure
                key={index}
                className="absolute inset-0 flex flex-col items-center rounded-[var(--radius-card)] border border-bark-100 bg-cream-50 p-8 text-center sm:p-10"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <Rating value={active.rating} />

                <blockquote className="mt-5 flex-1 text-lg leading-relaxed text-bark-700 sm:text-xl">
                  “{active.quote}”
                </blockquote>

                <figcaption className="mt-6">
                  <span className="block text-sm font-semibold text-bark-900">{active.name}</span>
                  <span className="mt-0.5 block text-xs text-bark-500">{active.location}</span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            {TESTIMONIALS.map((testimonial, dotIndex) => (
              <button
                key={testimonial.name}
                type="button"
                onClick={() => goTo(dotIndex)}
                aria-label={`Show review ${dotIndex + 1} of ${TESTIMONIALS.length}`}
                aria-current={dotIndex === index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  dotIndex === index ? 'w-8 bg-honey-500' : 'w-2 bg-bark-200 hover:bg-bark-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
