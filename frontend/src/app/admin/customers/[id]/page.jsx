'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Modal';
import { adminApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';
import { useAsyncData } from '@/lib/hooks';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format';

/**
 * Customer profile for the admin: contact details, lifetime figures, saved
 * addresses and recent orders, plus the account activation toggle.
 */
export default function AdminCustomerDetailPage() {
  const { id } = useParams();
  const { data, isLoading, error, reload } = useAsyncData(() => adminApi.getCustomer(id), [id]);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleStatus = async () => {
    setIsSaving(true);
    try {
      await adminApi.setCustomerStatus(id, !data.customer.isActive);
      toast.success(data.customer.isActive ? 'Customer deactivated' : 'Customer reactivated');
      setIsConfirmOpen(false);
      reload();
    } catch (caught) {
      toast.error(parseApiError(caught).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div role="status" aria-busy="true">
        <span className="sr-only">Loading customer…</span>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-6 h-40 w-full rounded-[var(--radius-card)]" />
        <Skeleton className="mt-4 h-72 w-full rounded-[var(--radius-card)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon="🔍"
        title="Customer not found"
        description="This account may have been removed."
        actionLabel="Back to customers"
        actionHref="/admin/customers"
      />
    );
  }

  const { customer, summary, orders, addresses } = data;

  const stats = [
    { label: 'Total orders', value: summary.totalOrders },
    { label: 'Lifetime value', value: formatCurrency(summary.totalSpent) },
    { label: 'Active orders', value: summary.activeOrders },
    { label: 'Delivered', value: summary.deliveredOrders },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-sm text-bark-600 transition-colors hover:text-honey-700"
      >
        <span aria-hidden="true">←</span> Back to customers
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-honey-200 text-lg font-bold text-honey-900">
            {(customer.name || '?').charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="text-xl font-semibold text-bark-900 sm:text-2xl">{customer.name}</h1>
            <p className="text-sm text-bark-500">{customer.email}</p>
            <p className="text-sm text-bark-500">{customer.phone || 'No phone number'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={customer.isActive ? 'success' : 'danger'}>
            {customer.isActive ? 'Active' : 'Deactivated'}
          </Badge>
          <Button
            variant={customer.isActive ? 'outline' : 'primary'}
            size="sm"
            onClick={() => setIsConfirmOpen(true)}
          >
            {customer.isActive ? 'Deactivate account' : 'Reactivate account'}
          </Button>
        </div>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-bark-900">
              {stat.value}
            </p>
            <p className="mt-0.5 text-xs text-bark-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-bark-900">Recent orders</h2>

          {orders.length === 0 ? (
            <p className="py-10 text-center text-sm text-bark-400">
              This customer has not placed an order yet
            </p>
          ) : (
            <ul className="divide-y divide-bark-100">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-cream-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-bark-900">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-bark-500">
                        {formatDate(order.placedAt)} · {order.items?.length || 0} item
                        {order.items?.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={order.status} size="sm" />
                      <span className="text-sm font-bold text-bark-900">
                        {formatCurrency(order.grandTotal)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-bark-900">Account</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Joined" value={formatDate(customer.createdAt)} />
              <Row
                label="Last signed in"
                value={customer.lastLoginAt ? formatDateTime(customer.lastLoginAt) : 'Never'}
              />
              <Row label="Role" value={<span className="capitalize">{customer.role}</span>} />
            </dl>
          </section>

          <section className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-bark-900">
              Saved addresses ({addresses.length})
            </h2>

            {addresses.length === 0 ? (
              <p className="py-6 text-center text-xs text-bark-400">No saved addresses</p>
            ) : (
              <ul className="space-y-3">
                {addresses.map((address) => (
                  <li key={address.id} className="rounded-xl bg-cream-50 p-3">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-bark-900">
                        {address.label || address.fullName}
                      </p>
                      {address.isDefault && (
                        <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-[10px] font-semibold text-leaf-800">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-bark-600">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state}{' '}
                      {address.postalCode}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={toggleStatus}
        isLoading={isSaving}
        title={customer.isActive ? 'Deactivate this account?' : 'Reactivate this account?'}
        description={
          customer.isActive
            ? 'They will be signed out immediately and cannot sign back in until you reactivate them. Their orders are untouched.'
            : 'They will be able to sign in and place orders again.'
        }
        confirmLabel={customer.isActive ? 'Deactivate' : 'Reactivate'}
      />
    </motion.div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-bark-500">{label}</dt>
      <dd className="text-right text-bark-900">{value}</dd>
    </div>
  );
}
