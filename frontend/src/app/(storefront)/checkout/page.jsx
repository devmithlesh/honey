import CheckoutView from '@/components/checkout/CheckoutView';
import PageHero from '@/components/shared/PageHero';

export const metadata = {
  title: 'Checkout',
  description: 'Complete your order — cash on delivery or UPI, delivered across India.',
  alternates: { canonical: '/checkout' },
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <PageHero
        eyebrow="Checkout"
        title="Almost there"
        description="Tell us where the honey should go and how you would like to pay."
        breadcrumbs={[{ label: 'Basket', href: '/cart' }, { label: 'Checkout' }]}
      />

      <CheckoutView />
    </>
  );
}
