'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/Badge';
import { ROUTES } from '@/config/site';
import { checkoutApi } from '@/lib/api/services';
import { useAsyncData, useAuth } from '@/lib/hooks';
import { formatCurrency, formatDate } from '@/lib/utils/format';

const PAYMENT_COPY = {
  cod: {
    title: 'Cash on delivery',
    body: 'Please keep the exact amount ready for the courier when your parcel arrives.',
  },
  upi: {
    title: 'UPI — awaiting verification',
    body: 'We are matching your transaction reference against our records. You will get an email as soon as it clears, usually within a few hours.',
  },
};

export default function OrderSuccessView({ orderNumber }) {
  const { isBootstrapped } = useAuth();

  // Waits for the session to resolve first: a signed-in customer's order needs
  // the access token, and firing before it exists would 403 unnecessarily.
  const { data: order, isLoading, error } = useAsyncData(
    () => checkoutApi.getOrder(orderNumber),
    [orderNumber, isBootstrapped],
    { enabled: isBootstrapped }
  );

  if (!isBootstrapped || isLoading) {
    return (
      <div className="container-page py-16" role="status" aria-busy="true">
        <span className="sr-only">Loading your order…</span>
        <Skeleton className="mx-auto h-24 w-24 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-8 w-72" />
        <Skeleton className="mx-auto mt-4 h-5 w-96" />
        <Skeleton className="mx-auto mt-10 h-80 w-full max-w-3xl rounded-[var(--radius-card)]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon="🔍"
          title="We could not find that order"
          description={
            error?.status === 403
              ? 'This order belongs to another account. Sign in with the account that placed it.'
              : 'Check the order number in your confirmation email, or get in touch and we will look it up.'
          }
          actionLabel="Contact us"
          actionHref={ROUTES.contact}
        />
      </div>
    );
  }

  const payment = PAYMENT_COPY[order.payment?.method] || PAYMENT_COPY.cod;
  const address = order.shippingAddress || {};

  return (
    <div className="container-page py-14 lg:py-20">
      <motion.div
        className="mx-auto max-w-3xl text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          className="mx-auto grid size-20 place-items-center rounded-full bg-leaf-100 text-4xl"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 16 }}
          aria-hidden="true"
        >
          🎉
        </motion.span>

        <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">Thank you, your order is in!</h1>

        <p className="mt-4 text-base text-bark-600">
          We have emailed a confirmation to{' '}
          <span className="font-semibold text-bark-800">{order.customerEmail}</span>. Your jars will
          be packed and dispatched shortly.
        </p>

        <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-3 rounded-[var(--radius-card)] border border-bark-100 bg-white px-6 py-4">
          <div className="text-left">
            <p className="text-xs text-bark-500">Order number</p>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold text-bark-900 select-all">
              {order.orderNumber}
            </p>
          </div>
          <span className="hidden h-10 w-px bg-bark-100 sm:block" aria-hidden="true" />
          <div className="text-left">
            <p className="text-xs text-bark-500">Status</p>
            <StatusBadge status={order.status} className="mt-1" />
          </div>
          <span className="hidden h-10 w-px bg-bark-100 sm:block" aria-hidden="true" />
          <div className="text-left">
            <p className="text-xs text-bark-500">Placed on</p>
            <p className="mt-1 text-sm font-semibold text-bark-900">{formatDate(order.placedAt)}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="mx-auto mt-12 max-w-3xl space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card title="What you ordered">
          <ul className="divide-y divide-bark-100">
            {(order.items || []).map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                  {item.productImage ? (
                    <Image src={item.productImage} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center text-lg" aria-hidden="true">
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
                  <p className="text-xs text-bark-500">
                    {item.weight ? `${item.weight} · ` : ''}
                    {formatCurrency(item.unitPrice)} × {item.quantity}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-semibold text-bark-900">
                  {formatCurrency(item.lineTotal)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-bark-100 pt-4 text-sm">
            <SummaryRow label="Subtotal" value={formatCurrency(order.subtotal)} />
            {Number(order.discountTotal) > 0 && (
              <SummaryRow
                label={order.couponCode ? `Discount (${order.couponCode})` : 'Discount'}
                value={`− ${formatCurrency(order.discountTotal)}`}
                className="text-leaf-700"
              />
            )}
            <SummaryRow
              label="Shipping"
              value={
                Number(order.shippingTotal) === 0 ? 'Free' : formatCurrency(order.shippingTotal)
              }
            />
            <div className="flex justify-between border-t border-bark-100 pt-3">
              <dt className="font-semibold text-bark-900">Total</dt>
              <dd className="font-[family-name:var(--font-display)] text-lg font-bold text-bark-900">
                {formatCurrency(order.grandTotal)}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card title="Delivering to">
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
          </Card>

          <Card title="Payment">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-bark-900">{payment.title}</p>
              <StatusBadge status={order.payment?.status} size="sm" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-bark-600">{payment.body}</p>

            {order.payment?.transactionReference && (
              <p className="mt-3 text-xs text-bark-500">
                Reference:{' '}
                <span className="font-semibold text-bark-700 select-all">
                  {order.payment.transactionReference}
                </span>
              </p>
            )}
          </Card>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button href={ROUTES.accountOrders}>Track your orders</Button>
          <Button href={ROUTES.shop} variant="outline">
            Continue shopping
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-bark-500 uppercase">{title}</h2>
      {children}
    </section>
  );
}

function SummaryRow({ label, value, className }) {
  return (
    <div className="flex justify-between">
      <dt className="text-bark-600">{label}</dt>
      <dd className={className || 'text-bark-900'}>{value}</dd>
    </div>
  );
}
