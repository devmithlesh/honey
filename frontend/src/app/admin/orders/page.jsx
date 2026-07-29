'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import DataTable, { AdminHeader } from '@/components/admin/DataTable';
import Pagination from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/Badge';
import Input, { Select } from '@/components/ui/Input';
import { adminApi } from '@/lib/api/services';
import { useAsyncData, useDebouncedValue } from '@/lib/hooks';
import { formatCurrency, formatDate } from '@/lib/utils/format';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const { data, isLoading } = useAsyncData(
    () =>
      adminApi.listOrders({
        page,
        limit: 20,
        status: status || undefined,
        search: debouncedSearch || undefined,
      }),
    [page, status, debouncedSearch]
  );

  const columns = [
    {
      key: 'orderNumber',
      header: 'Order',
      cell: (order) => (
        <div>
          <p className="font-semibold text-bark-900">{order.orderNumber}</p>
          <p className="text-xs text-bark-500 sm:hidden">{formatDate(order.placedAt)}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      hideBelow: 'sm',
      cell: (order) => (
        <div className="min-w-0">
          <p className="truncate text-bark-800">{order.customerName}</p>
          <p className="truncate text-xs text-bark-500">{order.customerPhone}</p>
        </div>
      ),
    },
    {
      key: 'placedAt',
      header: 'Placed',
      hideBelow: 'md',
      cell: (order) => <span className="text-bark-600">{formatDate(order.placedAt)}</span>,
    },
    {
      key: 'items',
      header: 'Items',
      hideBelow: 'lg',
      cell: (order) => <span className="text-bark-600">{order.items?.length || 0}</span>,
    },
    {
      key: 'payment',
      header: 'Payment',
      hideBelow: 'lg',
      cell: (order) => (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-bark-600 uppercase">{order.payment?.method || '—'}</span>
          <StatusBadge status={order.payment?.status} size="sm" />
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (order) => <StatusBadge status={order.status} size="sm" />,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      cell: (order) => (
        <span className="font-bold text-bark-900">{formatCurrency(order.grandTotal)}</span>
      ),
    },
  ];

  return (
    <div>
      <AdminHeader
        title="Orders"
        description="Every order placed on the storefront. Click a row to open it."
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <Input
          type="search"
          placeholder="Search by order number, name, email or phone"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          aria-label="Search orders"
          wrapperClassName="min-w-0 flex-1 sm:max-w-md"
        />

        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
          wrapperClassName="w-full sm:w-48"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.rows}
        isLoading={isLoading}
        emptyMessage="No orders match those filters"
        onRowClick={(order) => router.push(`/admin/orders/${order.id}`)}
      />

      <Pagination pagination={data?.pagination} onPageChange={setPage} className="mt-6" />
    </div>
  );
}
