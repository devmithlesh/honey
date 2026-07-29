'use client';

import { cn } from '@/lib/utils/cn';

/**
 * Builds a compact page list with ellipses: 1 … 4 5 6 … 12.
 *
 * Rendering every page number breaks the layout as soon as a catalogue grows,
 * so only the current neighbourhood plus the two ends are shown.
 */
const buildPages = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('…');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < total - 1) pages.push('…');

  pages.push(total);
  return pages;
};

export default function Pagination({ pagination, onPageChange, className }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { currentPage, totalPages, hasPreviousPage, hasNextPage } = pagination;
  const pages = buildPages(currentPage, totalPages);

  const buttonClass = (isActive) =>
    cn(
      'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors duration-200',
      isActive
        ? 'bg-honey-500 text-bark-900'
        : 'border border-bark-200 bg-white text-bark-700 hover:bg-honey-50 disabled:opacity-40 disabled:hover:bg-white'
    );

  return (
    <nav className={cn('flex flex-wrap items-center justify-center gap-2', className)} aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPreviousPage}
        className={buttonClass(false)}
      >
        Previous
      </button>

      {pages.map((page, index) =>
        page === '…' ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-bark-400" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            className={buttonClass(page === currentPage)}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        className={buttonClass(false)}
      >
        Next
      </button>
    </nav>
  );
}
