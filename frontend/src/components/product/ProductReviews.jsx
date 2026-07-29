'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import Rating, { RatingInput } from '@/components/ui/Rating';
import Input, { Textarea } from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import { ROUTES } from '@/config/site';
import { catalogApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';
import { useAsyncData, useAuth } from '@/lib/hooks';
import { formatDate } from '@/lib/utils/format';

/**
 * Review list, rating histogram and submission form.
 *
 * Reviews are moderated, so a freshly submitted review does not appear in the
 * list — the success message says so explicitly rather than leaving the
 * customer wondering where it went.
 */
export default function ProductReviews({ slug, initialReviews = [], initialBreakdown, ratingAverage, ratingCount }) {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, isLoading, reload } = useAsyncData(
    () => catalogApi.listReviews(slug, { page, limit: 6 }),
    [slug, page],
    { enabled: page > 1 }
  );

  const reviews = page === 1 && !data ? initialReviews : data?.reviews || [];
  const pagination = data?.pagination;
  const breakdown = data?.breakdown || initialBreakdown || {};

  return (
    <section id="reviews" className="scroll-mt-24">
      <h2 className="text-2xl font-semibold sm:text-3xl">Customer reviews</h2>

      <div className="mt-8 grid gap-10 lg:grid-cols-[20rem_1fr] lg:gap-14">
        <div>
          <div className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-6 text-center">
            <p className="font-[family-name:var(--font-display)] text-5xl font-semibold text-bark-900">
              {Number(ratingAverage || 0).toFixed(1)}
            </p>
            <Rating value={ratingAverage} className="mt-3 justify-center" />
            <p className="mt-2 text-sm text-bark-500">
              Based on {ratingCount || 0} review{ratingCount === 1 ? '' : 's'}
            </p>
          </div>

          <ul className="mt-6 space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const total = breakdown[star] || 0;
              const percent = ratingCount > 0 ? Math.round((total / ratingCount) * 100) : 0;

              return (
                <li key={star} className="flex items-center gap-3 text-xs text-bark-600">
                  <span className="w-8 shrink-0">{star} ★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-bark-100">
                    <motion.div
                      className="h-full rounded-full bg-honey-400"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${percent}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right">{total}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-6">
            {isAuthenticated ? (
              <Button onClick={() => setIsFormOpen((open) => !open)} variant="outline" className="w-full">
                {isFormOpen ? 'Cancel' : 'Write a review'}
              </Button>
            ) : (
              <p className="rounded-xl bg-cream-200 px-4 py-3 text-center text-sm text-bark-600">
                <Link href={ROUTES.login} className="font-semibold text-honey-700 underline underline-offset-4">
                  Sign in
                </Link>{' '}
                to leave a review
              </p>
            )}
          </div>
        </div>

        <div>
          <AnimatePresence>
            {isFormOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8 overflow-hidden"
              >
                <ReviewForm
                  slug={slug}
                  onSuccess={() => {
                    setIsFormOpen(false);
                    reload();
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading && page > 1 ? (
            <p className="py-10 text-center text-sm text-bark-500">Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-bark-200 px-6 py-14 text-center">
              <span className="text-3xl" aria-hidden="true">
                ✍️
              </span>
              <p className="mt-3 text-sm font-semibold text-bark-800">No reviews yet</p>
              <p className="mt-1 text-sm text-bark-500">Be the first to tell others what you think.</p>
            </div>
          ) : (
            <ul className="space-y-6">
              {reviews.map((review) => (
                <motion.li
                  key={review.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-full bg-honey-100 text-sm font-bold text-honey-800">
                        {(review.author?.name || '?').charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-bark-900">
                          {review.author?.name || 'Verified customer'}
                        </p>
                        <p className="text-xs text-bark-500">{formatDate(review.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {review.isVerifiedPurchase && (
                        <span className="rounded-[var(--radius-pill)] bg-leaf-100 px-2.5 py-1 text-[11px] font-semibold text-leaf-800">
                          Verified purchase
                        </span>
                      )}
                      <Rating value={review.rating} size="sm" />
                    </div>
                  </div>

                  {review.title && (
                    <h3 className="mt-4 text-sm font-semibold text-bark-900">{review.title}</h3>
                  )}
                  {review.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-bark-600">{review.comment}</p>
                  )}
                </motion.li>
              ))}
            </ul>
          )}

          <Pagination pagination={pagination} onPageChange={setPage} className="mt-10" />
        </div>
      </div>
    </section>
  );
}

function ReviewForm({ slug, onSuccess }) {
  const [rating, setRating] = useState(0);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { title: '', comment: '' } });

  const onSubmit = async (values) => {
    if (rating < 1) {
      toast.error('Choose a star rating first');
      return;
    }

    try {
      await catalogApi.createReview(slug, { ...values, rating });
      toast.success('Thank you! Your review will appear once approved.');
      reset();
      setRating(0);
      onSuccess();
    } catch (error) {
      toast.error(parseApiError(error).message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-[var(--radius-card)] border border-honey-200 bg-honey-50 p-6"
      noValidate
    >
      <h3 className="text-base font-semibold text-bark-900">Write your review</h3>

      <div className="mt-5">
        <span className="mb-2 block text-sm font-medium text-bark-700">Your rating *</span>
        <RatingInput value={rating} onChange={setRating} />
      </div>

      <Input
        label="Review title"
        placeholder="Sum it up in a few words"
        wrapperClassName="mt-5"
        error={errors.title?.message}
        {...register('title', { maxLength: { value: 150, message: 'Keep the title under 150 characters' } })}
      />

      <Textarea
        label="Your review"
        placeholder="What did you think of the taste, texture and packaging?"
        wrapperClassName="mt-4"
        rows={4}
        error={errors.comment?.message}
        {...register('comment', { maxLength: { value: 2000, message: 'Reviews are limited to 2000 characters' } })}
      />

      <Button type="submit" isLoading={isSubmitting} loadingText="Submitting…" className="mt-5">
        Submit review
      </Button>
    </form>
  );
}
