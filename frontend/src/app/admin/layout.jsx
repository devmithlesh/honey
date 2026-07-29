import RouteGuard from '@/components/shared/RouteGuard';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Admin dashboard',
  robots: { index: false, follow: false },
};

/**
 * Admin area shell.
 *
 * Deliberately does not use the storefront header or footer — this is a tool,
 * not a shopfront, and the extra chrome would only take space from the tables.
 * `requireAdmin` bounces any non-admin session back to their own dashboard.
 */
export default function AdminLayout({ children }) {
  return (
    <RouteGuard requireAdmin>
      <AdminShell>{children}</AdminShell>
    </RouteGuard>
  );
}
