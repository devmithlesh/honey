'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import DataTable, { AdminHeader } from '@/components/admin/DataTable';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import Input, { Select } from '@/components/ui/Input';
import { adminApi } from '@/lib/api/services';
import { useAsyncData, useDebouncedValue } from '@/lib/hooks';
import { formatDate } from '@/lib/utils/format';

export default function AdminCustomersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  const debouncedSearch = useDebouncedValue(search, 400);

  const { data, isLoading } = useAsyncData(
    () => adminApi.listCustomers({ page, limit: 20, search: debouncedSearch || undefined, sort }),
    [page, debouncedSearch, sort]
  );

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      cell: (customer) => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-honey-100 text-xs font-bold text-honey-800">
            {(customer.name || '?').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-bark-900">{customer.name}</p>
            <p className="truncate text-xs text-bark-500">{customer.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      hideBelow: 'md',
      cell: (customer) => <span className="text-bark-600">{customer.phone || '—'}</span>,
    },
    {
      key: 'orders',
      header: 'Orders',
      hideBelow: 'sm',
      cell: (customer) => <span className="font-semibold text-bark-900">{customer.orderCount}</span>,
    },
    {
      key: 'joined',
      header: 'Joined',
      hideBelow: 'lg',
      cell: (customer) => <span className="text-bark-600">{formatDate(customer.createdAt)}</span>,
    },
    {
      key: 'lastLogin',
      header: 'Last seen',
      hideBelow: 'lg',
      cell: (customer) => (
        <span className="text-bark-600">
          {customer.lastLoginAt ? formatDate(customer.lastLoginAt) : 'Never'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      cell: (customer) => (
        <Badge tone={customer.isActive ? 'success' : 'danger'} size="sm">
          {customer.isActive ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <AdminHeader
        title="Customers"
        description="Everyone with a storefront account. Click a row for their full history."
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <Input
          type="search"
          placeholder="Search by name, email or phone"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          aria-label="Search customers"
          wrapperClassName="min-w-0 flex-1 sm:max-w-md"
        />

        <Select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            setPage(1);
          }}
          aria-label="Sort customers"
          wrapperClassName="w-full sm:w-44"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.rows}
        isLoading={isLoading}
        emptyMessage="No customers match that search"
        onRowClick={(customer) => router.push(`/admin/customers/${customer.id}`)}
      />

      <Pagination pagination={data?.pagination} onPageChange={setPage} className="mt-6" />
    </div>
  );
}
