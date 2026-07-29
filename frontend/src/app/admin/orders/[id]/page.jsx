'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Select, Textarea } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import OrderTimeline from '@/components/account/OrderTimeline';
import InvoiceButton from '@/components/admin/InvoiceButton';
import { adminApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';
import { useAsyncData } from '@/lib/hooks';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

/**
 * Legal forward transitions, mirroring ORDER_STATUS_FLOW on the API. The select
 * only offers moves the server will accept, so an admin cannot be shown an
 * option that is guaranteed to fail.
 */
const NEXT_STATUSES = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const PAYMENT_STATUSES = ['pending', 'awaiting_verification', 'paid', 'failed', 'refunded'];

export default function AdminOrderDetailPage() {
  const { id } = useParams();

  const { data: order, isLoading, error, reload } = useAsyncData(() => adminApi.getOrder(id), [id]);

  const [nextStatus, setNextStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  const updateStatus = async () => {
    if (!nextStatus) return;

    setIsUpdating(true);
    try {
      await adminApi.updateOrderStatus(id, {
        status: nextStatus,
        adminNote: adminNote || undefined,
        cancelReason: nextStatus === 'cancelled' ? adminNote || 'Cancelled by admin' : undefined,
      });
      toast.success(`Order marked as ${nextStatus}`);
      setNextStatus('');
      setAdminNote('');
      reload();
    } catch (caught) {
      toast.error(parseApiError(caught).message);
    } finally {
      setIsUpdating(false);
    }
  };

  const updatePayment = async () => {
    if (!paymentStatus) return;

    setIsUpdatingPayment(true);
    try {
      await adminApi.updateOrderPayment(id, { status: paymentStatus });
      toast.success('Payment updated');
      setPaymentStatus('');
      reload();
    } catch (caught) {
      toast.error(parseApiError(caught).message);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div role="status" aria-busy="true">
        <span className="sr-only">Loading order…</span>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-32 w-full rounded-[var(--radius-card)]" />
        <Skeleton className="mt-4 h-96 w-full rounded-[var(--radius-card)]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <EmptyState
        icon="🔍"
        title="Order not found"
        description="This order may have been deleted."
        actionLabel="Back to orders"
        actionHref="/admin/orders"
      />
    );
  }

  const allowedStatuses = NEXT_STATUSES[order.status] || [];
  const shipping = order.shippingAddress || {};
  const billing = order.billingAddress || shipping;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-bark-600 transition-colors hover:text-honey-700"
      >
        <span aria-hidden="true">←</span> Back to orders
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-bark-900">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-bark-500">Placed {formatDateTime(order.placedAt)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={order.status} />
          <InvoiceButton orderId={id} />
        </div>
      </header>

      <section className="mt-6 rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
        <OrderTimeline order={order} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-bark-900">Items</h2>

            <ul className="divide-y divide-bark-100">
              {(order.items || []).map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3 first:pt-0">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                    {item.productImage ? (
                      <Image src={item.productImage} alt="" fill sizes="48px" className="object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center" aria-hidden="true">
                        🍯
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-bark-900">{item.productName}</p>
                    <p className="text-xs text-bark-500">
                      {item.productSku}
                      {item.weight ? ` · ${item.weight}` : ''}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-bark-500">
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </p>
                    <p className="text-sm font-bold text-bark-900">
                      {formatCurrency(item.lineTotal)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-bark-100 pt-4 text-sm">
              <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
              {Number(order.discountTotal) > 0 && (
                <Row
                  label={order.couponCode ? `Discount (${order.couponCode})` : 'Discount'}
                  value={`− ${formatCurrency(order.discountTotal)}`}
                />
              )}
              <Row label="Shipping" value={formatCurrency(order.shippingTotal)} />
              <div className="flex justify-between border-t border-bark-100 pt-2">
                <dt className="font-semibold text-bark-900">Total</dt>
                <dd className="text-lg font-bold text-bark-900">
                  {formatCurrency(order.grandTotal)}
                </dd>
              </div>
            </dl>
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card title="Shipping address">
              <Address address={shipping} />
            </Card>
            <Card title="Billing address">
              <Address address={billing} />
            </Card>
          </div>

          {(order.customerNote || order.adminNote) && (
            <Card title="Notes">
              {order.customerNote && (
                <div>
                  <p className="text-xs font-semibold text-bark-500">From the customer</p>
                  <p className="mt-1 text-sm text-bark-700">{order.customerNote}</p>
                </div>
              )}
              {order.adminNote && (
                <div className={order.customerNote ? 'mt-4' : ''}>
                  <p className="text-xs font-semibold text-bark-500">Internal note</p>
                  <p className="mt-1 text-sm text-bark-700">{order.adminNote}</p>
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-bark-900">Update status</h2>

            {allowedStatuses.length === 0 ? (
              <p className="rounded-xl bg-cream-100 px-4 py-3 text-xs text-bark-600">
                This order is {order.status} — no further transitions are possible.
              </p>
            ) : (
              <div className="space-y-4">
                <Select
                  label="Move to"
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value)}
                >
                  <option value="">Choose a status…</option>
                  {allowedStatuses.map((status) => (
                    <option key={status} value={status} className="capitalize">
                      {status}
                    </option>
                  ))}
                </Select>

                <Textarea
                  label={nextStatus === 'cancelled' ? 'Reason for cancelling' : 'Internal note'}
                  rows={3}
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  placeholder={
                    nextStatus === 'cancelled'
                      ? 'Why is this being cancelled? Stock is returned automatically.'
                      : 'Optional note for your team'
                  }
                />

                <Button
                  onClick={updateStatus}
                  disabled={!nextStatus}
                  isLoading={isUpdating}
                  loadingText="Updating…"
                  className="w-full"
                >
                  Update status
                </Button>
              </div>
            )}
          </section>

          <section className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-bark-900">Payment</h2>

            <dl className="space-y-2 text-sm">
              <Row label="Method" value={<span className="uppercase">{order.payment?.method}</span>} />
              <Row label="Status" value={<StatusBadge status={order.payment?.status} size="sm" />} />
              <Row label="Amount" value={formatCurrency(order.payment?.amount)} />
              {order.payment?.transactionReference && (
                <Row
                  label="Reference"
                  value={<span className="select-all">{order.payment.transactionReference}</span>}
                />
              )}
              {order.payment?.paidAt && (
                <Row label="Paid at" value={formatDateTime(order.payment.paidAt)} />
              )}
            </dl>

            <div className="mt-4 space-y-3 border-t border-bark-100 pt-4">
              <Select
                label="Set payment status"
                value={paymentStatus}
                onChange={(event) => setPaymentStatus(event.target.value)}
              >
                <option value="">Choose…</option>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </Select>

              <Button
                onClick={updatePayment}
                disabled={!paymentStatus}
                isLoading={isUpdatingPayment}
                variant="outline"
                className="w-full"
              >
                Update payment
              </Button>
            </div>
          </section>

          <Card title="Customer">
            <p className="text-sm font-semibold text-bark-900">{order.customerName}</p>
            <p className="mt-1 text-sm text-bark-600">{order.customerEmail}</p>
            <p className="mt-0.5 text-sm text-bark-600">{order.customerPhone}</p>

            {order.userId ? (
              <Link
                href={`/admin/customers/${order.userId}`}
                className="mt-3 inline-block text-xs font-semibold text-honey-700 hover:underline"
              >
                View customer account →
              </Link>
            ) : (
              <p className="mt-3 text-xs text-bark-400">Guest checkout (no account)</p>
            )}
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
      <h2 className="mb-3 text-xs font-semibold tracking-wide text-bark-500 uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Address({ address }) {
  return (
    <p className="text-sm leading-relaxed text-bark-600">
      <span className="font-semibold text-bark-900">{address.fullName}</span>
      <br />
      {address.line1}
      {address.line2 && (
        <>
          <br />
          {address.line2}
        </>
      )}
      <br />
      {address.city}, {address.state} {address.postalCode}
      <br />
      {address.country}
      <br />
      {address.phone}
    </p>
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
