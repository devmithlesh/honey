'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { applyCoupon, removeCoupon, selectCartCoupon } from '@/features/cart/cartSlice';
import { checkoutApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

/**
 * Coupon entry.
 *
 * The code is validated against the API — including its minimum-order and
 * per-customer limits — before it is stored, so the basket never displays a
 * discount that checkout will later refuse.
 */
export default function CouponBox({ subtotal }) {
  const dispatch = useDispatch();
  const coupon = useSelector(selectCartCoupon);
  const [code, setCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleApply = async (event) => {
    event.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setIsChecking(true);
    try {
      const result = await checkoutApi.validateCoupon({ code: trimmed, subtotal });
      dispatch(applyCoupon(result));
      setCode('');
      toast.success(`${result.code} applied — you saved ${formatCurrency(result.discount)}`);
    } catch (error) {
      toast.error(parseApiError(error).message);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
      <h3 className="text-sm font-semibold text-bark-900">Have a coupon?</h3>

      <AnimatePresence mode="wait">
        {coupon ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-leaf-50 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-bold text-leaf-800">{coupon.code}</p>
              <p className="truncate text-xs text-leaf-700">
                {coupon.description || 'Discount applied'} · −{formatCurrency(coupon.discount)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                dispatch(removeCoupon());
                toast('Coupon removed');
              }}
              className="shrink-0 text-xs font-semibold text-leaf-700 underline underline-offset-4 hover:text-leaf-900"
            >
              Remove
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="entry"
            onSubmit={handleApply}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 flex gap-2"
          >
            <label htmlFor="coupon-code" className="sr-only">
              Coupon code
            </label>
            <input
              id="coupon-code"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="WELCOME10"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl border border-bark-200 px-3 py-2.5 text-sm tracking-wide uppercase focus:border-honey-400 focus:ring-4 focus:ring-honey-100 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isChecking || !code.trim()}
              className="shrink-0 rounded-xl bg-bark-800 px-4 text-sm font-semibold text-cream-50 transition-colors hover:bg-bark-700 disabled:opacity-50"
            >
              {isChecking ? '…' : 'Apply'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
