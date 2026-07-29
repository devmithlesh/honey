'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import { ROUTES } from '@/config/site';
import { logout } from '@/features/auth/authSlice';
import { clearWishlist } from '@/features/wishlist/wishlistSlice';
import { useAuth, useClickOutside, useIsHydrated } from '@/lib/hooks';

const CUSTOMER_LINKS = [
  { href: ROUTES.account, label: 'Dashboard' },
  { href: ROUTES.accountOrders, label: 'My orders' },
  { href: ROUTES.accountProfile, label: 'My profile' },
  { href: ROUTES.accountAddresses, label: 'Addresses' },
  { href: ROUTES.accountWishlist, label: 'Wishlist' },
];

/**
 * Account entry point in the header.
 *
 * While the session is still being restored it renders a neutral placeholder
 * rather than the signed-out state, so a returning customer does not see "Sign
 * in" flash before their name appears.
 */
export default function UserMenu() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated, isAdmin, isBootstrapped } = useAuth();
  const isHydrated = useIsHydrated();
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);
  const menuRef = useClickOutside(close);

  const handleLogout = async () => {
    close();
    await dispatch(logout());
    dispatch(clearWishlist());
    toast.success('Signed out');
    router.push(ROUTES.home);
  };

  // The placeholder is what the server rendered, so it must also be the first
  // thing the client renders — only after hydration may the real state show.
  if (!isHydrated || !isBootstrapped) {
    return <div className="size-10 rounded-full bg-bark-100/70" aria-hidden="true" />;
  }

  if (!isAuthenticated) {
    return (
      <Link
        href={ROUTES.login}
        className="ml-1 hidden rounded-[var(--radius-pill)] bg-bark-800 px-5 py-2.5 text-sm font-semibold text-cream-50 transition-colors hover:bg-bark-700 sm:inline-flex"
      >
        Sign in
      </Link>
    );
  }

  const initials = (user?.name || '?')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="grid size-10 place-items-center rounded-full bg-honey-200 text-sm font-bold text-honey-900 transition-transform hover:scale-105"
      >
        {initials}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            className="absolute top-full right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-bark-100 bg-white py-2 shadow-[var(--shadow-lifted)]"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="border-b border-bark-100 px-4 pb-3">
              <p className="truncate text-sm font-semibold text-bark-900">{user?.name}</p>
              <p className="truncate text-xs text-bark-500">{user?.email}</p>
            </div>

            <div className="py-1">
              {isAdmin && (
                <Link
                  href={ROUTES.admin}
                  onClick={close}
                  role="menuitem"
                  className="block px-4 py-2 text-sm font-semibold text-honey-800 transition-colors hover:bg-honey-50"
                >
                  Admin dashboard
                </Link>
              )}

              {CUSTOMER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  role="menuitem"
                  className="block px-4 py-2 text-sm text-bark-700 transition-colors hover:bg-bark-50"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="border-t border-bark-100 pt-1">
              <button
                type="button"
                onClick={handleLogout}
                role="menuitem"
                className="w-full px-4 py-2 text-left text-sm text-[var(--color-danger)] transition-colors hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
