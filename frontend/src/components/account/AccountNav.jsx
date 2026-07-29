'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import { ROUTES } from '@/config/site';
import { logout } from '@/features/auth/authSlice';
import { clearWishlist } from '@/features/wishlist/wishlistSlice';
import { useAuth } from '@/lib/hooks';
import { cn } from '@/lib/utils/cn';

const LINKS = [
  { href: ROUTES.account, label: 'Dashboard', icon: '🏠' },
  { href: ROUTES.accountOrders, label: 'My orders', icon: '📦' },
  { href: ROUTES.accountWishlist, label: 'Wishlist', icon: '💛' },
  { href: ROUTES.accountAddresses, label: 'Addresses', icon: '📍' },
  { href: ROUTES.accountProfile, label: 'My profile', icon: '👤' },
  { href: ROUTES.accountPassword, label: 'Change password', icon: '🔒' },
];

/**
 * Account side navigation. Scrolls horizontally on small screens rather than
 * collapsing into a menu, so every section stays one tap away.
 */
export default function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAdmin } = useAuth();

  const handleLogout = async () => {
    await dispatch(logout());
    dispatch(clearWishlist());
    toast.success('Signed out');
    router.push(ROUTES.home);
  };

  const isActive = (href) =>
    href === ROUTES.account ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="hidden rounded-[var(--radius-card)] border border-bark-100 bg-white p-5 lg:block">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-honey-200 text-base font-bold text-honey-900">
            {(user?.name || '?').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-bark-900">{user?.name}</p>
            <p className="truncate text-xs text-bark-500">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav aria-label="Account" className="mt-4">
        <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
          {LINKS.map((link) => (
            <li key={link.href} className="shrink-0 lg:shrink">
              <Link
                href={link.href}
                className={cn(
                  'relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive(link.href) ? 'text-honey-900' : 'text-bark-700 hover:bg-white'
                )}
              >
                {isActive(link.href) && (
                  <motion.span
                    layoutId="account-nav-active"
                    className="absolute inset-0 -z-10 rounded-xl bg-honey-100"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span aria-hidden="true">{link.icon}</span>
                {link.label}
              </Link>
            </li>
          ))}

          {isAdmin && (
            <li className="shrink-0 lg:shrink">
              <Link
                href={ROUTES.admin}
                className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-honey-800 transition-colors hover:bg-white"
              >
                <span aria-hidden="true">⚙️</span>
                Admin dashboard
              </Link>
            </li>
          )}

          <li className="shrink-0 lg:mt-2 lg:shrink lg:border-t lg:border-bark-100 lg:pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap text-[var(--color-danger)] transition-colors hover:bg-red-50"
            >
              <span aria-hidden="true">🚪</span>
              Sign out
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
