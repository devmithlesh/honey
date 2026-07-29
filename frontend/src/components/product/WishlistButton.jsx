'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { ROUTES } from '@/config/site';
import { selectIsWishlisted, toggleWishlist } from '@/features/wishlist/wishlistSlice';
import { useAuth, useIsHydrated } from '@/lib/hooks';
import { cn } from '@/lib/utils/cn';

/**
 * Heart toggle.
 *
 * The wishlist lives on the account, so a guest is sent to sign in rather than
 * silently losing the item — with the current page kept as the return target.
 */
export default function WishlistButton({ productId, className, showLabel = false }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const hydrated = useIsHydrated();
  // The wishlist arrives from the API after sign-in, so the filled heart may
  // only appear once hydration is done — otherwise it contradicts the server HTML.
  const isWishlisted = useSelector(selectIsWishlisted(productId)) && hydrated;
  const [isBusy, setIsBusy] = useState(false);

  const handleClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      toast('Sign in to save your favourites', { icon: '🔒' });
      router.push(`${ROUTES.login}?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsBusy(true);
    const result = await dispatch(toggleWishlist(productId));
    setIsBusy(false);

    if (toggleWishlist.rejected.match(result)) {
      toast.error(result.payload?.message || 'Could not update your wishlist');
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={isBusy}
      aria-pressed={isWishlisted}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
      whileTap={{ scale: 0.85 }}
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-white/90 p-2.5 shadow-[var(--shadow-soft)] backdrop-blur transition-colors duration-200',
        isWishlisted ? 'text-[var(--color-danger)]' : 'text-bark-500 hover:text-[var(--color-danger)]',
        showLabel && 'px-4',
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill={isWishlisted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.7"
        aria-hidden="true"
      >
        <path
          d="M12 20s-7-4.4-7-9.3A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 2.7C19 15.6 12 20 12 20z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showLabel && (
        <span className="text-sm font-semibold">{isWishlisted ? 'Saved' : 'Save'}</span>
      )}
    </motion.button>
  );
}
