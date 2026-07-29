import { Suspense } from 'react';

import LoginForm from '@/components/auth/LoginForm';
import Skeleton from '@/components/ui/Skeleton';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to track your orders, manage addresses and see your wishlist.',
  alternates: { canonical: '/login' },
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  // `useSearchParams` (for the post-login redirect) needs a Suspense boundary.
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-[var(--radius-card)]" />}>
      <LoginForm />
    </Suspense>
  );
}
