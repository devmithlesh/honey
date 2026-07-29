'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import DataTable, { AdminHeader } from '@/components/admin/DataTable';
import Badge from '@/components/ui/Badge';
import Input, { Checkbox, Textarea } from '@/components/ui/Input';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import { adminApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';
import { useAsyncData } from '@/lib/hooks';

const BLANK = {
  name: '',
  slug: '',
  description: '',
  sortOrder: 0,
  isActive: true,
  metaTitle: '',
  metaDescription: '',
};

export default function AdminCategoriesPage() {
  const { data: categories, isLoading, reload } = useAsyncData(() => adminApi.listCategories(), []);

  const [editing, setEditing] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await adminApi.deleteCategory(deleteTarget.id);
      toast.success('Category deleted');
      setDeleteTarget(null);
      reload();
    } catch (error) {
      // A category holding products is rejected by the API with a clear reason.
      toast.error(parseApiError(error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Category',
      cell: (category) => (
        <div>
          <p className="font-medium text-bark-900">{category.name}</p>
          <p className="text-xs text-bark-500">/{category.slug}</p>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      hideBelow: 'lg',
      cell: (category) => (
        <p className="line-clamp-2 max-w-md text-xs text-bark-600">{category.description || '—'}</p>
      ),
    },
    {
      key: 'products',
      header: 'Products',
      hideBelow: 'sm',
      cell: (category) => <span className="text-bark-700">{category.productCount ?? 0}</span>,
    },
    {
      key: 'sortOrder',
      header: 'Order',
      hideBelow: 'md',
      cell: (category) => <span className="text-bark-600">{category.sortOrder}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (category) => (
        <Badge tone={category.isActive ? 'success' : 'neutral'} size="sm">
          {category.isActive ? 'Active' : 'Hidden'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (category) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              setEditing(category);
              setIsFormOpen(true);
            }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-bark-700 transition-colors hover:bg-bark-100"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(category)}
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
        title="Categories"
        description="How products are grouped in the shop filters and navigation."
      >
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setIsFormOpen(true);
          }}
        >
          Add category
        </Button>
      </AdminHeader>

      <DataTable
        columns={columns}
        rows={categories}
        isLoading={isLoading}
        emptyMessage="No categories yet — add your first one"
      />

      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        category={editing}
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
        title={`Delete ${deleteTarget?.name}?`}
        description="A category that still holds products cannot be deleted — move them first."
        confirmLabel="Delete category"
      />
    </div>
  );
}

function CategoryFormModal({ isOpen, onClose, category, onSaved }) {
  const isEditing = Boolean(category);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: BLANK,
    values: category ? { ...BLANK, ...category, description: category.description ?? '' } : BLANK,
  });

  const onSubmit = async (values) => {
    // Blank optional strings are dropped so the API's `.allow('')` rules and
    // slug generation behave as intended.
    const payload = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== '' && value !== null)
    );

    try {
      if (isEditing) {
        await adminApi.updateCategory(category.id, payload);
        toast.success('Category updated');
      } else {
        await adminApi.createCategory(payload);
        toast.success('Category created');
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
      title={isEditing ? `Edit ${category.name}` : 'Add a category'}
      description="Categories drive the shop filters, so keep the names short and obvious."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          label="Name"
          required
          error={errors.name?.message}
          {...register('name', { required: 'Enter a category name' })}
        />

        <Input
          label="URL slug"
          placeholder="Leave blank to derive from the name"
          error={errors.slug?.message}
          {...register('slug', {
            pattern: {
              value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
              message: 'Lowercase letters, numbers and hyphens only',
            },
          })}
        />

        <Textarea label="Description" rows={3} {...register('description')} />

        <Input
          label="Sort order"
          type="number"
          min="0"
          hint="Lower numbers appear first in the filter list."
          {...register('sortOrder', { min: { value: 0, message: 'Cannot be negative' } })}
          error={errors.sortOrder?.message}
        />

        <Checkbox label="Active — show in the shop" {...register('isActive')} />

        <div className="flex flex-wrap justify-end gap-3 border-t border-bark-100 pt-5">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} loadingText="Saving…">
            {isEditing ? 'Save changes' : 'Create category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
