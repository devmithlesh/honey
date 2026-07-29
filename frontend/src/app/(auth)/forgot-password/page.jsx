'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import AuthCard from '@/components/auth/AuthCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ROUTES } from '@/config/site';
import { authApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';

/**
 * Password reset request.
 *
 * The confirmation is deliberately identical whether or not an account exists,
 * matching the API — otherwise the page becomes a way to discover which
 * addresses are registered.
 */
export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '' } });

  const onSubmit = async (values) => {
    try {
      await authApi.forgotPassword(values);
      setSentTo(values.email);
    } catch (error) {
      toast.error(parseApiError(error).message);
    }
  };

  if (sentTo) {
    return (
      <AuthCard title="Check your inbox">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[var(--radius-card)] border border-leaf-200 bg-leaf-50 p-6 text-center"
        >
          <span className="text-3xl" aria-hidden="true">
            📬
          </span>
          <p className="mt-4 text-sm text-bark-700">
            If an account exists for <span className="font-semibold">{sentTo}</span>, we have sent a
            reset link to it. The link is valid for 15 minutes.
          </p>
          <p className="mt-3 text-xs text-bark-500">
            Nothing arrived? Check your spam folder, then try again.
          </p>
        </motion.div>

        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={() => onSubmit({ email: getValues('email') })} variant="outline">
            Resend the link
          </Button>
          <Button href={ROUTES.login} variant="ghost">
            Back to sign in
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter the email address on your account and we will send you a link to choose a new password."
      footer={
        <>
          Remembered it?{' '}
          <Link href={ROUTES.login} className="font-semibold text-honey-700 underline underline-offset-4">
            Back to sign in
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

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
          loadingText="Sending the link…"
        >
          Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}
