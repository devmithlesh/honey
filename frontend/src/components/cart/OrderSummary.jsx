import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

/**
 * Money breakdown shown on the basket and checkout pages.
 *
 * `shipping` is `null` until the server has quoted it, which is what lets the
 * basket honestly say "calculated at checkout" instead of guessing a figure.
 */
export default function OrderSummary({
  subtotal = 0,
  discount = 0,
  shipping = null,
  total,
  couponCode,
  freeShippingThreshold,
  className,
}) {
  const payable = total ?? Math.max(0, subtotal - discount) + (shipping ?? 0);
  const remainingForFreeShipping =
    freeShippingThreshold > 0 ? freeShippingThreshold - subtotal : 0;

  return (
    <div className={cn('rounded-[var(--radius-card)] border border-bark-100 bg-white p-5', className)}>
      <h3 className="text-sm font-semibold text-bark-900">Order summary</h3>

      <dl className="mt-4 space-y-3 text-sm">
        <Row label="Subtotal" value={formatCurrency(subtotal)} />

        {discount > 0 && (
          <Row
            label={couponCode ? `Discount (${couponCode})` : 'Discount'}
            value={`− ${formatCurrency(discount)}`}
            valueClassName="text-leaf-700 font-semibold"
          />
        )}

        <Row
          label="Shipping"
          value={
            shipping === null ? (
              <span className="text-bark-500">Calculated at checkout</span>
            ) : shipping === 0 ? (
              <span className="font-semibold text-leaf-700">Free</span>
            ) : (
              formatCurrency(shipping)
            )
          }
        />

        <div className="flex items-baseline justify-between border-t border-bark-100 pt-3">
          <dt className="text-base font-semibold text-bark-900">Total</dt>
          <dd className="font-[family-name:var(--font-display)] text-xl font-bold text-bark-900">
            {formatCurrency(payable)}
          </dd>
        </div>
      </dl>

      {remainingForFreeShipping > 0 && (
        <div className="mt-4 rounded-xl bg-honey-50 px-4 py-3">
          <p className="text-xs text-honey-800">
            Add {formatCurrency(remainingForFreeShipping)} more for free delivery
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-honey-100">
            <div
              className="h-full rounded-full bg-honey-500 transition-[width] duration-500"
              style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueClassName }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-bark-600">{label}</dt>
      <dd className={cn('text-bark-900', valueClassName)}>{value}</dd>
    </div>
  );
}
