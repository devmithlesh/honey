'use client';

import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import PasswordInput, { PasswordStrength } from '@/components/auth/PasswordInput';
import { changePassword } from '@/features/auth/authSlice';

/**
 * Password change.
 *
 * The API rotates the token pair on success, so the customer stays signed in
 * here while every other session is invalidated.
 */
export default function ChangePasswordPage() {
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword');

  const onSubmit = async (values) => {
    const result = await dispatch(changePassword(values));

    if (changePassword.rejected.match(result)) {
      const payload = result.payload;
      payload?.errors?.forEach((fieldError) => {
        if (fieldError.field) setError(fieldError.field, { message: fieldError.message });
      });
      toast.error(payload?.message || 'Could not change your password');
      return;
    }

    reset();
    toast.success('Password updated. Other devices have been signed out.');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Change password</h1>
        <p className="mt-2 text-sm text-bark-600">
          Choose something you have not used here before. Every other device will be signed out.
        </p>
      </header>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 max-w-lg rounded-[var(--radius-card)] border border-bark-100 bg-white p-6"
        noValidate
      >
        <div className="space-y-5">
          <PasswordInput
            label="Current password"
            required
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register('currentPassword', { required: 'Enter your current password' })}
          />

          <div>
            <PasswordInput
              label="New password"
              required
              autoComplete="new-password"
              error={errors.newPassword?.message}
              {...register('newPassword', {
                required: 'Choose a new password',
                minLength: { value: 8, message: 'Use at least 8 characters' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                  message: 'Include an uppercase letter, a lowercase letter and a number',
                },
              })}
            />
            <PasswordStrength value={newPassword} />
          </div>

          <PasswordInput
            label="Confirm new password"
            required
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Re-enter your new password',
              validate: (value) => value === newPassword || 'Passwords do not match',
            })}
          />
        </div>

        <Button type="submit" className="mt-6" isLoading={isSubmitting} loadingText="Updating…">
          Update password
        </Button>
      </form>
    </motion.div>
  );
}
