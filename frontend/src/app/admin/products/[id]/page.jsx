'use client';

import { useParams } from 'next/navigation';

import ProductForm from '@/components/admin/ProductForm';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { adminApi } from '@/lib/api/services';
import { useAsyncData } from '@/lib/hooks';

export default function EditProductPage() {
  const { id } = useParams();
  const { data: product, isLoading, error, reload } = useAsyncData(
    () => adminApi.getProduct(id),
    [id]
  );

  if (isLoading) {
    return (
      <div role="status" aria-busy="true">
        <span className="sr-only">Loading product…</span>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-[40rem] w-full rounded-[var(--radius-card)]" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <EmptyState
        icon="🔍"
        title="Product not found"
        description="It may have been deleted."
        actionLabel="Back to products"
        actionHref="/admin/products"
      />
    );
  }

  return <ProductForm product={product} onSaved={reload} />;
}
