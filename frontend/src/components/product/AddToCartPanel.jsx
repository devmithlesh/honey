'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';

import Button from '@/components/ui/Button';
import WishlistButton from './WishlistButton';
import { ROUTES } from '@/config/site';
import { useCart } from '@/lib/hooks';
import { cn } from '@/lib/utils/cn';

/**
 * Quantity stepper plus the two purchase actions.
 *
 * "Buy now" adds to the basket and goes straight to checkout, which is what
 * customers expect from that label — it is not a separate express path.
 */
export default function AddToCartPanel({ product }) {
  const router = useRouter();
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);

  const maxQuantity = Math.min(product.stock ?? 0, 99);
  const isOutOfStock = maxQuantity < 1;
  const isLowStock = !isOutOfStock && product.stock <= (product.lowStockThreshold ?? 10);

  const changeQuantity = (delta) => {
    setQuantity((current) => Math.max(1, Math.min(current + delta, maxQuantity)));
  };

  const handleBuyNow = () => {
    if (add(product, quantity)) router.push(ROUTES.checkout);
  };

  return (
    <div className="space-y-5">
      <div aria-live="polite">
        {isOutOfStock ? (
          <p className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-bark-100 px-3.5 py-1.5 text-sm font-medium text-bark-600">
            <span className="size-2 rounded-full bg-bark-400" aria-hidden="true" />
            Out of stock — check back soon
          </p>
        ) : isLowStock ? (
          <p className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-honey-100 px-3.5 py-1.5 text-sm font-medium text-honey-800">
            <span className="size-2 rounded-full bg-honey-500" aria-hidden="true" />
            Only {product.stock} left in stock
          </p>
        ) : (
          <p className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-leaf-100 px-3.5 py-1.5 text-sm font-medium text-leaf-800">
            <span className="size-2 rounded-full bg-leaf-500" aria-hidden="true" />
            In stock, ships today
          </p>
        )}
      </div>

      {!isOutOfStock && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-bark-700">Quantity</span>

          <div className="inline-flex items-center rounded-[var(--radius-pill)] border border-bark-200 bg-white">
            <StepperButton onClick={() => changeQuantity(-1)} disabled={quantity <= 1} label="Decrease quantity">
              −
            </StepperButton>

            <span className="w-10 text-center text-sm font-semibold text-bark-900" aria-live="polite">
              {quantity}
            </span>

            <StepperButton
              onClick={() => changeQuantity(1)}
              disabled={quantity >= maxQuantity}
              label="Increase quantity"
            >
              +
            </StepperButton>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => add(product, quantity)}
          disabled={isOutOfStock}
          size="lg"
          className="flex-1 sm:flex-none"
        >
          Add to basket
        </Button>

        <Button
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          variant="secondary"
          size="lg"
          className="flex-1 sm:flex-none"
        >
          Buy now
        </Button>

        <WishlistButton
          productId={product.id}
          showLabel
          className="h-13 border border-bark-200 bg-white shadow-none"
        />
      </div>
    </div>
  );
}

function StepperButton({ children, onClick, disabled, label }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      whileTap={{ scale: 0.9 }}
      className={cn(
        'grid size-10 place-items-center rounded-full text-lg font-semibold transition-colors',
        disabled ? 'cursor-not-allowed text-bark-300' : 'text-bark-700 hover:bg-honey-50'
      )}
    >
      {children}
    </motion.button>
  );
}
