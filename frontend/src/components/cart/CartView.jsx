'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import CouponBox from './CouponBox';
import OrderSummary from './OrderSummary';
import Skeleton from '@/components/ui/Skeleton';
import { ROUTES } from '@/config/site';
import {
  removeItem,
  selectCart,
  selectCartSubtotal,
  updateQuantity,
} from '@/features/cart/cartSlice';
import { useIsHydrated } from '@/lib/hooks';
import { formatCurrency } from '@/lib/utils/format';

/**
 * Basket page.
 *
 * Totals here are a client-side estimate for immediate feedback; the binding
 * figures come from the server quote on the checkout page.
 */
export default function CartView() {
  const dispatch = useDispatch();
  const { items, coupon, isHydrated: isCartLoaded } = useSelector(selectCart);
  const subtotal = useSelector(selectCartSubtotal);
  const isHydrated = useIsHydrated();

  // Until React has hydrated *and* localStorage has been read, an empty basket
  // would be a lie — and rendering one would not match the server HTML.
  if (!isHydrated || !isCartLoaded) {
    return (
      <div className="container-page grid gap-8 py-12 lg:grid-cols-[1fr_22rem]" role="status" aria-busy="true">
        <span className="sr-only">Loading your basket…</span>
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-[var(--radius-card)]" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-[var(--radius-card)]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon="🧺"
          title="Your basket is empty"
          description="Nothing in here yet. Our raw Himalayan honey is the usual place to start."
          actionLabel="Browse the shop"
          actionHref={ROUTES.shop}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-12">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-bark-900">
              {items.length} item{items.length === 1 ? '' : 's'} in your basket
            </h2>
            <Link href={ROUTES.shop} className="text-sm font-medium text-honey-700 hover:underline">
              Continue shopping
            </Link>
          </div>

          <ul className="space-y-4">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={item.productId}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -24, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="flex gap-4 overflow-hidden rounded-[var(--radius-card)] border border-bark-100 bg-white p-4"
                >
                  <Link
                    href={ROUTES.product(item.slug)}
                    className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-cream-200"
                  >
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center text-2xl" aria-hidden="true">
                        🍯
                      </span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-bark-900">
                          <Link href={ROUTES.product(item.slug)} className="hover:text-honey-700">
                            {item.name}
                          </Link>
                        </h3>
                        {item.weight && <p className="mt-0.5 text-xs text-bark-500">{item.weight}</p>}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          dispatch(removeItem(item.productId));
                          toast.success(`${item.name} removed`);
                        }}
                        aria-label={`Remove ${item.name}`}
                        className="shrink-0 rounded-lg p-1.5 text-bark-400 transition-colors hover:bg-red-50 hover:text-[var(--color-danger)]"
                      >
                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                      <div className="inline-flex items-center rounded-[var(--radius-pill)] border border-bark-200">
                        <QuantityButton
                          label={`Decrease ${item.name}`}
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity - 1 }))
                          }
                        >
                          −
                        </QuantityButton>
                        <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
                        <QuantityButton
                          label={`Increase ${item.name}`}
                          disabled={item.quantity >= Math.min(item.stock || 99, 99)}
                          onClick={() =>
                            dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + 1 }))
                          }
                        >
                          +
                        </QuantityButton>
                      </div>

                      <p className="text-sm font-bold text-bark-900">
                        {formatCurrency(
                          (item.discountPrice && item.discountPrice < item.price
                            ? item.discountPrice
                            : item.price) * item.quantity
                        )}
                      </p>
                    </div>

                    {item.stock <= 5 && (
                      <p className="mt-2 text-xs text-honey-700">Only {item.stock} left in stock</p>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <CouponBox subtotal={subtotal} />

          <OrderSummary
            subtotal={subtotal}
            discount={coupon?.discount || 0}
            couponCode={coupon?.code}
            className="mt-4"
          />

          <Button href={ROUTES.checkout} size="lg" className="mt-4 w-full">
            Proceed to checkout
          </Button>

          <p className="mt-3 text-center text-xs text-bark-500">
            Shipping is calculated at checkout from your delivery address.
          </p>
        </div>
      </div>
    </div>
  );
}

function QuantityButton({ children, onClick, disabled, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid size-9 place-items-center rounded-full text-base font-semibold text-bark-700 transition-colors hover:bg-honey-50 disabled:cursor-not-allowed disabled:text-bark-300 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
