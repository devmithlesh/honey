import PolicyPage from '@/components/shared/PolicyPage';
import { POLICIES } from '@/config/content';
import { ROUTES } from '@/config/site';

export const metadata = {
  title: 'Refund policy',
  description:
    'When we replace a jar or refund an order, what we cannot accept back, and how cancellations work.',
  alternates: { canonical: '/refund-policy' },
};

export default function RefundPolicyPage() {
  return <PolicyPage policy={POLICIES.refund} currentHref={ROUTES.refundPolicy} />;
}
