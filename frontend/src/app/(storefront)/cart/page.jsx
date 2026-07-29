import CartView from '@/components/cart/CartView';
import PageHero from '@/components/shared/PageHero';

export const metadata = {
  title: 'Your basket',
  description: 'Review the honey in your basket, apply a coupon and head to checkout.',
  alternates: { canonical: '/cart' },
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <>
      <PageHero
        eyebrow="Basket"
        title="Your basket"
        description="Check the quantities, apply a coupon and you are one step from the door."
        breadcrumbs={[{ label: 'Basket' }]}
      />

      <CartView />
    </>
  );
}
