'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import Skeleton from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/Badge';
import { AdminHeader } from '@/components/admin/DataTable';
import RevenueChart from '@/components/admin/RevenueChart';
import { adminApi } from '@/lib/api/services';
import { useAsyncData } from '@/lib/hooks';
import { formatCurrency, formatDate } from '@/lib/utils/format';

/**
 * Admin overview: headline figures, a two-week revenue chart, and the queues
 * that need attention (recent orders, low stock).
 */
export default function AdminDashboardPage() {
  const { data, isLoading } = useAsyncData(() => adminApi.dashboard(), []);

  const cards = data
    ? [
        {
          label: 'Total revenue',
          value: formatCurrency(data.cards.totalRevenue),
          sub: `${formatCurrency(data.cards.revenueLast30Days)} in the last 30 days`,
          icon: '💰',
          tone: 'bg-leaf-50 text-leaf-700',
        },
        {
          label: 'Orders',
          value: data.cards.totalOrders,
          sub: `${data.cards.pendingOrders} awaiting confirmation`,
          icon: '📦',
          tone: 'bg-honey-50 text-honey-700',
          href: '/admin/orders',
        },
        {
          label: 'Customers',
          value: data.cards.totalCustomers,
          sub: 'Registered accounts',
          icon: '👥',
          tone: 'bg-blue-50 text-blue-700',
          href: '/admin/customers',
        },
        {
          label: 'Products',
          value: data.cards.totalProducts,
          sub: `${data.cards.totalCategories} categories`,
          icon: '🍯',
          tone: 'bg-cream-200 text-bark-700',
          href: '/admin/products',
        },
        {
          label: 'Today',
          value: formatCurrency(data.cards.revenueToday),
          sub: 'Revenue booked today',
          icon: '📈',
          tone: 'bg-honey-50 text-honey-700',
        },
        {
          label: 'Low stock',
          value: data.cards.lowStockCount,
          sub: 'Products at or below threshold',
          icon: '⚠️',
          tone: 'bg-red-50 text-red-700',
          href: '/admin/products?lowStock=true',
        },
        {
          label: 'Pending reviews',
          value: data.cards.pendingReviews,
          sub: 'Waiting for moderation',
          icon: '⭐',
          tone: 'bg-cream-200 text-bark-700',
          href: '/admin/reviews',
        },
        {
          label: 'Active coupons',
          value: data.cards.activeCoupons,
          sub: 'Currently redeemable',
          icon: '🎟️',
          tone: 'bg-blue-50 text-blue-700',
          href: '/admin/coupons',
        },
      ]
    : [];

  return (
    <div>
      <AdminHeader
        title="Dashboard"
        description="How the farm is doing today, and what needs your attention."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-32 w-full rounded-[var(--radius-card)]" />
            ))
          : cards.map((card, index) => {
              const content = (
                <div className="h-full rounded-[var(--radius-card)] border border-bark-100 bg-white p-5 transition-shadow hover:shadow-[var(--shadow-soft)]">
                  <div className="flex items-start justify-between">
                    <span
                      className={`grid size-10 place-items-center rounded-xl text-lg ${card.tone}`}
                      aria-hidden="true"
                    >
                      {card.icon}
                    </span>
                  </div>
                  <p className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-bark-900">
                    {card.value}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-bark-700">{card.label}</p>
                  <p className="mt-1 text-[11px] text-bark-500">{card.sub}</p>
                </div>
              );

              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.3 }}
                >
                  {card.href ? <Link href={card.href}>{content}</Link> : content}
                </motion.div>
              );
            })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
          <h2 className="text-sm font-semibold text-bark-900">Revenue, last 14 days</h2>
          {isLoading ? (
            <Skeleton className="mt-6 h-56 w-full" />
          ) : (
            <RevenueChart series={data.revenueSeries} className="mt-6" />
          )}
        </section>

        <section className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
          <h2 className="text-sm font-semibold text-bark-900">Orders by status</h2>

          {isLoading ? (
            <Skeleton className="mt-6 h-56 w-full" />
          ) : (
            <ul className="mt-5 space-y-3">
              {Object.entries(data.ordersByStatus).map(([status, count]) => {
                const total = data.cards.totalOrders || 1;
                return (
                  <li key={status}>
                    <div className="flex items-center justify-between text-xs">
                      <StatusBadge status={status} size="sm" />
                      <span className="font-semibold text-bark-900">{count}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bark-100">
                      <motion.div
                        className="h-full rounded-full bg-honey-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / total) * 100}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-bark-900">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs font-medium text-honey-700 hover:underline">
              View all
            </Link>
          </div>

          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : data.recentOrders.length === 0 ? (
            <p className="py-10 text-center text-sm text-bark-400">No orders yet</p>
          ) : (
            <ul className="divide-y divide-bark-100">
              {data.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-cream-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-bark-900">
                        {order.orderNumber}
                      </p>
                      <p className="truncate text-[11px] text-bark-500">
                        {order.customerName} · {formatDate(order.placedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={order.status} size="sm" />
                      <span className="text-xs font-bold text-bark-900">
                        {formatCurrency(order.grandTotal)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-bark-900">Needs restocking</h2>
            <Link href="/admin/products" className="text-xs font-medium text-honey-700 hover:underline">
              Manage products
            </Link>
          </div>

          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : data.lowStockProducts.length === 0 ? (
            <p className="py-10 text-center text-sm text-bark-400">
              Every product is comfortably in stock 🎉
            </p>
          ) : (
            <ul className="divide-y divide-bark-100">
              {data.lowStockProducts.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-bark-900">{product.name}</p>
                    <p className="text-[11px] text-bark-500">{product.sku}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] font-bold ${
                      product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-honey-100 text-honey-800'
                    }`}
                  >
                    {product.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {!isLoading && data.topProducts.length > 0 && (
        <section className="mt-6 rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-bark-900">Best sellers</h2>
          <ul className="divide-y divide-bark-100">
            {data.topProducts.map((product, index) => (
              <li key={product.productId ?? index} className="flex items-center gap-4 py-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-honey-100 text-xs font-bold text-honey-800">
                  {index + 1}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm text-bark-800">{product.productName}</p>
                <span className="shrink-0 text-xs text-bark-500">{product.unitsSold} sold</span>
                <span className="w-24 shrink-0 text-right text-sm font-bold text-bark-900">
                  {formatCurrency(product.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
