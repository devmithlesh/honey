'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Input, { Checkbox, Textarea } from '@/components/ui/Input';
import { AdminHeader } from '@/components/admin/DataTable';
import { adminApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';
import { useAsyncData } from '@/lib/hooks';
import { cn } from '@/lib/utils/cn';

/**
 * Field map for the settings form.
 *
 * The settings table is a free-form key/value store, so this declares which
 * keys the admin can edit and how each should be rendered. Adding a key here is
 * all that is needed to expose a new setting.
 */
const GROUPS = [
  {
    id: 'general',
    label: 'General',
    icon: '🏪',
    fields: [
      { key: 'site_name', label: 'Website name' },
      { key: 'site_tagline', label: 'Tagline' },
      { key: 'site_logo_url', label: 'Logo URL', type: 'image' },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: '📞',
    fields: [
      { key: 'contact_email', label: 'Contact email', type: 'email' },
      { key: 'contact_phone', label: 'Contact phone' },
      {
        key: 'whatsapp_number',
        label: 'WhatsApp number',
        hint: 'Country code and number, digits only — e.g. 918196969106',
      },
      { key: 'contact_address', label: 'Farm address', type: 'textarea' },
    ],
  },
  {
    id: 'social',
    label: 'Social links',
    icon: '🔗',
    fields: [
      { key: 'social_instagram', label: 'Instagram URL' },
      { key: 'social_facebook', label: 'Facebook URL' },
    ],
  },
  {
    id: 'shipping',
    label: 'Shipping',
    icon: '🚚',
    fields: [
      {
        key: 'shipping_charge',
        label: 'Flat shipping charge (₹)',
        type: 'number',
        hint: 'Applied to every order below the free-shipping threshold.',
      },
      {
        key: 'free_shipping_threshold',
        label: 'Free shipping above (₹)',
        type: 'number',
        hint: 'Set to 0 to never offer free shipping.',
      },
    ],
  },
  {
    id: 'payment',
    label: 'Payment',
    icon: '💳',
    fields: [
      { key: 'upi_id', label: 'UPI ID', hint: 'Shown at checkout for manual UPI payments.' },
      { key: 'upi_qr_url', label: 'UPI QR code', type: 'image' },
      { key: 'cod_enabled', label: 'Accept cash on delivery', type: 'boolean' },
    ],
  },
  {
    id: 'seo',
    label: 'SEO',
    icon: '🔍',
    fields: [
      { key: 'seo_meta_title', label: 'Default meta title' },
      { key: 'seo_meta_description', label: 'Default meta description', type: 'textarea' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: '📦',
    fields: [
      {
        key: 'low_stock_threshold',
        label: 'Default low stock threshold',
        type: 'number',
        hint: 'Used for new products; each product can override it.',
      },
    ],
  },
];

export default function AdminSettingsPage() {
  const { data, isLoading, reload } = useAsyncData(() => adminApi.getSettings(), []);
  const [activeGroup, setActiveGroup] = useState('general');
  const [uploadingKey, setUploadingKey] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm({ defaultValues: {} });

  // The form is populated once the values arrive rather than being controlled,
  // so typing does not re-render the whole form on every keystroke.
  useEffect(() => {
    if (!data?.values) return;

    const defaults = {};
    GROUPS.forEach((group) => {
      group.fields.forEach((field) => {
        const value = data.values[field.key];
        defaults[field.key] =
          field.type === 'boolean' ? Boolean(value) : value === null || value === undefined ? '' : value;
      });
    });

    reset(defaults);
  }, [data, reset]);

  const onSubmit = async (values) => {
    try {
      await adminApi.updateSettings(values);
      toast.success('Settings saved');
      reload();
    } catch (error) {
      const parsed = parseApiError(error);
      toast.error(parsed.message);
      parsed.errors?.forEach((fieldError) => toast.error(fieldError.message));
    }
  };

  const handleImageUpload = async (key, file) => {
    if (!file) return;

    setUploadingKey(key);
    const formData = new FormData();
    formData.append('image', file);

    try {
      await adminApi.uploadSettingImage(key, formData);
      toast.success('Image uploaded');
      reload();
    } catch (error) {
      toast.error(parseApiError(error).message);
    } finally {
      setUploadingKey(null);
    }
  };

  if (isLoading) {
    return (
      <div role="status" aria-busy="true">
        <span className="sr-only">Loading settings…</span>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-[32rem] w-full rounded-[var(--radius-card)]" />
      </div>
    );
  }

  const active = GROUPS.find((group) => group.id === activeGroup);

  return (
    <div>
      <AdminHeader
        title="Settings"
        description="Business details, shipping rules and payment options used across the storefront."
      />

      <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Settings sections">
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            {GROUPS.map((group) => (
              <li key={group.id} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={() => setActiveGroup(group.id)}
                  className={cn(
                    'relative flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                    activeGroup === group.id
                      ? 'text-honey-900'
                      : 'text-bark-700 hover:bg-white'
                  )}
                >
                  {activeGroup === group.id && (
                    <motion.span
                      layoutId="settings-nav"
                      className="absolute inset-0 -z-10 rounded-xl bg-honey-100"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span aria-hidden="true">{group.icon}</span>
                  {group.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <motion.section
            key={activeGroup}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-[var(--radius-card)] border border-bark-100 bg-white p-6"
          >
            <h2 className="text-base font-semibold text-bark-900">{active.label}</h2>

            <div className="mt-6 space-y-5">
              {active.fields.map((field) => {
                if (field.type === 'boolean') {
                  return (
                    <Checkbox key={field.key} label={field.label} {...register(field.key)} />
                  );
                }

                if (field.type === 'textarea') {
                  return (
                    <Textarea
                      key={field.key}
                      label={field.label}
                      hint={field.hint}
                      rows={3}
                      {...register(field.key)}
                    />
                  );
                }

                if (field.type === 'image') {
                  const currentUrl = data?.values?.[field.key];

                  return (
                    <div key={field.key}>
                      <span className="mb-1.5 block text-sm font-medium text-bark-700">
                        {field.label}
                      </span>

                      <div className="flex flex-wrap items-center gap-4">
                        {currentUrl ? (
                          <div className="relative size-24 overflow-hidden rounded-xl border border-bark-100 bg-cream-100">
                            <Image
                              src={currentUrl}
                              alt={field.label}
                              fill
                              sizes="96px"
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="grid size-24 place-items-center rounded-xl border border-dashed border-bark-200 text-xs text-bark-400">
                            None
                          </div>
                        )}

                        <label className="cursor-pointer rounded-[var(--radius-pill)] border border-bark-200 px-5 py-2.5 text-sm font-semibold text-bark-700 transition-colors hover:bg-bark-50">
                          {uploadingKey === field.key ? 'Uploading…' : 'Upload image'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            className="sr-only"
                            onChange={(event) =>
                              handleImageUpload(field.key, event.target.files?.[0])
                            }
                          />
                        </label>
                      </div>

                      <Input
                        label="or paste a URL"
                        hint={field.hint}
                        wrapperClassName="mt-3"
                        {...register(field.key)}
                      />
                    </div>
                  );
                }

                return (
                  <Input
                    key={field.key}
                    label={field.label}
                    hint={field.hint}
                    type={field.type || 'text'}
                    step={field.type === 'number' ? '0.01' : undefined}
                    {...register(field.key)}
                  />
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap gap-3 border-t border-bark-100 pt-6">
              <Button type="submit" isLoading={isSubmitting} loadingText="Saving…" disabled={!isDirty}>
                Save settings
              </Button>
              {isDirty && (
                <Button type="button" variant="ghost" onClick={() => reload()}>
                  Discard changes
                </Button>
              )}
            </div>
          </motion.section>
        </form>
      </div>
    </div>
  );
}
