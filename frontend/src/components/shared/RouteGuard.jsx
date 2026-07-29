'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

import Skeleton from '@/components/ui/Skeleton';
import { ROUTES } from '@/config/site';
import { useAuth, useIsHydrated } from '@/lib/hooks';

/**
 * Client-side access gate for the account and admin sections.
 *
 * It waits for `isBootstrapped` before deciding anything: the session lives in
 * an HTTP-only cookie, so on a hard page load nothing is known until
 * `/auth/refresh` has answered. Redirecting earlier would bounce signed-in
 * customers out of their own dashboard on every refresh.
 *
 * This is a UX guard, not a security boundary — every protected endpoint is
 * independently authorised on the server.
 */
export default function RouteGuard({ children, requireAdmin = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, isBootstrapped } = useAuth();
  const isHydrated = useIsHydrated();

  useEffect(() => {
    if (!isBootstrapped) return;

    if (!isAuthenticated) {
      router.replace(`${ROUTES.login}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (requireAdmin && !isAdmin) {
      router.replace(ROUTES.account);
    }
  }, [isBootstrapped, isAuthenticated, isAdmin, requireAdmin, pathname, router]);

  if (!isHydrated || !isBootstrapped || !isAuthenticated || (requireAdmin && !isAdmin)) {
    return (
      <div className="container-page py-16" role="status" aria-busy="true">
        <span className="sr-only">Checking your session…</span>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-4 h-4 w-80" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-[var(--radius-card)]" />
          ))}
        </div>
      </div>
    );
  }

  return children;
}
