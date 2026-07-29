'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import ProductGrid from '@/components/product/ProductGrid';
import Pagination from '@/components/ui/Pagination';
import ShopFilters, { SortSelect } from './ShopFilters';
import { catalogApi } from '@/lib/api/services';
import { useAsyncData } from '@/lib/hooks';
import { ROUTES } from '@/config/site';

const FILTER_KEYS = ['search', 'category', 'minRating', 'maxPrice', 'inStock', 'sort', 'page'];

/**
 * Interactive catalogue.
 *
 * Filter state lives in the URL rather than component state, so a filtered view
 * can be shared, bookmarked and reached with the browser's back button. The
 * first page is server-rendered and handed in as `initialData`, which is what
 * keeps the shop indexable despite the client-side filtering.
 */
export default function ShopBrowser({ categories = [], initialData }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    const current = {};
    FILTER_KEYS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) current[key] = value;
    });
    return { sort: 'newest', page: '1', ...current };
  }, [searchParams]);

  const queryKey = FILTER_KEYS.map((key) => filters[key] || '').join('|');

  /**
   * The mobile filter sheet remembers which query it was opened against, so any
   * filter change dismisses it by derivation rather than through an effect.
   */
  const [openedAtQuery, setOpenedAtQuery] = useState(null);
  const isFilterOpen = openedAtQuery === queryKey;
  const setIsFilterOpen = (open) => setOpenedAtQuery(open ? queryKey : null);

  // The server already rendered exactly this query, so the first client render
  // reuses it instead of immediately refetching the same page.
  const isInitialQuery = queryKey === initialData?.key;

  const { data, isLoading } = useAsyncData(
    () =>
      catalogApi.listProducts({
        page: filters.page,
        limit: 12,
        search: filters.search || undefined,
        category: filters.category || undefined,
        minRating: filters.minRating || undefined,
        maxPrice: filters.maxPrice || undefined,
        inStock: filters.inStock || undefined,
        sort: filters.sort,
      }),
    [queryKey],
    { enabled: !isInitialQuery }
  );

  const products = isInitialQuery && !data ? initialData.products : data?.products || [];
  const pagination = isInitialQuery && !data ? initialData.pagination : data?.pagination;
  const showLoading = isLoading && !isInitialQuery;

  const applyFilters = useCallback(
    (changes) => {
      const next = new URLSearchParams(searchParams.toString());

      Object.entries(changes).forEach(([key, value]) => {
        if (value === '' || value === undefined || value === null) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });

      // `scroll: false` keeps the viewport steady while filters change; page
      // changes scroll to the top of the results deliberately, below.
      router.push(`${ROUTES.shop}?${next.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const resetFilters = useCallback(() => router.push(ROUTES.shop), [router]);

  const changePage = useCallback(
    (page) => {
      applyFilters({ page });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [applyFilters]
  );

  const activeFilterCount = ['search', 'category', 'minRating', 'maxPrice', 'inStock'].filter(
    (key) => filters[key]
  ).length;

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-10">
        <ShopFilters
          categories={categories}
          filters={filters}
          onChange={applyFilters}
          onReset={resetFilters}
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          resultCount={pagination?.totalItems}
        />

        <div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-bark-600" aria-live="polite">
              {showLoading ? (
                'Loading products…'
              ) : (
                <>
                  <span className="font-semibold text-bark-900">{pagination?.totalItems ?? 0}</span>{' '}
                  product{pagination?.totalItems === 1 ? '' : 's'}
                  {filters.search && (
                    <>
                      {' '}
                      for <span className="font-semibold">“{filters.search}”</span>
                    </>
                  )}
                </>
              )}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-bark-200 bg-white px-4 text-sm font-medium text-bark-700 lg:hidden"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-honey-500 text-[11px] font-bold text-bark-900">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <SortSelect value={filters.sort} onChange={applyFilters} />
            </div>
          </div>

          <ProductGrid
            products={products}
            isLoading={showLoading}
            skeletonCount={12}
            columns="sm:grid-cols-2 xl:grid-cols-3"
            emptyTitle="No honey matches those filters"
            emptyDescription="Try widening your price range or clearing the search term."
          />

          <Pagination pagination={pagination} onPageChange={changePage} className="mt-12" />
        </div>
      </div>
    </div>
  );
}
