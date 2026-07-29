'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { cn } from '@/lib/utils/cn';

/**
 * Newsletter sign-up.
 *
 * Phase 1 has no mailing-list provider wired up, so the address is validated
 * and acknowledged locally. Replacing the body of `onSubmit` with a POST is the
 * only change needed once a provider is chosen.
 */
export default function NewsletterForm({ className }) {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '' } });

  const onSubmit = async ({ email }) => {
    // Kept deliberately local until a mailing provider is connected.
    await new Promise((resolve) => setTimeout(resolve, 400));
    toast.success(`${email} is on the list — welcome to the hive!`);
    setIsSubscribed(true);
    reset();
  };

  if (isSubscribed) {
    return (
      <p className={cn('rounded-xl bg-bark-800 px-4 py-3 text-sm text-honey-300', className)}>
        You are on the list. Watch your inbox for the next harvest.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-2', className)} noValidate>
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          className="min-w-0 flex-1 rounded-[var(--radius-pill)] border border-bark-700 bg-bark-800 px-4 py-2.5 text-sm text-cream-50 placeholder:text-bark-400 focus:border-honey-400 focus:outline-none"
          {...register('email', {
            required: 'Enter your email address',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
          })}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="shrink-0 rounded-[var(--radius-pill)] bg-honey-500 px-5 py-2.5 text-sm font-semibold text-bark-900 transition-colors hover:bg-honey-400 disabled:opacity-60"
        >
          {isSubmitting ? '…' : 'Join'}
        </button>
      </div>

      {errors.email && (
        <p role="alert" className="text-xs text-honey-300">
          {errors.email.message}
        </p>
      )}
    </form>
  );
}
