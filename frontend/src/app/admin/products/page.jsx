'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import DataTable, { AdminHeader } from '@/components/admin/DataTable';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import Input, { Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/Modal';
import { adminApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';
import { useAsyncData, useDebouncedValue } from '@/lib/hooks';
import { formatCurrency, getEffectivePrice } from '@/lib/utils/format';

export default function AdminProductsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 400);

  const { data: categories } = useAsyncData(() => adminApi.listCategories(), []);
  const { data, isLoading, reload } = useAsyncData(
    () =>
      adminApi.listProducts({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        category: category || undefined,
      }),
    [page, debouncedSearch, category]
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await adminApi.deleteProduct(deleteTarget.id);
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      reload();
    } catch (error) {
      toast.error(parseApiError(error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'product',
      header: 'Product',
      cell: (product) => (
        <div className="flex items-center gap-3">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-cream-200">
            {product.images?.[0] ? (
              <Image src={product.images[0].url} alt="" fill sizes="44px" className="object-cover" />
            ) : (
              <span className="grid h-full place-items-center" aria-hidden="true">
                🍯
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-bark-900">{product.name}</p>
            <p className="truncate text-xs text-bark-500">
              {product.sku}
              {product.weight ? ` · ${product.weight}` : ''}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      hideBelow: 'md',
      cell: (product) => <span className="text-bark-600">{product.category?.name || '—'}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      hideBelow: 'sm',
      cell: (product) => {
        const price = getEffectivePrice(product);
        const hasDiscount = price < Number(product.price);
        return (
          <div>
            <span className="font-semibold text-bark-900">{formatCurrency(price)}</span>
            {hasDiscount && (
              <span className="ml-1.5 text-xs text-bark-400 line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'stock',
      header: 'Stock',
      cell: (product) => (
        <span
          className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold ${
            product.stock === 0
              ? 'bg-red-100 text-red-700'
              : product.stock <= (product.lowStockThreshold ?? 10)
                ? 'bg-honey-100 text-honey-800'
                : 'bg-leaf-100 text-leaf-800'
          }`}
        >
          {product.stock}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      hideBelow: 'lg',
      cell: (product) => (
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={product.isActive ? 'success' : 'neutral'} size="sm">
            {product.isActive ? 'Active' : 'Hidden'}
          </Badge>
          {product.isFeatured && (
            <Badge tone="honey" size="sm">
              Featured
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (product) => (
        <div className="flex justify-end gap-1">
          <Link
            href={`/admin/products/${product.id}`}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-bark-700 transition-colors hover:bg-bark-100"
            onClick={(event) => event.stopPropagation()}
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setDeleteTarget(product);
            }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--color-danger)] transition-colors hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminHeader title="Products" description="Add, edit and retire the jars you sell.">
        <Button href="/admin/products/new" size="sm">
          Add product
        </Button>
      </AdminHeader>

      <div className="mb-5 flex flex-wrap gap-3">
        <Input
          type="search"
          placeholder="Search by name or SKU"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          aria-label="Search products"
          wrapperClassName="min-w-0 flex-1 sm:max-w-md"
        />

        <Select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
          aria-label="Filter by category"
          wrapperClassName="w-full sm:w-52"
        >
          <option value="">All categories</option>
          {(categories || []).map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.rows}
        isLoading={isLoading}
        emptyMessage="No products match those filters"
        onRowClick={(product) => router.push(`/admin/products/${product.id}`)}
      />

      <Pagination pagination={data?.pagination} onPageChange={setPage} className="mt-6" />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={`Delete ${deleteTarget?.name}?`}
        description="The product is removed from the storefront. Existing orders keep their record of it."
        confirmLabel="Delete product"
      />
    </div>
  );
}
