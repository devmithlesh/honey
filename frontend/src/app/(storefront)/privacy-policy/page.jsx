import PolicyPage from '@/components/shared/PolicyPage';
import { POLICIES } from '@/config/content';
import { ROUTES } from '@/config/site';

export const metadata = {
  title: 'Privacy policy',
  description:
    'What personal information we collect, why we collect it, who we share it with, and the rights you have over it.',
  alternates: { canonical: '/privacy-policy' },
};

export default function PrivacyPolicyPage() {
  return <PolicyPage policy={POLICIES.privacy} currentHref={ROUTES.privacyPolicy} />;
}
