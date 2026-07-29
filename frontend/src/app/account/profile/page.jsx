'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { setUser } from '@/features/auth/authSlice';
import { accountApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks';
import { formatDate } from '@/lib/utils/format';

/**
 * Profile editor.
 *
 * Only name, email and phone are editable here. Password lives on its own page
 * because changing it rotates the session, and the role is never client-writable.
 */
export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ defaultValues: { name: '', email: '', phone: '' } });

  useEffect(() => {
    if (!user) return;
    reset({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
  }, [user, reset]);

  const onSubmit = async (values) => {
    try {
      const result = await accountApi.updateProfile({
        name: values.name,
        email: values.email,
        phone: values.phone || null,
      });

      dispatch(setUser(result.user));
      reset({
        name: result.user.name || '',
        email: result.user.email || '',
        phone: result.user.phone || '',
      });
      toast.success('Profile updated');
    } catch (caught) {
      const parsed = parseApiError(caught);
      parsed.errors?.forEach((fieldError) => {
        if (fieldError.field) setError(fieldError.field, { message: fieldError.message });
      });
      toast.error(parsed.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">My profile</h1>
        <p className="mt-2 text-sm text-bark-600">
          Keep these up to date so your order confirmations and deliveries reach you.
        </p>
      </header>

      <div className="mt-8 flex items-center gap-4 rounded-[var(--radius-card)] border border-bark-100 bg-white p-5">
        <span className="grid size-16 place-items-center rounded-full bg-honey-200 text-xl font-bold text-honey-900">
          {(user?.name || '?').charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="text-base font-semibold text-bark-900">{user?.name}</p>
          <p className="text-sm text-bark-500">{user?.email}</p>
          {user?.createdAt && (
            <p className="mt-1 text-xs text-bark-400">
              Member since {formatDate(user.createdAt)}
            </p>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 rounded-[var(--radius-card)] border border-bark-100 bg-white p-6"
        noValidate
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Full name"
            required
            autoComplete="name"
            error={errors.name?.message}
            {...register('name', {
              required: 'Enter your name',
              minLength: { value: 2, message: 'Enter your full name' },
            })}
          />

          <Input
            label="Mobile number"
            type="tel"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register('phone', {
              pattern: { value: /^[+]?[\d\s\-()]{7,20}$/, message: 'Enter a valid phone number' },
            })}
          />

          <Input
            label="Email address"
            type="email"
            required
            autoComplete="email"
            wrapperClassName="sm:col-span-2"
            hint="Order confirmations and delivery updates go here."
            error={errors.email?.message}
            {...register('email', {
              required: 'Enter your email address',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address',
              },
            })}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" isLoading={isSubmitting} loadingText="Saving…" disabled={!isDirty}>
            Save changes
          </Button>

          {isDirty && (
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                reset({ name: user.name || '', email: user.email || '', phone: user.phone || '' })
              }
            >
              Discard
            </Button>
          )}
        </div>
      </form>
    </motion.div>
  );
}
