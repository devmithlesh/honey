import PolicyPage from '@/components/shared/PolicyPage';
import { POLICIES } from '@/config/content';
import { ROUTES } from '@/config/site';

export const metadata = {
  title: 'Shipping policy',
  description:
    'Where we deliver, how long it takes, what shipping costs, and what to do if a parcel arrives damaged.',
  alternates: { canonical: '/shipping-policy' },
};

export default function ShippingPolicyPage() {
  return <PolicyPage policy={POLICIES.shipping} currentHref={ROUTES.shippingPolicy} />;
}
