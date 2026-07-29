'use client';

import { motion } from 'framer-motion';

import Skeleton from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';

/**
 * Table primitive for the admin lists.
 *
 * Columns declare a `cell` renderer plus an optional `hideBelow` breakpoint, so
 * a wide table degrades to the columns that matter on a phone instead of
 * forcing a horizontal scroll through everything.
 */
export default function DataTable({
  columns,
  rows,
  isLoading,
  emptyMessage = 'Nothing to show yet',
  getRowKey = (row) => row.id,
  onRowClick,
  skeletonRows = 6,
}) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-bark-100 bg-white">
        <div className="divide-y divide-bark-100" role="status" aria-busy="true">
          <span className="sr-only">Loading…</span>
          {Array.from({ length: skeletonRows }, (_, index) => (
            <div key={index} className="flex items-center gap-4 p-4">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="hidden h-4 w-28 sm:block" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-bark-200 bg-white px-6 py-16 text-center">
        <span className="text-3xl" aria-hidden="true">
          🗂️
        </span>
        <p className="mt-3 text-sm text-bark-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-bark-100 bg-white">
      <table className="w-full min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-bark-100 bg-cream-50">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'px-4 py-3 text-xs font-semibold tracking-wide text-bark-500 uppercase whitespace-nowrap',
                  column.hideBelow === 'sm' && 'hidden sm:table-cell',
                  column.hideBelow === 'md' && 'hidden md:table-cell',
                  column.hideBelow === 'lg' && 'hidden lg:table-cell',
                  column.align === 'right' && 'text-right'
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-bark-100">
          {rows.map((row, index) => (
            <motion.tr
              key={getRowKey(row)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(index * 0.02, 0.2) }}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'transition-colors',
                onRowClick ? 'cursor-pointer hover:bg-cream-50' : 'hover:bg-cream-50/60'
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-4 py-3.5 align-middle',
                    column.hideBelow === 'sm' && 'hidden sm:table-cell',
                    column.hideBelow === 'md' && 'hidden md:table-cell',
                    column.hideBelow === 'lg' && 'hidden lg:table-cell',
                    column.align === 'right' && 'text-right'
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Page heading used by every admin screen. */
export function AdminHeader({ title, description, children }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-bark-900 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-bark-600">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}
