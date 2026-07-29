'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';

import Rating from '@/components/ui/Rating';
import WishlistButton from './WishlistButton';
import { ROUTES } from '@/config/site';
import { selectIsInCart } from '@/features/cart/cartSlice';
import { useCart } from '@/lib/hooks';
import { calculateDiscountPercent, formatCurrency, getEffectivePrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

/**
 * Catalogue tile used on the home page, shop grid, wishlist and related rails.
 *
 * The whole card is a link to the product; the wishlist and basket controls sit
 * above it and stop propagation, so a tap on either does not also navigate.
 */
export default function ProductCard({ product, className, priority = false }) {
  const { add } = useCart();
  const isInCart = useSelector(selectIsInCart(product.id));

  const price = getEffectivePrice(product);
  const hasDiscount = price < Number(product.price);
  const discountPercent = calculateDiscountPercent(product.price, product.discountPrice);
  const image = product.images?.[0];
  const isOutOfStock = !product.stock || product.stock < 1;

  return (
    <motion.article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-bark-100 bg-white',
        'shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-lifted)]',
        className
      )}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
    >
      <Link href={ROUTES.product(product.slug)} className="relative block aspect-square overflow-hidden bg-cream-200">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText || product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-4xl" aria-hidden="true">
            🍯
          </div>
        )}

        <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-1.5">
          {discountPercent > 0 && (
            <span className="rounded-[var(--radius-pill)] bg-honey-500 px-2.5 py-1 text-[11px] font-bold text-bark-900">
              {discountPercent}% off
            </span>
          )}
          {product.isFeatured && (
            <span className="rounded-[var(--radius-pill)] bg-bark-800 px-2.5 py-1 text-[11px] font-semibold text-cream-50">
              Bestseller
            </span>
          )}
          {isOutOfStock && (
            <span className="rounded-[var(--radius-pill)] bg-bark-900/85 px-2.5 py-1 text-[11px] font-semibold text-cream-50">
              Sold out
            </span>
          )}
        </div>
      </Link>

      <WishlistButton
        productId={product.id}
        className="absolute top-3 right-3 z-10"
      />

      <div className="flex flex-1 flex-col p-4">
        {product.category?.name && (
          <p className="text-[11px] font-medium tracking-wide text-bark-400 uppercase">
            {product.category.name}
          </p>
        )}

        <h3 className="mt-1 line-clamp-2 text-sm leading-snug font-semibold text-bark-900">
          <Link href={ROUTES.product(product.slug)} className="hover:text-honey-700">
            {product.name}
          </Link>
        </h3>

        {product.weight && <p className="mt-1 text-xs text-bark-500">{product.weight}</p>}

        {Number(product.ratingCount) > 0 && (
          <Rating
            value={product.ratingAverage}
            count={product.ratingCount}
            size="sm"
            className="mt-2"
          />
        )}

        <div className="mt-3 flex items-end gap-2">
          <span className="text-base font-bold text-bark-900">{formatCurrency(price)}</span>
          {hasDiscount && (
            <span className="text-sm text-bark-400 line-through">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => add(product)}
          disabled={isOutOfStock}
          className={cn(
            'mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] text-sm font-semibold transition-colors duration-200',
            isOutOfStock
              ? 'cursor-not-allowed bg-bark-100 text-bark-400'
              : isInCart
                ? 'bg-leaf-100 text-leaf-800 hover:bg-leaf-200'
                : 'bg-honey-500 text-bark-900 hover:bg-honey-400'
          )}
        >
          {isOutOfStock ? 'Out of stock' : isInCart ? 'In your basket ✓' : 'Add to basket'}
        </button>
      </div>
    </motion.article>
  );
}
