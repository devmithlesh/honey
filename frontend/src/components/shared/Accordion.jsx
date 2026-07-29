'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { cn } from '@/lib/utils/cn';

/**
 * Disclosure list used by the FAQ section and page.
 *
 * `aria-expanded` and `aria-controls` tie the trigger to its panel, so the
 * component behaves correctly for keyboard and screen-reader users rather than
 * only looking right.
 */
export default function Accordion({ items, defaultOpenIndex = 0, className }) {
  const [openIndex, setOpenIndex] = useState(defaultOpenIndex);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={cn('divide-y divide-bark-100 overflow-hidden rounded-[var(--radius-card)] border border-bark-100 bg-white', className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `accordion-panel-${index}`;
        const buttonId = `accordion-button-${index}`;

        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-cream-50 sm:px-6"
              >
                <span className="text-sm font-semibold text-bark-900 sm:text-base">
                  {item.question}
                </span>

                <motion.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-honey-100 text-honey-800"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </motion.span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm leading-relaxed text-bark-600 sm:px-6">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
