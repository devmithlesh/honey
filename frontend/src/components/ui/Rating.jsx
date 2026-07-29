'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils/cn';

const Star = ({ fill = 0, className }) => (
  <svg viewBox="0 0 24 24" className={cn('size-4', className)} aria-hidden="true">
    <defs>
      {/* A per-star gradient renders half values (4.5 stars) precisely. */}
      <linearGradient id={`star-${fill}`}>
        <stop offset={`${fill * 100}%`} stopColor="currentColor" />
        <stop offset={`${fill * 100}%`} stopColor="transparent" />
      </linearGradient>
    </defs>
    <path
      d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.4l1.1-6.5L2.6 9.3l6.5-.9L12 2.5z"
      fill={fill > 0 ? `url(#star-${fill})` : 'transparent'}
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

/** Read-only star display. `value` may be fractional (e.g. 4.3). */
export default function Rating({ value = 0, count, size = 'md', className, showValue = false }) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div
        className={cn('flex text-honey-500', size === 'sm' ? '[&_svg]:size-3.5' : '[&_svg]:size-4')}
        role="img"
        aria-label={`Rated ${rating.toFixed(1)} out of 5`}
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} fill={Math.max(0, Math.min(1, rating - index))} />
        ))}
      </div>

      {showValue && rating > 0 && (
        <span className="text-xs font-medium text-bark-700">{rating.toFixed(1)}</span>
      )}

      {count !== undefined && (
        <span className="text-xs text-bark-500">
          ({count} {count === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}

/** Interactive star picker used by the review form. */
export function RatingInput({ value = 0, onChange, name = 'rating' }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          name={name}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="p-0.5 text-honey-500 transition-transform duration-150 hover:scale-115 focus-visible:scale-115"
        >
          <Star fill={star <= active ? 1 : 0} className="size-7" />
        </button>
      ))}
    </div>
  );
}
