'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';
import { ROUTES } from '@/config/site';
import { accountApi } from '@/lib/api/services';
import { useAsyncData, useAuth } from '@/lib/hooks';
import { formatCurrency, formatDate } from '@/lib/utils/format';

/**
 * Customer dashboard landing page: a summary of the account plus the five most
 * recent orders, all from one aggregated endpoint.
 */
export default function AccountDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useAsyncData(() => accountApi.getDashboard(), []);

  const summary = data?.summary;
  const recentOrders = data?.recentOrders || [];

  const cards = [
    { label: 'Total orders', value: summary?.totalOrders ?? 0, icon: '📦', href: ROUTES.accountOrders },
    {
      label: 'Total spent',
      value: formatCurrency(summary?.totalSpent ?? 0),
      icon: '💰',
      href: ROUTES.accountOrders,
    },
    { label: 'Wishlist', value: summary?.wishlistCount ?? 0, icon: '💛', href: ROUTES.accountWishlist },
    {
      label: 'Saved addresses',
      value: summary?.addressCount ?? 0,
      icon: '📍',
      href: ROUTES.accountAddresses,
    },
  ];

  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">
          Hello, {user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="mt-2 text-sm text-bark-600">
          Here is what has been happening on your account.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-[var(--radius-card)]" />
            ))
          : cards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.35 }}
              >
                <Link
                  href={card.href}
                  className="block h-full rounded-[var(--radius-card)] border border-bark-100 bg-white p-5 transition-shadow hover:shadow-[var(--shadow-soft)]"
                >
                  <span className="text-xl" aria-hidden="true">
                    {card.icon}
                  </span>
                  <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-bark-900">
                    {card.value}
                  </p>
                  <p className="mt-0.5 text-xs text-bark-500">{card.label}</p>
                </Link>
              </motion.div>
            ))}
      </div>

      {summary?.activeOrders > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] bg-honey-100 px-5 py-4"
        >
          <p className="text-sm text-honey-900">
            You have <span className="font-bold">{summary.activeOrders}</span> order
            {summary.activeOrders === 1 ? '' : 's'} on the way.
          </p>
          <Link
            href={ROUTES.accountOrders}
            className="text-sm font-semibold text-honey-800 underline underline-offset-4"
          >
            Track them
          </Link>
        </motion.div>
      )}

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-bark-900">Recent orders</h2>
          {recentOrders.length > 0 && (
            <Link
              href={ROUTES.accountOrders}
              className="text-sm font-medium text-honey-700 hover:underline"
            >
              View all
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-[var(--radius-card)]" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No orders yet"
            description="When you place your first order it will appear here, with live tracking."
            actionLabel="Start shopping"
            actionHref={ROUTES.shop}
          />
        ) : (
          <ul className="space-y-3">
            {recentOrders.map((order, index) => (
              <motion.li
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Link
                  href={ROUTES.accountOrder(order.orderNumber)}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border border-bark-100 bg-white p-5 transition-shadow hover:shadow-[var(--shadow-soft)]"
                >
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-sm font-bold text-bark-900">
                      {order.orderNumber}
                    </p>
                    <p className="mt-1 text-xs text-bark-500">
                      {formatDate(order.placedAt)} · {order.items?.length || 0} item
                      {order.items?.length === 1 ? '' : 's'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-bold text-bark-900">
                      {formatCurrency(order.grandTotal)}
                    </span>
                  </div>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
