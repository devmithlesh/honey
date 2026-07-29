import { Suspense } from 'react';

import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import Skeleton from '@/components/ui/Skeleton';

export const metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-[var(--radius-card)]" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
