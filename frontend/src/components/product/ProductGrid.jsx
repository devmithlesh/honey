'use client';

import ProductCard from './ProductCard';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { ROUTES } from '@/config/site';
import { cn } from '@/lib/utils/cn';

/**
 * Responsive product grid with its own loading and empty states, so every place
 * that lists products behaves identically.
 */
export default function ProductGrid({
  products = [],
  isLoading = false,
  skeletonCount = 8,
  emptyTitle = 'No products found',
  emptyDescription = 'Try adjusting your filters or search for something else.',
  className,
  columns = 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}) {
  const gridClass = cn('grid grid-cols-2 gap-4 sm:gap-6', columns, className);

  if (isLoading) {
    return (
      <div className={gridClass} role="status" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading products…</span>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <div key={index} className="space-y-3 rounded-[var(--radius-card)] bg-white p-4">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full rounded-[var(--radius-pill)]" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel="Browse all honey"
        actionHref={ROUTES.shop}
      />
    );
  }

  return (
    <RevealGroup className={gridClass}>
      {products.map((product, index) => (
        <RevealItem key={product.id}>
          <ProductCard product={product} priority={index < 4} className="h-full" />
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
