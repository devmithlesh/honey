'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import Button from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { useDebouncedValue } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'popular', label: 'Most popular' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'name-asc', label: 'Name: A to Z' },
];

const RATING_OPTIONS = [4, 3, 2, 1];
const PRICE_CEILING = 3000;

/**
 * Catalogue filter panel.
 *
 * On desktop it is a sticky sidebar; on mobile the same component renders as a
 * slide-up sheet, so the filter logic exists once rather than twice.
 */
export default function ShopFilters({
  categories = [],
  filters,
  onChange,
  onReset,
  isOpen,
  onClose,
  resultCount,
}) {
  // The search box is local state so typing stays responsive; the debounced
  // value is what actually triggers a request.
  const [searchDraft, setSearchDraft] = useState(filters.search || '');
  const debouncedSearch = useDebouncedValue(searchDraft, 400);

  /**
   * Re-syncs the box when the URL changes from outside (back button, a "clear
   * filters" click). Adjusting state during render — rather than in an effect —
   * is React's own recommendation for resetting state on a prop change.
   */
  const [lastAppliedSearch, setLastAppliedSearch] = useState(filters.search || '');
  if (lastAppliedSearch !== (filters.search || '')) {
    setLastAppliedSearch(filters.search || '');
    setSearchDraft(filters.search || '');
  }

  useEffect(() => {
    if (debouncedSearch !== (filters.search || '')) {
      onChange({ search: debouncedSearch, page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const body = (
    <div className="space-y-8">
      <FilterBlock label="Search">
        <div className="relative">
          <input
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search honey, beeswax…"
            aria-label="Search products"
            className="w-full rounded-xl border border-bark-200 bg-white py-2.5 pr-4 pl-10 text-sm text-bark-800 placeholder:text-bark-300 focus:border-honey-400 focus:ring-4 focus:ring-honey-100 focus:outline-none"
          />
          <svg
            viewBox="0 0 24 24"
            className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-bark-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
        </div>
      </FilterBlock>

      <FilterBlock label="Category">
        <ul className="space-y-1">
          <FilterOption
            isActive={!filters.category}
            onClick={() => onChange({ category: '', page: 1 })}
            label="All products"
          />
          {categories.map((category) => (
            <FilterOption
              key={category.id}
              isActive={filters.category === category.slug}
              onClick={() => onChange({ category: category.slug, page: 1 })}
              label={category.name}
              count={category.productCount}
            />
          ))}
        </ul>
      </FilterBlock>

      <FilterBlock label="Maximum price">
        <input
          type="range"
          min={100}
          max={PRICE_CEILING}
          step={50}
          value={filters.maxPrice || PRICE_CEILING}
          onChange={(event) =>
            onChange({
              maxPrice: Number(event.target.value) === PRICE_CEILING ? '' : event.target.value,
              page: 1,
            })
          }
          aria-label="Maximum price"
          className="w-full accent-honey-500"
        />
        <div className="mt-2 flex justify-between text-xs text-bark-500">
          <span>{formatCurrency(100)}</span>
          <span className="font-semibold text-bark-800">
            {filters.maxPrice ? formatCurrency(filters.maxPrice) : `${formatCurrency(PRICE_CEILING)}+`}
          </span>
        </div>
      </FilterBlock>

      <FilterBlock label="Customer rating">
        <ul className="space-y-1">
          <FilterOption
            isActive={!filters.minRating}
            onClick={() => onChange({ minRating: '', page: 1 })}
            label="Any rating"
          />
          {RATING_OPTIONS.map((rating) => (
            <FilterOption
              key={rating}
              isActive={String(filters.minRating) === String(rating)}
              onClick={() => onChange({ minRating: rating, page: 1 })}
              label={`${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} & up`}
            />
          ))}
        </ul>
      </FilterBlock>

      <FilterBlock label="Availability">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-bark-700">
          <input
            type="checkbox"
            checked={Boolean(filters.inStock)}
            onChange={(event) => onChange({ inStock: event.target.checked ? 'true' : '', page: 1 })}
            className="size-4 rounded border-bark-300 accent-honey-500"
          />
          In stock only
        </label>
      </FilterBlock>

      <Button variant="outline" onClick={onReset} className="w-full">
        Clear all filters
      </Button>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-[var(--radius-card)] border border-bark-100 bg-white p-6 pr-4">
          {body}
        </div>
      </aside>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-bark-900/45 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              aria-hidden="true"
            />

            <motion.div
              className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-2xl bg-cream-50 p-6"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              role="dialog"
              aria-modal="true"
              aria-label="Filter products"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-bark-900">Filters</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close filters"
                  className="rounded-lg p-2 text-bark-500 hover:bg-bark-100"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {body}

              <Button onClick={onClose} className="mt-6 w-full">
                Show {resultCount ?? 0} product{resultCount === 1 ? '' : 's'}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function FilterBlock({ label, children }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold tracking-wide text-bark-500 uppercase">{label}</h3>
      {children}
    </div>
  );
}

function FilterOption({ isActive, onClick, label, count }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isActive}
        className={cn(
          'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
          isActive ? 'bg-honey-100 font-semibold text-honey-800' : 'text-bark-700 hover:bg-bark-50'
        )}
      >
        <span>{label}</span>
        {count !== undefined && <span className="text-xs text-bark-400">{count}</span>}
      </button>
    </li>
  );
}

/** Sort dropdown, kept beside the results header rather than inside the panel. */
export function SortSelect({ value, onChange }) {
  return (
    <Select
      value={value}
      onChange={(event) => onChange({ sort: event.target.value, page: 1 })}
      aria-label="Sort products"
      className="h-10 py-0 text-sm"
      wrapperClassName="w-full sm:w-52"
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
