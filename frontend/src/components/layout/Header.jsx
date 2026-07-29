'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';

import UserMenu from './UserMenu';
import MobileNav from './MobileNav';
import { ROUTES, siteConfig } from '@/config/site';
import { selectCartCount } from '@/features/cart/cartSlice';
import { selectWishlistCount } from '@/features/wishlist/wishlistSlice';
import { toggleMobileNav, selectUi } from '@/features/ui/uiSlice';
import { useIsHydrated } from '@/lib/hooks';
import { cn } from '@/lib/utils/cn';

export const NAV_LINKS = [
  { href: ROUTES.home, label: 'Home' },
  { href: ROUTES.shop, label: 'Shop' },
  { href: ROUTES.about, label: 'About' },
  { href: ROUTES.faq, label: 'FAQ' },
  { href: ROUTES.contact, label: 'Contact' },
];

const IconCart = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
    <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10" cy="20" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

const IconHeart = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
    <path
      d="M12 20s-7-4.4-7-9.3A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 2.7C19 15.6 12 20 12 20z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Sticky site header.
 *
 * It starts transparent over the hero and gains a solid background plus a
 * shadow once the page scrolls, so the hero image is never cut in half by a bar
 * on first paint.
 */
export default function Header() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { isMobileNavOpen } = useSelector(selectUi);
  const isHydrated = useIsHydrated();

  // The basket and wishlist are filled by effects (localStorage, then the API),
  // so their counts are only trustworthy once hydration has finished. Reading
  // them earlier would make the first client render disagree with the server.
  const storedCartCount = useSelector(selectCartCount);
  const storedWishlistCount = useSelector(selectWishlistCount);
  const cartCount = isHydrated ? storedCartCount : 0;
  const wishlistCount = isHydrated ? storedWishlistCount : 0;

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href) =>
    href === ROUTES.home ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300',
          isScrolled
            ? 'bg-cream-50/85 shadow-[var(--shadow-soft)] backdrop-blur-md'
            : 'bg-transparent'
        )}
      >
        <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-20">
          <Link href={ROUTES.home} className="flex items-center gap-2.5" aria-label={siteConfig.name}>
            <motion.span
              className="grid size-10 place-items-center rounded-full bg-honey-400 text-lg"
              whileHover={{ rotate: 12, scale: 1.06 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              aria-hidden="true"
            >
              🐝
            </motion.span>
            <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-bark-900 sm:text-xl">
              {siteConfig.name}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium transition-colors duration-200',
                  isActive(link.href) ? 'text-honey-800' : 'text-bark-700 hover:text-honey-700'
                )}
              >
                {/*
                  A shared layoutId lets the pill slide between links instead of
                  cross-fading, which reads as one object moving.
                */}
                {isActive(link.href) && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 -z-10 rounded-[var(--radius-pill)] bg-honey-100"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href={ROUTES.accountWishlist}
              className="relative hidden rounded-full p-2.5 text-bark-700 transition-colors hover:bg-honey-100 hover:text-honey-800 sm:block"
              aria-label={`Wishlist${wishlistCount ? ` (${wishlistCount} items)` : ''}`}
            >
              <IconHeart className="size-5" />
              {wishlistCount > 0 && <CountBubble value={wishlistCount} />}
            </Link>

            <Link
              href={ROUTES.cart}
              className="relative rounded-full p-2.5 text-bark-700 transition-colors hover:bg-honey-100 hover:text-honey-800"
              aria-label={`Basket${cartCount ? ` (${cartCount} items)` : ''}`}
            >
              <IconCart className="size-5" />
              <AnimatePresence>
                {cartCount > 0 && <CountBubble value={cartCount} animate />}
              </AnimatePresence>
            </Link>

            <UserMenu />

            <button
              type="button"
              onClick={() => dispatch(toggleMobileNav())}
              className="rounded-full p-2.5 text-bark-700 transition-colors hover:bg-honey-100 lg:hidden"
              aria-label="Open menu"
              aria-expanded={isMobileNavOpen}
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MobileNav />
    </>
  );
}

function CountBubble({ value, animate = false }) {
  const Tag = animate ? motion.span : 'span';
  const motionProps = animate
    ? {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0, opacity: 0 },
        transition: { type: 'spring', stiffness: 500, damping: 25 },
      }
    : {};

  return (
    <Tag
      className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-honey-600 px-1.5 text-[10px] font-bold text-white"
      {...motionProps}
    >
      {value > 99 ? '99+' : value}
    </Tag>
  );
}
