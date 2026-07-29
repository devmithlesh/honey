import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RouteGuard from '@/components/shared/RouteGuard';
import AccountNav from '@/components/account/AccountNav';

export const metadata = {
  title: 'My account',
  robots: { index: false, follow: false },
};

/**
 * Customer dashboard shell: storefront chrome plus a persistent side nav.
 */
export default function AccountLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      <main id="main-content" className="flex-1 bg-cream-100">
        <RouteGuard>
          <div className="container-page py-10 lg:py-14">
            <div className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-10">
              <AccountNav />
              <div className="min-w-0">{children}</div>
            </div>
          </div>
        </RouteGuard>
      </main>

      <Footer />
    </div>
  );
}
