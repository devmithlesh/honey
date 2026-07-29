'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import DataTable, { AdminHeader } from '@/components/admin/DataTable';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import Input, { Checkbox, Select } from '@/components/ui/Input';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import { adminApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';
import { useAsyncData } from '@/lib/hooks';
import { formatCurrency, formatDate } from '@/lib/utils/format';

const BLANK = {
  code: '',
  description: '',
  type: 'percentage',
  value: '',
  minOrderAmount: 0,
  maxDiscountAmount: '',
  usageLimit: '',
  usageLimitPerUser: 1,
  startsAt: '',
  expiresAt: '',
  isActive: true,
};

/** `2026-07-29T00:00:00.000Z` -> `2026-07-29`, for a date input's value. */
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

export default function AdminCouponsPage() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, reload } = useAsyncData(
    () => adminApi.listCoupons({ page, limit: 20 }),
    [page]
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await adminApi.deleteCoupon(deleteTarget.id);
      toast.success('Coupon deleted');
      setDeleteTarget(null);
      reload();
    } catch (error) {
      toast.error(parseApiError(error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Code',
      cell: (coupon) => (
        <div>
          <p className="font-[family-name:var(--font-display)] font-bold text-bark-900">
            {coupon.code}
          </p>
          <p className="line-clamp-1 max-w-xs text-xs text-bark-500">{coupon.description || '—'}</p>
        </div>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      cell: (coupon) => (
        <span className="font-semibold text-bark-900">
          {coupon.type === 'percentage'
            ? `${Number(coupon.value)}%`
            : formatCurrency(coupon.value)}
        </span>
      ),
    },
    {
      key: 'minOrder',
      header: 'Min. order',
      hideBelow: 'md',
      cell: (coupon) => (
        <span className="text-bark-600">
          {Number(coupon.minOrderAmount) > 0 ? formatCurrency(coupon.minOrderAmount) : '—'}
        </span>
      ),
    },
    {
      key: 'used',
      header: 'Used',
      hideBelow: 'sm',
      cell: (coupon) => (
        <span className="text-bark-700">
          {coupon.usedCount}
          {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
        </span>
      ),
    },
    {
      key: 'expires',
      header: 'Expires',
      hideBelow: 'lg',
      cell: (coupon) => (
        <span className="text-bark-600">
          {coupon.expiresAt ? formatDate(coupon.expiresAt) : 'No expiry'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (coupon) => {
        const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
        const isExhausted = coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;

        if (!coupon.isActive) {
          return (
            <Badge tone="neutral" size="sm">
              Disabled
            </Badge>
          );
        }
        if (isExpired) {
          return (
            <Badge tone="danger" size="sm">
              Expired
            </Badge>
          );
        }
        if (isExhausted) {
          return (
            <Badge tone="muted" size="sm">
              Used up
            </Badge>
          );
        }
        return (
          <Badge tone="success" size="sm">
            Active
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (coupon) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              setEditing(coupon);
              setIsFormOpen(true);
            }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-bark-700 transition-colors hover:bg-bark-100"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(coupon)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--color-danger)] transition-colors hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminHeader
        title="Coupons"
        description="Discount codes customers can apply in the basket."
      >
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setIsFormOpen(true);
          }}
        >
          Create coupon
        </Button>
      </AdminHeader>

      <DataTable
        columns={columns}
        rows={data?.rows}
        isLoading={isLoading}
        emptyMessage="No coupons yet — create your first one"
      />

      <Pagination pagination={data?.pagination} onPageChange={setPage} className="mt-6" />

      <CouponFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        coupon={editing}
        onSaved={() => {
          setIsFormOpen(false);
          reload();
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={`Delete ${deleteTarget?.code}?`}
        description="Customers will no longer be able to redeem it. Orders that already used it are unaffected."
        confirmLabel="Delete coupon"
      />
    </div>
  );
}

function CouponFormModal({ isOpen, onClose, coupon, onSaved }) {
  const isEditing = Boolean(coupon);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: BLANK,
    values: coupon
      ? {
          ...BLANK,
          ...coupon,
          description: coupon.description ?? '',
          maxDiscountAmount: coupon.maxDiscountAmount ?? '',
          usageLimit: coupon.usageLimit ?? '',
          startsAt: toDateInput(coupon.startsAt),
          expiresAt: toDateInput(coupon.expiresAt),
        }
      : BLANK,
  });

  const type = watch('type');

  const onSubmit = async (values) => {
    // Empty optional fields are dropped: the API's numeric and date validators
    // reject empty strings, and omitting them means "leave unset".
    const payload = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== '' && value !== null)
    );

    try {
      if (isEditing) {
        await adminApi.updateCoupon(coupon.id, payload);
        toast.success('Coupon updated');
      } else {
        await adminApi.createCoupon(payload);
        toast.success('Coupon created');
      }
      reset(BLANK);
      onSaved();
    } catch (error) {
      const parsed = parseApiError(error);
      toast.error(parsed.message);
      parsed.errors?.forEach((fieldError) => toast.error(fieldError.message));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit ${coupon.code}` : 'Create a coupon'}
      description="Codes are stored uppercase and matched case-insensitively at checkout."
      className="sm:max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Code"
            required
            placeholder="WELCOME10"
            className="uppercase"
            error={errors.code?.message}
            {...register('code', {
              required: 'Enter a coupon code',
              pattern: {
                value: /^[A-Za-z0-9_-]{3,50}$/,
                message: 'Letters, numbers, hyphens and underscores only',
              },
            })}
          />

          <Select label="Discount type" required {...register('type')}>
            <option value="percentage">Percentage off</option>
            <option value="fixed">Fixed amount off</option>
          </Select>

          <Input
            label={type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}
            required
            type="number"
            step="0.01"
            min="0.01"
            error={errors.value?.message}
            {...register('value', {
              required: 'Enter the discount value',
              min: { value: 0.01, message: 'Must be greater than zero' },
              max:
                type === 'percentage'
                  ? { value: 100, message: 'A percentage cannot exceed 100' }
                  : undefined,
            })}
          />

          <Input
            label="Minimum order (₹)"
            type="number"
            step="0.01"
            min="0"
            hint="0 means no minimum."
            {...register('minOrderAmount', { min: { value: 0, message: 'Cannot be negative' } })}
            error={errors.minOrderAmount?.message}
          />

          {type === 'percentage' && (
            <Input
              label="Maximum discount (₹)"
              type="number"
              step="0.01"
              min="0"
              hint="Caps how much a percentage coupon can take off."
              {...register('maxDiscountAmount')}
            />
          )}

          <Input
            label="Total uses allowed"
            type="number"
            min="1"
            hint="Leave blank for unlimited."
            {...register('usageLimit')}
          />

          <Input
            label="Uses per customer"
            type="number"
            min="0"
            hint="0 means unlimited per customer."
            {...register('usageLimitPerUser', { min: { value: 0, message: 'Cannot be negative' } })}
            error={errors.usageLimitPerUser?.message}
          />

          <Input label="Starts on" type="date" {...register('startsAt')} />
          <Input label="Expires on" type="date" {...register('expiresAt')} />

          <Input
            label="Description"
            placeholder="10% off your first order"
            wrapperClassName="sm:col-span-2"
            {...register('description', {
              maxLength: { value: 255, message: 'Keep it under 255 characters' },
            })}
            error={errors.description?.message}
          />
        </div>

        <Checkbox label="Active — customers can redeem this code" {...register('isActive')} />

        <div className="flex flex-wrap justify-end gap-3 border-t border-bark-100 pt-5">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} loadingText="Saving…">
            {isEditing ? 'Save changes' : 'Create coupon'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
