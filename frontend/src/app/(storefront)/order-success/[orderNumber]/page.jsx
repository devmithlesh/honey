import OrderSuccessView from '@/components/checkout/OrderSuccessView';

export const metadata = {
  title: 'Order confirmed',
  description: 'Your order has been placed. Here are the details.',
  robots: { index: false, follow: false },
};

/**
 * Order confirmation.
 *
 * Fetched on the client rather than the server because a signed-in customer's
 * order requires their access token, which lives in browser memory. Guest
 * orders resolve by order number alone.
 */
export default async function OrderSuccessPage({ params }) {
  const { orderNumber } = await params;

  return <OrderSuccessView orderNumber={orderNumber} />;
}
