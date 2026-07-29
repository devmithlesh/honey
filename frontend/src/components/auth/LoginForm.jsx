'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import AuthCard from './AuthCard';
import PasswordInput from './PasswordInput';
import Button from '@/components/ui/Button';
import Input, { Checkbox } from '@/components/ui/Input';
import { ROUTES } from '@/config/site';
import { login } from '@/features/auth/authSlice';
import { fetchWishlist } from '@/features/wishlist/wishlistSlice';
import { useAuth } from '@/lib/hooks';

/**
 * Sign-in form.
 *
 * Honours a `?redirect=` parameter so a customer sent here from checkout or a
 * wishlist button lands back where they were, rather than on the dashboard.
 */
export default function LoginForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const { isAuthenticated, isAdmin } = useAuth();

  const redirectTo = searchParams.get('redirect');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '' } });

  // Someone already signed in has no business on this page.
  useEffect(() => {
    if (!isAuthenticated) return;
    router.replace(redirectTo || (isAdmin ? ROUTES.admin : ROUTES.account));
  }, [isAuthenticated, isAdmin, redirectTo, router]);

  const onSubmit = async (values) => {
    const result = await dispatch(login(values));

    if (login.rejected.match(result)) {
      const message = result.payload?.message || 'Sign in failed';
      // A 401 is a credential problem; anything else is worth a toast too.
      setError('password', { message });
      toast.error(message);
      return;
    }

    dispatch(fetchWishlist());
    toast.success(`Welcome back, ${result.payload.name.split(' ')[0]}!`);
    router.replace(redirectTo || (result.payload.role === 'admin' ? ROUTES.admin : ROUTES.account));
  };

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to track orders, manage addresses and pick up where you left off."
      footer={
        <>
          New here?{' '}
          <Link
            href={redirectTo ? `${ROUTES.register}?redirect=${encodeURIComponent(redirectTo)}` : ROUTES.register}
            className="font-semibold text-honey-700 underline underline-offset-4"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          label="Email address"
          type="email"
          required
          autoComplete="email"
          autoFocus
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'Enter your email address',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
          })}
        />

        <div>
          <PasswordInput
            label="Password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', { required: 'Enter your password' })}
          />

          <div className="mt-3 flex items-center justify-between">
            <Checkbox label="Keep me signed in" defaultChecked disabled />
            <Link
              href={ROUTES.forgotPassword}
              className="text-sm font-medium text-honey-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
          loadingText="Signing you in…"
        >
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
