'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/lib/utils/cn';

/**
 * Description / benefits / ingredients / delivery tabs.
 *
 * The tab underline is a shared `layoutId`, so it slides between tabs rather
 * than blinking on and off.
 */
export default function ProductTabs({ product }) {
  const tabs = [
    { id: 'description', label: 'Description', content: product.description },
    { id: 'benefits', label: 'Benefits', content: product.benefits },
    { id: 'ingredients', label: 'Ingredients', content: product.ingredients },
    {
      id: 'delivery',
      label: 'Delivery & returns',
      content:
        'Dispatched within 24 hours on working days. Metro cities usually receive their parcel in 2–4 working days and the rest of India within 4–7. If a jar arrives damaged, send us a photo within 48 hours and we will replace it.',
    },
  ].filter((tab) => Boolean(tab.content));

  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const active = tabs.find((tab) => tab.id === activeId);

  if (tabs.length === 0) return null;

  return (
    <div>
      <div role="tablist" aria-label="Product information" className="flex gap-1 overflow-x-auto border-b border-bark-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={tab.id === activeId}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveId(tab.id)}
            className={cn(
              'relative shrink-0 px-4 py-3 text-sm font-medium transition-colors',
              tab.id === activeId ? 'text-honey-800' : 'text-bark-500 hover:text-bark-800'
            )}
          >
            {tab.label}
            {tab.id === activeId && (
              <motion.span
                layoutId="product-tab-underline"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-honey-500"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeId}
          id={`panel-${activeId}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeId}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="pt-6"
        >
          {/*
            These fields are newline-separated plain text from the admin form,
            so each line renders as its own paragraph or bullet.
          */}
          {activeId === 'benefits' ? (
            <ul className="space-y-2.5">
              {String(active.content)
                .split('\n')
                .filter(Boolean)
                .map((line) => (
                  <li key={line} className="flex gap-3 text-sm leading-relaxed text-bark-600">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-honey-500" aria-hidden="true" />
                    {line}
                  </li>
                ))}
            </ul>
          ) : (
            <div className="space-y-4">
              {String(active.content)
                .split('\n')
                .filter(Boolean)
                .map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-bark-600">
                    {paragraph}
                  </p>
                ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
