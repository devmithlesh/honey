'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';

import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { ROUTES } from '@/config/site';
import { accountApi } from '@/lib/api/services';
import { useAsyncData } from '@/lib/hooks';
import { formatCurrency, formatDate } from '@/lib/utils/format';

const STATUS_FILTERS = [
  { value: '', label: 'All orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function MyOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useAsyncData(
    () => accountApi.listOrders({ page, limit: 10, status: status || undefined }),
    [page, status]
  );

  const orders = data?.orders || [];

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">My orders</h1>
          <p className="mt-2 text-sm text-bark-600">
            Every order you have placed, with its current status.
          </p>
        </div>

        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          aria-label="Filter orders by status"
          wrapperClassName="w-full sm:w-48"
          className="h-10 py-0 text-sm"
        >
          {STATUS_FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </Select>
      </header>

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded-[var(--radius-card)]" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon="📦"
            title={status ? `No ${status} orders` : 'No orders yet'}
            description={
              status
                ? 'Try a different status filter to see your other orders.'
                : 'Your orders will show up here once you have placed one.'
            }
            actionLabel="Browse the shop"
            actionHref={ROUTES.shop}
          />
        ) : (
          <ul className="space-y-4">
            {orders.map((order, index) => (
              <motion.li
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="overflow-hidden rounded-[var(--radius-card)] border border-bark-100 bg-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-bark-100 bg-cream-50 px-5 py-4">
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-sm font-bold text-bark-900">
                      {order.orderNumber}
                    </p>
                    <p className="mt-0.5 text-xs text-bark-500">
                      Placed on {formatDate(order.placedAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-bold text-bark-900">
                      {formatCurrency(order.grandTotal)}
                    </span>
                    <Link
                      href={ROUTES.accountOrder(order.orderNumber)}
                      className="rounded-[var(--radius-pill)] border border-bark-200 px-4 py-1.5 text-xs font-semibold text-bark-700 transition-colors hover:bg-white"
                    >
                      View details
                    </Link>
                  </div>
                </div>

                <ul className="flex gap-3 overflow-x-auto px-5 py-4">
                  {(order.items || []).map((item) => (
                    <li key={item.id} className="flex shrink-0 items-center gap-3">
                      <div className="relative size-12 overflow-hidden rounded-lg bg-cream-200">
                        {item.productImage ? (
                          <Image src={item.productImage} alt="" fill sizes="48px" className="object-cover" />
                        ) : (
                          <span className="grid h-full place-items-center text-base" aria-hidden="true">
                            🍯
                          </span>
                        )}
                      </div>
                      <div className="max-w-40">
                        <p className="truncate text-xs font-medium text-bark-800">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-bark-500">Qty {item.quantity}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.li>
            ))}
          </ul>
        )}

        <Pagination pagination={data?.pagination} onPageChange={setPage} className="mt-10" />
      </div>
    </div>
  );
}
