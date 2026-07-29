'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import Input, { Checkbox, Select } from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import { accountApi } from '@/lib/api/services';
import { parseApiError } from '@/lib/api/client';
import { useAsyncData } from '@/lib/hooks';

const BLANK = {
  label: '',
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  type: 'shipping',
  isDefault: false,
};

/**
 * Saved addresses.
 *
 * The list is reloaded from the API after each mutation rather than patched
 * locally, because the server also adjusts the default flag on *other* rows —
 * a local patch would show two defaults until the next refresh.
 */
export default function AddressesPage() {
  const { data: addresses, isLoading, reload } = useAsyncData(() => accountApi.listAddresses(), []);

  const [editing, setEditing] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const openEdit = (address) => {
    setEditing(address);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await accountApi.deleteAddress(deleteTarget.id);
      toast.success('Address deleted');
      setDeleteTarget(null);
      reload();
    } catch (error) {
      toast.error(parseApiError(error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async (address) => {
    try {
      await accountApi.setDefaultAddress(address.id);
      toast.success('Default address updated');
      reload();
    } catch (error) {
      toast.error(parseApiError(error).message);
    }
  };

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Saved addresses</h1>
          <p className="mt-2 text-sm text-bark-600">
            Save up to ten addresses so checkout is a matter of picking one.
          </p>
        </div>

        <Button onClick={openCreate}>Add address</Button>
      </header>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }, (_, index) => (
              <Skeleton key={index} className="h-52 w-full rounded-[var(--radius-card)]" />
            ))}
          </div>
        ) : !addresses || addresses.length === 0 ? (
          <EmptyState
            icon="📍"
            title="No addresses saved yet"
            description="Add one now and your next checkout will take seconds."
            actionLabel="Add your first address"
            onAction={openCreate}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence>
              {addresses.map((address) => (
                <motion.div
                  key={address.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col rounded-[var(--radius-card)] border border-bark-100 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-bark-900">
                        {address.label || address.fullName}
                      </p>
                      <p className="mt-0.5 text-xs text-bark-500 capitalize">{address.type}</p>
                    </div>

                    {address.isDefault && (
                      <span className="rounded-[var(--radius-pill)] bg-leaf-100 px-2.5 py-1 text-[11px] font-semibold text-leaf-800">
                        Default
                      </span>
                    )}
                  </div>

                  <p className="mt-4 flex-1 text-sm leading-relaxed text-bark-600">
                    {address.fullName}
                    <br />
                    {address.line1}
                    {address.line2 && (
                      <>
                        <br />
                        {address.line2}
                      </>
                    )}
                    <br />
                    {address.city}, {address.state} {address.postalCode}
                    <br />
                    {address.country}
                    <br />
                    <span className="mt-1 inline-block">{address.phone}</span>
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-bark-100 pt-4">
                    <button
                      type="button"
                      onClick={() => openEdit(address)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-bark-700 transition-colors hover:bg-bark-50"
                    >
                      Edit
                    </button>

                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(address)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-honey-700 transition-colors hover:bg-honey-50"
                      >
                        Make default
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(address)}
                      className="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--color-danger)] transition-colors hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AddressFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        address={editing}
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
        title="Delete this address?"
        description="It will be removed from your account. Orders already placed keep the address they were shipped to."
        confirmLabel="Delete address"
      />
    </div>
  );
}

function AddressFormModal({ isOpen, onClose, address, onSaved }) {
  const isEditing = Boolean(address);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: BLANK, values: address ? { ...BLANK, ...address } : BLANK });

  const onSubmit = async (values) => {
    try {
      if (isEditing) {
        await accountApi.updateAddress(address.id, values);
        toast.success('Address updated');
      } else {
        await accountApi.createAddress(values);
        toast.success('Address saved');
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
      title={isEditing ? 'Edit address' : 'Add a new address'}
      description="We use this for delivery, so double-check the PIN code and phone number."
      className="sm:max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Label"
            placeholder="Home, Office…"
            hint="Just for you, to tell addresses apart."
            {...register('label', { maxLength: { value: 50, message: 'Label is too long' } })}
            error={errors.label?.message}
          />

          <Select label="Address type" {...register('type')}>
            <option value="shipping">Shipping</option>
            <option value="billing">Billing</option>
          </Select>

          <Input
            label="Full name"
            required
            autoComplete="name"
            error={errors.fullName?.message}
            {...register('fullName', { required: 'Enter the recipient’s name' })}
          />

          <Input
            label="Phone number"
            required
            type="tel"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register('phone', {
              required: 'Enter a contact number',
              pattern: { value: /^[+]?[\d\s\-()]{7,20}$/, message: 'Enter a valid phone number' },
            })}
          />

          <Input
            label="Address line 1"
            required
            autoComplete="address-line1"
            wrapperClassName="sm:col-span-2"
            error={errors.line1?.message}
            {...register('line1', { required: 'Enter the street address' })}
          />

          <Input
            label="Address line 2"
            autoComplete="address-line2"
            placeholder="Apartment, landmark (optional)"
            wrapperClassName="sm:col-span-2"
            {...register('line2')}
          />

          <Input
            label="City"
            required
            autoComplete="address-level2"
            error={errors.city?.message}
            {...register('city', { required: 'Enter the city' })}
          />

          <Input
            label="State"
            required
            autoComplete="address-level1"
            error={errors.state?.message}
            {...register('state', { required: 'Enter the state' })}
          />

          <Input
            label="PIN code"
            required
            inputMode="numeric"
            autoComplete="postal-code"
            error={errors.postalCode?.message}
            {...register('postalCode', {
              required: 'Enter the PIN code',
              pattern: { value: /^\d{4,10}$/, message: 'Enter a valid PIN code' },
            })}
          />

          <Input
            label="Country"
            required
            autoComplete="country-name"
            error={errors.country?.message}
            {...register('country', { required: 'Enter the country' })}
          />
        </div>

        <Checkbox label="Use this as my default address" {...register('isDefault')} />

        <div className="flex flex-wrap justify-end gap-3 border-t border-bark-100 pt-5">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} loadingText="Saving…">
            {isEditing ? 'Save changes' : 'Save address'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
