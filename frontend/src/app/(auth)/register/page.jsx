import { Suspense } from 'react';

import RegisterForm from '@/components/auth/RegisterForm';
import Skeleton from '@/components/ui/Skeleton';

export const metadata = {
  title: 'Create your account',
  description: 'Create an account to check out faster, track orders and save your favourites.',
  alternates: { canonical: '/register' },
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[30rem] w-full rounded-[var(--radius-card)]" />}>
      <RegisterForm />
    </Suspense>
  );
}
