'use client';

import Image from 'next/image';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/lib/utils/cn';

/**
 * Product image gallery with thumbnails.
 *
 * The main image cross-fades between selections, and the thumbnail strip is a
 * real tablist so arrow keys and screen readers work as expected.
 */
export default function ProductGallery({ images = [], productName, discountPercent = 0 }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  if (images.length === 0) {
    return (
      <div className="grid aspect-square place-items-center rounded-[var(--radius-card)] bg-cream-200 text-6xl">
        <span aria-hidden="true">🍯</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-cream-200">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id ?? activeIndex}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={active.url}
              alt={active.altText || productName}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {discountPercent > 0 && (
          <span className="absolute top-4 left-4 rounded-[var(--radius-pill)] bg-honey-500 px-3 py-1.5 text-xs font-bold text-bark-900">
            Save {discountPercent}%
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div role="tablist" aria-label="Product images" className="flex gap-3 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id ?? index}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`View image ${index + 1} of ${images.length}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'relative size-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200',
                index === activeIndex
                  ? 'border-honey-500 opacity-100'
                  : 'border-transparent opacity-65 hover:opacity-100'
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
