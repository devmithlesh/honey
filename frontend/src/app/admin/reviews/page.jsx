'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Rating from '@/components/ui/Rating';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Modal';
import { AdminHeader } from '@/components/admin/DataTable';
import { ROUTES } from '@/config/site';
import { adminApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';
import { useAsyncData } from '@/lib/hooks';
import { formatDateTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

const TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: '', label: 'All' },
];

/**
 * Review moderation queue.
 *
 * Approving or rejecting recomputes the product's rating aggregates on the
 * server, so the storefront average always reflects published reviews only.
 */
export default function AdminReviewsPage() {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, reload } = useAsyncData(
    () => adminApi.listReviews({ page, limit: 10, status: status || undefined }),
    [page, status]
  );

  const setReviewStatus = async (review, nextStatus) => {
    setBusyId(review.id);
    try {
      await adminApi.setReviewStatus(review.id, { status: nextStatus });
      toast.success(`Review ${nextStatus}`);
      reload();
    } catch (error) {
      toast.error(parseApiError(error).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    try {
      await adminApi.deleteReview(deleteTarget.id);
      toast.success('Review deleted');
      setDeleteTarget(null);
      reload();
    } catch (error) {
      toast.error(parseApiError(error).message);
    }
  };

  const reviews = data?.rows || [];

  return (
    <div>
      <AdminHeader
        title="Reviews"
        description="Only approved reviews appear on the storefront and count toward a product's rating."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={cn(
              'relative rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium transition-colors',
              status === tab.value ? 'text-honey-900' : 'text-bark-600 hover:text-bark-900'
            )}
          >
            {status === tab.value && (
              <motion.span
                layoutId="review-tab"
                className="absolute inset-0 -z-10 rounded-[var(--radius-pill)] bg-honey-100"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon="⭐"
          title={status === 'pending' ? 'Nothing waiting for moderation' : 'No reviews here'}
          description={
            status === 'pending'
              ? 'New reviews will appear here as customers submit them.'
              : 'Try another tab to see reviews in a different state.'
          }
        />
      ) : (
        <ul className="space-y-4">
          <AnimatePresence>
            {reviews.map((review) => (
              <motion.li
                key={review.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-bark-900">
                        {review.author?.name || 'Deleted user'}
                      </p>
                      {review.isVerifiedPurchase && (
                        <span className="rounded-[var(--radius-pill)] bg-leaf-100 px-2 py-0.5 text-[10px] font-semibold text-leaf-800">
                          Verified purchase
                        </span>
                      )}
                      <StatusBadge status={review.status} size="sm" />
                    </div>

                    <p className="mt-1 text-xs text-bark-500">
                      {formatDateTime(review.createdAt)}
                      {review.product && (
                        <>
                          {' · '}
                          <Link
                            href={ROUTES.product(review.product.slug)}
                            target="_blank"
                            className="font-medium text-honey-700 hover:underline"
                          >
                            {review.product.name}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>

                  <Rating value={review.rating} size="sm" />
                </div>

                {review.title && (
                  <h3 className="mt-4 text-sm font-semibold text-bark-900">{review.title}</h3>
                )}
                {review.comment && (
                  <p className="mt-1.5 text-sm leading-relaxed text-bark-600">{review.comment}</p>
                )}

                <div className="mt-5 flex flex-wrap gap-2 border-t border-bark-100 pt-4">
                  {review.status !== 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => setReviewStatus(review, 'approved')}
                      isLoading={busyId === review.id}
                    >
                      Approve
                    </Button>
                  )}

                  {review.status !== 'rejected' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReviewStatus(review, 'rejected')}
                      isLoading={busyId === review.id}
                    >
                      Reject
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(review)}
                    className="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--color-danger)] transition-colors hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Pagination pagination={data?.pagination} onPageChange={setPage} className="mt-8" />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this review?"
        description="It is removed permanently and the product's rating is recalculated."
        confirmLabel="Delete review"
      />
    </div>
  );
}
