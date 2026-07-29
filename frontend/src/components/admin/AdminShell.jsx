'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import { ROUTES, siteConfig } from '@/config/site';
import { logout } from '@/features/auth/authSlice';
import { useAuth, useScrollLock } from '@/lib/hooks';
import { cn } from '@/lib/utils/cn';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/products', label: 'Products', icon: '🍯' },
  { href: '/admin/categories', label: 'Categories', icon: '🗂️' },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
  { href: '/admin/reviews', label: 'Reviews', icon: '⭐' },
  { href: '/admin/coupons', label: 'Coupons', icon: '🎟️' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

/**
 * Fixed sidebar on desktop, slide-in drawer on mobile.
 */
export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useAuth();

  /**
   * The drawer records the route it was opened on rather than a plain boolean,
   * so navigating anywhere closes it as a matter of derivation — no effect
   * watching `pathname` and no cascading render.
   */
  const [openedAtPath, setOpenedAtPath] = useState(null);
  const isNavOpen = openedAtPath === pathname;
  const setIsNavOpen = (open) => setOpenedAtPath(open ? pathname : null);

  useScrollLock(isNavOpen);

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Signed out');
    router.push(ROUTES.home);
  };

  const isActive = (href) => (href === '/admin' ? pathname === href : pathname.startsWith(href));

  const navList = (
    <nav aria-label="Admin sections" className="flex-1">
      <ul className="space-y-1">
        {NAV.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                isActive(item.href) ? 'text-honey-300' : 'text-bark-300 hover:bg-bark-800 hover:text-cream-100'
              )}
            >
              {isActive(item.href) && (
                <motion.span
                  layoutId="admin-nav-active"
                  className="absolute inset-0 -z-10 rounded-xl bg-bark-800"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  const sidebarBody = (
    <>
      <Link href="/admin" className="flex items-center gap-2.5 px-2">
        <span className="grid size-9 place-items-center rounded-full bg-honey-400 text-base" aria-hidden="true">
          🐝
        </span>
        <div className="min-w-0">
          <p className="truncate font-[family-name:var(--font-display)] text-sm font-semibold text-cream-50">
            {siteConfig.name}
          </p>
          <p className="text-[11px] text-bark-400">Admin console</p>
        </div>
      </Link>

      <div className="mt-8 flex-1">{navList}</div>

      <div className="border-t border-bark-800 pt-4">
        <div className="flex items-center gap-3 px-2">
          <span className="grid size-9 place-items-center rounded-full bg-honey-500/20 text-xs font-bold text-honey-300">
            {(user?.name || '?').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-cream-100">{user?.name}</p>
            <p className="truncate text-[11px] text-bark-400">{user?.email}</p>
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <Link
            href={ROUTES.home}
            className="flex items-center gap-3 rounded-xl px-4 py-2 text-xs font-medium text-bark-300 transition-colors hover:bg-bark-800"
          >
            <span aria-hidden="true">🏪</span> View storefront
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-bark-800"
          >
            <span aria-hidden="true">🚪</span> Sign out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh bg-cream-100 lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-bark-900 p-4 lg:flex">
        {sidebarBody}
      </aside>

      <AnimatePresence>
        {isNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-bark-900/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNavOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              className="absolute top-0 left-0 flex h-dvh w-72 flex-col bg-bark-900 p-4"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              aria-label="Admin navigation"
            >
              {sidebarBody}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-bark-100 bg-cream-100/90 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setIsNavOpen(true)}
            aria-label="Open admin menu"
            className="rounded-lg p-2 text-bark-700 hover:bg-bark-100"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-bark-900">
            Admin console
          </span>
        </header>

        <main id="main-content" className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
