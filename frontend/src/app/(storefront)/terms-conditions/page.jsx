import PolicyPage from '@/components/shared/PolicyPage';
import { POLICIES } from '@/config/content';
import { ROUTES } from '@/config/site';

export const metadata = {
  title: 'Terms & conditions',
  description:
    'The terms that apply when you browse this website or place an order with us, including pricing, orders and liability.',
  alternates: { canonical: '/terms-conditions' },
};

export default function TermsConditionsPage() {
  return <PolicyPage policy={POLICIES.terms} currentHref={ROUTES.termsConditions} />;
}
