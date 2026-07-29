'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import OrderTimeline from '@/components/account/OrderTimeline';
import { ROUTES } from '@/config/site';
import { accountApi, checkoutApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';
import { useAsyncData } from '@/lib/hooks';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

const CANCELLABLE_STATUSES = ['pending', 'confirmed'];

/**
 * Single order view: status timeline, line items, addresses and payment.
 */
export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params.orderNumber;

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const { data: order, isLoading, error, reload } = useAsyncData(
    () => checkoutApi.getOrder(orderNumber),
    [orderNumber]
  );

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await accountApi.cancelOrder(orderNumber, 'Cancelled from my account');
      toast.success('Order cancelled — any payment will be returned');
      setIsCancelOpen(false);
      reload();
    } catch (caught) {
      toast.error(parseApiError(caught).message);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div role="status" aria-busy="true">
        <span className="sr-only">Loading order…</span>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-6 h-32 w-full rounded-[var(--radius-card)]" />
        <Skeleton className="mt-4 h-64 w-full rounded-[var(--radius-card)]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <EmptyState
        icon="🔍"
        title="Order not found"
        description="We could not find that order on your account. Check the number, or contact us and we will look into it."
        actionLabel="Back to my orders"
        actionHref={ROUTES.accountOrders}
      />
    );
  }

  const canCancel = CANCELLABLE_STATUSES.includes(order.status);
  const shipping = order.shippingAddress || {};
  const billing = order.billingAddress || shipping;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Link
        href={ROUTES.accountOrders}
        className="inline-flex items-center gap-1.5 text-sm text-bark-600 transition-colors hover:text-honey-700"
      >
        <span aria-hidden="true">←</span> Back to my orders
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
            {order.orderNumber}
          </h1>
          <p className="mt-1.5 text-sm text-bark-500">Placed {formatDateTime(order.placedAt)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={order.status} />
          {canCancel && (
            <Button variant="outline" size="sm" onClick={() => setIsCancelOpen(true)}>
              Cancel order
            </Button>
          )}
        </div>
      </header>

      {order.status === 'cancelled' && order.cancelReason && (
        <div className="mt-6 rounded-[var(--radius-card)] border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-red-800">This order was cancelled</p>
          <p className="mt-1 text-sm text-red-700">{order.cancelReason}</p>
        </div>
      )}

      <section className="mt-8 rounded-[var(--radius-card)] border border-bark-100 bg-white p-6">
        <h2 className="text-sm font-semibold tracking-wide text-bark-500 uppercase">Progress</h2>
        <OrderTimeline order={order} className="mt-6" />
      </section>

      <section className="mt-6 rounded-[var(--radius-card)] border border-bark-100 bg-white p-6">
        <h2 className="text-sm font-semibold tracking-wide text-bark-500 uppercase">
          Items in this order
        </h2>

        <ul className="mt-4 divide-y divide-bark-100">
          {(order.items || []).map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                {item.productImage ? (
                  <Image src={item.productImage} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <span className="grid h-full place-items-center text-xl" aria-hidden="true">
                    🍯
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-bark-900">
                  {item.productSlug ? (
                    <Link href={ROUTES.product(item.productSlug)} className="hover:text-honey-700">
                      {item.productName}
                    </Link>
                  ) : (
                    item.productName
                  )}
                </p>
                <p className="mt-0.5 text-xs text-bark-500">
                  {item.weight ? `${item.weight} · ` : ''}SKU {item.productSku}
                </p>
                <p className="mt-0.5 text-xs text-bark-500">
                  {formatCurrency(item.unitPrice)} × {item.quantity}
                </p>
              </div>

              <p className="shrink-0 text-sm font-bold text-bark-900">
                {formatCurrency(item.lineTotal)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2 border-t border-bark-100 pt-4 text-sm">
          <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
          {Number(order.discountTotal) > 0 && (
            <Row
              label={order.couponCode ? `Discount (${order.couponCode})` : 'Discount'}
              value={`− ${formatCurrency(order.discountTotal)}`}
              valueClass="text-leaf-700"
            />
          )}
          <Row
            label="Shipping"
            value={Number(order.shippingTotal) === 0 ? 'Free' : formatCurrency(order.shippingTotal)}
          />
          <div className="flex justify-between border-t border-bark-100 pt-3">
            <dt className="font-semibold text-bark-900">Total</dt>
            <dd className="font-[family-name:var(--font-display)] text-lg font-bold text-bark-900">
              {formatCurrency(order.grandTotal)}
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Card title="Delivery address">
          <Address address={shipping} />
        </Card>

        <Card title="Billing address">
          <Address address={billing} />
        </Card>

        <Card title="Payment">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-bark-900 uppercase">
              {order.payment?.method || '—'}
            </p>
            <StatusBadge status={order.payment?.status} size="sm" />
          </div>
          {order.payment?.transactionReference && (
            <p className="mt-2 text-xs text-bark-500">
              Reference:{' '}
              <span className="font-semibold text-bark-700 select-all">
                {order.payment.transactionReference}
              </span>
            </p>
          )}
          {order.payment?.paidAt && (
            <p className="mt-1 text-xs text-bark-500">
              Paid on {formatDateTime(order.payment.paidAt)}
            </p>
          )}
        </Card>

        <Card title="Contact for this order">
          <p className="text-sm text-bark-700">{order.customerName}</p>
          <p className="mt-1 text-sm text-bark-600">{order.customerEmail}</p>
          <p className="mt-1 text-sm text-bark-600">{order.customerPhone}</p>
          {order.customerNote && (
            <p className="mt-3 rounded-lg bg-cream-100 p-3 text-xs text-bark-600">
              “{order.customerNote}”
            </p>
          )}
        </Card>
      </div>

      <ConfirmDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancel}
        isLoading={isCancelling}
        title="Cancel this order?"
        description="The jars go back on the shelf and any payment you have made is returned. This cannot be undone."
        confirmLabel="Yes, cancel it"
      />
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
      <span className="mt-2 inline-block">{address.phone}</span>
    </p>
  );
}

function Row({ label, value, valueClass }) {
  return (
    <div className="flex justify-between">
      <dt className="text-bark-600">{label}</dt>
      <dd className={valueClass || 'text-bark-900'}>{value}</dd>
    </div>
  );
}
