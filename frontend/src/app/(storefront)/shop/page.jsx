import { Suspense } from 'react';

import PageHero from '@/components/shared/PageHero';
import ShopBrowser from '@/components/shop/ShopBrowser';
import Skeleton from '@/components/ui/Skeleton';
import { fetchCategories, fetchProducts } from '@/lib/api/server';
import { siteConfig } from '@/config/site';

export const metadata = {
  title: 'Shop raw honey',
  description:
    'Browse raw, organic, forest and mustard honey, beeswax and gift packs — all harvested from our own hives and lab-tested for purity.',
  alternates: { canonical: '/shop' },
  openGraph: {
    title: `Shop raw honey | ${siteConfig.name}`,
    description: 'Raw, organic and forest honey harvested from our own hives.',
    url: '/shop',
  },
};

const PAGE_SIZE = 12;

/**
 * Shop page.
 *
 * The first result page is fetched on the server so the catalogue is present in
 * the HTML for crawlers, then handed to the client browser component which
 * takes over filtering, sorting and pagination.
 */
export default async function ShopPage({ searchParams }) {
  // Next 16: `searchParams` is a Promise and must be awaited.
  const params = await searchParams;

  const query = {
    page: params.page || '1',
    limit: PAGE_SIZE,
    search: params.search,
    category: params.category,
    minRating: params.minRating,
    maxPrice: params.maxPrice,
    inStock: params.inStock,
    sort: params.sort || 'newest',
  };

  const [productsResult, categoriesResult] = await Promise.all([
    fetchProducts(query),
    fetchCategories(),
  ]);

  // Identifies exactly which query the server rendered, so the client component
  // can skip an immediate duplicate fetch of the same page.
  const key = ['search', 'category', 'minRating', 'maxPrice', 'inStock', 'sort', 'page']
    .map((field) => (field === 'sort' ? query.sort : field === 'page' ? query.page : params[field] || ''))
    .join('|');

  const initialData = {
    key,
    products: productsResult.data || [],
    pagination: productsResult.meta?.pagination || null,
  };

  return (
    <>
      <PageHero
        eyebrow="Shop"
        title="Every honey we make, in one place"
        description="Raw, organic, forest and mustard honey, plus beeswax and gift packs. Filter by category, price or rating to find your jar."
        breadcrumbs={[{ label: 'Shop' }]}
      />

      {/*
        `useSearchParams` requires a Suspense boundary: without one the whole
        route would be forced out of static rendering.
      */}
      <Suspense fallback={<ShopSkeleton />}>
        <ShopBrowser categories={categoriesResult.data || []} initialData={initialData} />
      </Suspense>
    </>
  );
}

function ShopSkeleton() {
  return (
    <div className="container-page py-10 lg:py-14" role="status" aria-busy="true">
      <span className="sr-only">Loading the shop…</span>
      <div className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-10">
        <Skeleton className="hidden h-[32rem] w-full rounded-[var(--radius-card)] lg:block" />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
          {Array.from({ length: 9 }, (_, index) => (
            <Skeleton key={index} className="aspect-[3/4] w-full rounded-[var(--radius-card)]" />
          ))}
        </div>
      </div>
    </div>
  );
}
