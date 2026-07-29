import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';

/**
 * Chrome shared by every public storefront page.
 *
 * A route group (the parenthesised folder) applies this layout without adding
 * a `/storefront` segment to any URL, so `/about` stays `/about`.
 */
export default function StorefrontLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
