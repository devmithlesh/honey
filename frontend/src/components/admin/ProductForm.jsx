'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import Input, { Checkbox, Select, Textarea } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/Modal';
import { adminApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';
import { useAsyncData } from '@/lib/hooks';
import { AdminHeader } from './DataTable';

const BLANK = {
  name: '',
  slug: '',
  sku: '',
  categoryId: '',
  shortDescription: '',
  description: '',
  benefits: '',
  ingredients: '',
  price: '',
  discountPrice: '',
  weight: '',
  stock: 0,
  lowStockThreshold: 10,
  isFeatured: false,
  isActive: true,
  metaTitle: '',
  metaDescription: '',
};

/**
 * Create/edit form for a product.
 *
 * The payload is sent as `multipart/form-data` because new images travel with
 * the fields. Empty optional values are omitted rather than sent as empty
 * strings, which the API's numeric validators would reject.
 */
export default function ProductForm({ product, onSaved }) {
  const router = useRouter();
  const isEditing = Boolean(product);

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [deleteImageTarget, setDeleteImageTarget] = useState(null);

  const { data: categories } = useAsyncData(() => adminApi.listCategories(), []);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: product
      ? {
          ...BLANK,
          ...product,
          categoryId: String(product.categoryId ?? ''),
          discountPrice: product.discountPrice ?? '',
          shortDescription: product.shortDescription ?? '',
          description: product.description ?? '',
          benefits: product.benefits ?? '',
          ingredients: product.ingredients ?? '',
          weight: product.weight ?? '',
          metaTitle: product.metaTitle ?? '',
          metaDescription: product.metaDescription ?? '',
        }
      : BLANK,
  });

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []).slice(0, 6);
    setFiles(selected);
    // Object URLs are revoked when the selection is replaced, so the browser
    // does not hold on to every file the admin has ever previewed.
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  };

  const buildFormData = (values) => {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) return;
      formData.append(key, value);
    });

    files.forEach((file) => formData.append('images', file));
    return formData;
  };

  const onSubmit = async (values) => {
    try {
      const payload = buildFormData(values);

      if (isEditing) {
        await adminApi.updateProduct(product.id, payload);
        toast.success('Product updated');
        setFiles([]);
        setPreviews([]);
        onSaved?.();
      } else {
        const created = await adminApi.createProduct(payload);
        toast.success('Product created');
        router.push(`/admin/products/${created.id}`);
      }
    } catch (error) {
      const parsed = parseApiError(error);
      parsed.errors?.forEach((fieldError) => {
        if (fieldError.field) setError(fieldError.field, { message: fieldError.message });
      });
      toast.error(parsed.message);
    }
  };

  const handleDeleteImage = async () => {
    try {
      await adminApi.deleteProductImage(product.id, deleteImageTarget.id);
      toast.success('Image removed');
      setDeleteImageTarget(null);
      onSaved?.();
    } catch (error) {
      toast.error(parseApiError(error).message);
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await adminApi.setPrimaryImage(product.id, imageId);
      toast.success('Primary image updated');
      onSaved?.();
    } catch (error) {
      toast.error(parseApiError(error).message);
    }
  };

  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-bark-600 transition-colors hover:text-honey-700"
      >
        <span aria-hidden="true">←</span> Back to products
      </Link>

      <AdminHeader
        title={isEditing ? `Edit ${product.name}` : 'Add a product'}
        description={
          isEditing
            ? 'Changes go live on the storefront as soon as you save.'
            : 'Fill in the details and upload at least one photo.'
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1.6fr_1fr]" noValidate>
        <div className="space-y-6">
          <Section title="Basics">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Product name"
                required
                wrapperClassName="sm:col-span-2"
                error={errors.name?.message}
                {...register('name', {
                  required: 'Enter a product name',
                  minLength: { value: 2, message: 'Name is too short' },
                })}
              />

              <Select
                label="Category"
                required
                error={errors.categoryId?.message}
                {...register('categoryId', { required: 'Choose a category' })}
              >
                <option value="">Choose a category…</option>
                {(categories || []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>

              <Input
                label="SKU"
                placeholder="Leave blank to generate one"
                hint="Must be unique across all products."
                error={errors.sku?.message}
                {...register('sku')}
              />

              <Input
                label="URL slug"
                placeholder="Leave blank to derive from the name"
                hint="Changing this breaks existing links."
                wrapperClassName="sm:col-span-2"
                error={errors.slug?.message}
                {...register('slug', {
                  pattern: {
                    value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    message: 'Lowercase letters, numbers and hyphens only',
                  },
                })}
              />

              <Textarea
                label="Short description"
                rows={2}
                wrapperClassName="sm:col-span-2"
                hint="One or two lines, shown on cards and in search results."
                error={errors.shortDescription?.message}
                {...register('shortDescription', {
                  maxLength: { value: 300, message: 'Keep it under 300 characters' },
                })}
              />

              <Textarea
                label="Full description"
                rows={5}
                wrapperClassName="sm:col-span-2"
                hint="Each new line becomes its own paragraph on the product page."
                {...register('description')}
              />

              <Textarea
                label="Benefits"
                rows={4}
                wrapperClassName="sm:col-span-2"
                hint="One benefit per line — these render as a bulleted list."
                {...register('benefits')}
              />

              <Textarea
                label="Ingredients"
                rows={2}
                wrapperClassName="sm:col-span-2"
                {...register('ingredients')}
              />
            </div>
          </Section>

          <Section title="Images">
            {isEditing && product.images?.length > 0 && (
              <div className="mb-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {product.images.map((image) => (
                  <div key={image.id} className="group relative aspect-square overflow-hidden rounded-xl bg-cream-200">
                    <Image src={image.url} alt="" fill sizes="120px" className="object-cover" />

                    {image.isPrimary && (
                      <span className="absolute top-1.5 left-1.5 rounded-full bg-honey-500 px-2 py-0.5 text-[10px] font-bold text-bark-900">
                        Primary
                      </span>
                    )}

                    <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-bark-900/70 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                      {!image.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(image.id)}
                          className="rounded px-2 py-1 text-[10px] font-semibold text-cream-50 hover:bg-white/15"
                        >
                          Make primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteImageTarget(image)}
                        className="rounded px-2 py-1 text-[10px] font-semibold text-red-300 hover:bg-white/15"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-bark-200 px-6 py-10 text-center transition-colors hover:border-honey-300 hover:bg-honey-50">
              <span className="text-2xl" aria-hidden="true">
                📷
              </span>
              <span className="mt-2 text-sm font-medium text-bark-700">
                Click to upload images
              </span>
              <span className="mt-1 text-xs text-bark-500">
                JPG, PNG, WebP or AVIF · up to 6 files · max 5 MB each
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>

            <AnimatePresence>
              {previews.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <p className="mb-2 text-xs font-semibold text-bark-600">
                    {previews.length} new image{previews.length === 1 ? '' : 's'} ready to upload
                  </p>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {previews.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={url}
                        alt=""
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Section>

          <Section title="Search engine listing">
            <div className="space-y-5">
              <Input
                label="Meta title"
                hint="Defaults to the product name if left blank."
                error={errors.metaTitle?.message}
                {...register('metaTitle', {
                  maxLength: { value: 180, message: 'Keep it under 180 characters' },
                })}
              />
              <Textarea
                label="Meta description"
                rows={2}
                hint="Defaults to the short description if left blank."
                error={errors.metaDescription?.message}
                {...register('metaDescription', {
                  maxLength: { value: 300, message: 'Keep it under 300 characters' },
                })}
              />
            </div>
          </Section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Section title="Pricing">
            <div className="space-y-5">
              <Input
                label="Price (₹)"
                required
                type="number"
                step="0.01"
                min="0"
                error={errors.price?.message}
                {...register('price', {
                  required: 'Enter a price',
                  min: { value: 0, message: 'Price cannot be negative' },
                })}
              />

              <Input
                label="Discounted price (₹)"
                type="number"
                step="0.01"
                min="0"
                hint="Leave blank if the item is not on offer."
                error={errors.discountPrice?.message}
                {...register('discountPrice', {
                  min: { value: 0, message: 'Discount cannot be negative' },
                })}
              />

              <Input label="Weight / size" placeholder="500 g" {...register('weight')} />
            </div>
          </Section>

          <Section title="Inventory">
            <div className="space-y-5">
              <Input
                label="Stock on hand"
                required
                type="number"
                min="0"
                hint="Changing this is recorded in the inventory ledger."
                error={errors.stock?.message}
                {...register('stock', {
                  required: 'Enter the stock level',
                  min: { value: 0, message: 'Stock cannot be negative' },
                })}
              />

              <Input
                label="Low stock alert at"
                type="number"
                min="0"
                hint="The dashboard flags the product at or below this level."
                {...register('lowStockThreshold', {
                  min: { value: 0, message: 'Threshold cannot be negative' },
                })}
              />
            </div>
          </Section>

          <Section title="Visibility">
            <div className="space-y-4">
              <Checkbox
                label="Active — visible in the shop"
                {...register('isActive')}
              />
              <Checkbox
                label="Featured — show on the home page"
                {...register('isFeatured')}
              />
            </div>
          </Section>

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              loadingText={isEditing ? 'Saving…' : 'Creating…'}
            >
              {isEditing ? 'Save changes' : 'Create product'}
            </Button>

            <Button type="button" variant="outline" href="/admin/products">
              Cancel
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        isOpen={Boolean(deleteImageTarget)}
        onClose={() => setDeleteImageTarget(null)}
        onConfirm={handleDeleteImage}
        title="Delete this image?"
        description="It is removed from the product and deleted from storage."
        confirmLabel="Delete image"
      />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-5 sm:p-6">
      <h2 className="mb-5 text-sm font-semibold tracking-wide text-bark-500 uppercase">{title}</h2>
      {children}
    </section>
  );
}
