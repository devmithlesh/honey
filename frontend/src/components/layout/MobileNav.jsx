'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';

import { NAV_LINKS } from './Header';
import WhatsAppLink from '@/components/shared/WhatsAppLink';
import { ROUTES, siteConfig } from '@/config/site';
import { selectUi, toggleMobileNav } from '@/features/ui/uiSlice';
import { useAuth, useScrollLock } from '@/lib/hooks';
import { cn } from '@/lib/utils/cn';

/**
 * Slide-in navigation drawer for small screens.
 *
 * The drawer closes on navigation (watching `pathname`) so tapping a link never
 * leaves the panel covering the page it just opened.
 */
export default function MobileNav() {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const { isMobileNavOpen } = useSelector(selectUi);
  const { isAuthenticated, isAdmin } = useAuth();

  useScrollLock(isMobileNavOpen);

  useEffect(() => {
    dispatch(toggleMobileNav(false));
  }, [pathname, dispatch]);

  const close = () => dispatch(toggleMobileNav(false));

  const accountLinks = isAuthenticated
    ? [
        { href: ROUTES.account, label: 'My dashboard' },
        { href: ROUTES.accountOrders, label: 'My orders' },
        { href: ROUTES.accountWishlist, label: 'Wishlist' },
        ...(isAdmin ? [{ href: ROUTES.admin, label: 'Admin dashboard' }] : []),
      ]
    : [
        { href: ROUTES.login, label: 'Sign in' },
        { href: ROUTES.register, label: 'Create account' },
      ];

  return (
    <AnimatePresence>
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            className="absolute inset-0 bg-bark-900/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            aria-hidden="true"
          />

          <motion.nav
            className="absolute top-0 right-0 flex h-dvh w-[86%] max-w-sm flex-col overflow-y-auto bg-cream-50 px-6 py-6 shadow-[var(--shadow-lifted)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-bark-900">
                {siteConfig.name}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="rounded-lg p-2 text-bark-600 transition-colors hover:bg-bark-100"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <ul className="mt-8 space-y-1">
              {NAV_LINKS.map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 + index * 0.05, duration: 0.3 }}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      'block rounded-xl px-4 py-3 text-base font-medium transition-colors',
                      pathname === link.href
                        ? 'bg-honey-100 text-honey-800'
                        : 'text-bark-700 hover:bg-bark-50'
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>

            <div className="mt-8 border-t border-bark-100 pt-6">
              <p className="px-4 text-xs font-semibold tracking-wide text-bark-500 uppercase">
                Account
              </p>
              <ul className="mt-2 space-y-1">
                {accountLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block rounded-xl px-4 py-3 text-base font-medium text-bark-700 transition-colors hover:bg-bark-50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto pt-8">
              <WhatsAppLink
                message={`Hello ${siteConfig.name}, I have a question about your honey.`}
                className="flex items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-leaf-500 px-6 py-3 text-sm font-semibold text-white"
              >
                Chat on WhatsApp
              </WhatsAppLink>
              <p className="mt-4 text-center text-xs text-bark-500">{siteConfig.contact.phone}</p>
            </div>
          </motion.nav>
        </div>
      )}
    </AnimatePresence>
  );
}
