'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import AuthCard from './AuthCard';
import PasswordInput, { PasswordStrength } from './PasswordInput';
import Button from '@/components/ui/Button';
import { ROUTES } from '@/config/site';
import { authApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';

/**
 * New-password form reached from the emailed reset link.
 *
 * The token arrives in the query string and is passed straight back to the API,
 * which validates both its signature and the password fingerprint embedded in
 * it — so a link cannot be replayed after it has been used once.
 */
export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { password: '', confirmPassword: '' } });

  const password = watch('password');

  const onSubmit = async (values) => {
    try {
      await authApi.resetPassword({
        token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      toast.success('Password updated — please sign in');
      router.replace(ROUTES.login);
    } catch (error) {
      toast.error(parseApiError(error).message);
    }
  };

  if (!token) {
    return (
      <AuthCard title="This link is incomplete">
        <div className="rounded-[var(--radius-card)] border border-red-200 bg-red-50 p-6 text-center">
          <span className="text-3xl" aria-hidden="true">
            🔗
          </span>
          <p className="mt-4 text-sm text-bark-700">
            The reset link is missing its token. It may have been cut short by your email client.
          </p>
        </div>

        <Button href={ROUTES.forgotPassword} className="mt-6 w-full">
          Request a new link
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      description="Pick something you have not used here before. You will be signed out everywhere else."
      footer={
        <Link href={ROUTES.login} className="font-semibold text-honey-700 underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <PasswordInput
            label="New password"
            required
            autoComplete="new-password"
            autoFocus
            error={errors.password?.message}
            {...register('password', {
              required: 'Choose a new password',
              minLength: { value: 8, message: 'Use at least 8 characters' },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                message: 'Include an uppercase letter, a lowercase letter and a number',
              },
            })}
          />
          <PasswordStrength value={password} />
        </div>

        <PasswordInput
          label="Confirm new password"
          required
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Re-enter your new password',
            validate: (value) => value === password || 'Passwords do not match',
          })}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
          loadingText="Updating…"
        >
          Update password
        </Button>
      </form>
    </AuthCard>
  );
}
