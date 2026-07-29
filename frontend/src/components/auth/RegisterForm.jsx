'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import AuthCard from './AuthCard';
import PasswordInput, { PasswordStrength } from './PasswordInput';
import Button from '@/components/ui/Button';
import Input, { Checkbox } from '@/components/ui/Input';
import { ROUTES } from '@/config/site';
import { register as registerAccount } from '@/features/auth/authSlice';
import { useAuth } from '@/lib/hooks';

/**
 * Account creation.
 *
 * The password rules mirror the API's Joi schema exactly, so the form never
 * lets through something the server will reject.
 */
export default function RegisterForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const redirectTo = searchParams.get('redirect');

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false,
    },
  });

  const password = watch('password');

  useEffect(() => {
    if (isAuthenticated) router.replace(redirectTo || ROUTES.account);
  }, [isAuthenticated, redirectTo, router]);

  const onSubmit = async (values) => {
    const result = await dispatch(
      registerAccount({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
        confirmPassword: values.confirmPassword,
      })
    );

    if (registerAccount.rejected.match(result)) {
      const payload = result.payload;
      // Field-level messages from the API land on the matching input.
      payload?.errors?.forEach((fieldError) => {
        if (fieldError.field) setError(fieldError.field, { message: fieldError.message });
      });
      toast.error(payload?.message || 'Registration failed');
      return;
    }

    toast.success('Welcome to the hive!');
    router.replace(redirectTo || ROUTES.account);
  };

  return (
    <AuthCard
      title="Create your account"
      description="It takes about thirty seconds and makes every future order faster."
      footer={
        <>
          Already have an account?{' '}
          <Link
            href={redirectTo ? `${ROUTES.login}?redirect=${encodeURIComponent(redirectTo)}` : ROUTES.login}
            className="font-semibold text-honey-700 underline underline-offset-4"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          label="Full name"
          required
          autoComplete="name"
          autoFocus
          error={errors.name?.message}
          {...register('name', {
            required: 'Enter your name',
            minLength: { value: 2, message: 'Enter your full name' },
            maxLength: { value: 120, message: 'That name is too long' },
          })}
        />

        <Input
          label="Email address"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'Enter your email address',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
          })}
        />

        <Input
          label="Mobile number"
          type="tel"
          autoComplete="tel"
          hint="Optional — we only use it for delivery updates."
          error={errors.phone?.message}
          {...register('phone', {
            pattern: { value: /^[+]?[\d\s\-()]{7,20}$/, message: 'Enter a valid phone number' },
          })}
        />

        <div>
          <PasswordInput
            label="Password"
            required
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password', {
              required: 'Choose a password',
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
          label="Confirm password"
          required
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Re-enter your password',
            validate: (value) => value === password || 'Passwords do not match',
          })}
        />

        <div>
          <Checkbox
            label={
              <>
                I agree to the{' '}
                <Link href={ROUTES.termsConditions} className="underline underline-offset-2">
                  terms
                </Link>{' '}
                and{' '}
                <Link href={ROUTES.privacyPolicy} className="underline underline-offset-2">
                  privacy policy
                </Link>
              </>
            }
            {...register('acceptedTerms', { required: 'Please accept the terms to continue' })}
          />
          {errors.acceptedTerms && (
            <p role="alert" className="mt-1.5 text-xs text-[var(--color-danger)]">
              {errors.acceptedTerms.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
          loadingText="Creating your account…"
        >
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
