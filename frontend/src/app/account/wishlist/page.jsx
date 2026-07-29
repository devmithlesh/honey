'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import ProductGrid from '@/components/product/ProductGrid';
import EmptyState from '@/components/ui/EmptyState';
import { ROUTES } from '@/config/site';
import { fetchWishlist, selectWishlist } from '@/features/wishlist/wishlistSlice';

/**
 * Wishlist.
 *
 * Reads from the Redux cache so the heart icons everywhere else stay in sync,
 * and refreshes from the API on mount in case it changed on another device.
 */
export default function WishlistPage() {
  const dispatch = useDispatch();
  const products = useSelector(selectWishlist);
  const status = useSelector((state) => state.wishlist.status);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const isLoading = status === 'loading' && products.length === 0;

  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">My wishlist</h1>
        <p className="mt-2 text-sm text-bark-600">
          {products.length > 0
            ? `${products.length} jar${products.length === 1 ? '' : 's'} saved for later.`
            : 'Jars you save will wait for you here.'}
        </p>
      </header>

      <div className="mt-8">
        {!isLoading && products.length === 0 ? (
          <EmptyState
            icon="💛"
            title="Nothing saved yet"
            description="Tap the heart on any product and it will appear here, ready when you are."
            actionLabel="Browse the shop"
            actionHref={ROUTES.shop}
          />
        ) : (
          <ProductGrid
            products={products}
            isLoading={isLoading}
            skeletonCount={4}
            columns="sm:grid-cols-2 xl:grid-cols-3"
          />
        )}
      </div>
    </div>
  );
}
