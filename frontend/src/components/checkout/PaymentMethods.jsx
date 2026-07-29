'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

import Input from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

/**
 * Payment selection.
 *
 * Phase 1 has no payment gateway: UPI is settled manually, so the customer
 * scans the farm's QR code, pays in their own app, and types the reference back
 * in. An admin verifies it against the bank statement before the order moves on.
 */
export default function PaymentMethods({ value, onChange, settings, amount, register, errors }) {
  const isCodEnabled = settings?.cod_enabled !== false;
  const upiId = settings?.upi_id;
  const upiQrUrl = settings?.upi_qr_url;

  const methods = [
    {
      id: 'cod',
      label: 'Cash on delivery',
      description: 'Pay the courier when your parcel arrives.',
      icon: '💵',
      disabled: !isCodEnabled,
    },
    {
      id: 'upi',
      label: 'UPI',
      description: 'Scan our QR code or pay to our UPI ID, then enter the reference.',
      icon: '📱',
      disabled: false,
    },
  ];

  return (
    <div className="space-y-3">
      {methods.map((method) => {
        const isSelected = value === method.id;
        const inputId = `payment-method-${method.id}`;

        return (
          <div
            key={method.id}
            className={cn(
              'rounded-xl border p-4 transition-colors',
              method.disabled && 'opacity-50',
              isSelected ? 'border-honey-400 bg-honey-50' : 'border-bark-200 hover:border-bark-300'
            )}
          >
            {/*
              The label wraps only the radio and its own text. The expanded UPI
              panel is a sibling: nesting its text input inside this label would
              make focusing the reference field re-select the radio.
            */}
            <label
              htmlFor={inputId}
              className={cn('flex gap-4', method.disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
            >
              <input
                id={inputId}
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={isSelected}
                disabled={method.disabled}
                onChange={() => onChange(method.id)}
                className="mt-1 size-4 shrink-0 accent-honey-500"
              />

              <span className="flex-1">
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">{method.icon}</span>
                  <span className="text-sm font-semibold text-bark-900">{method.label}</span>
                  {method.disabled && (
                    <span className="rounded-full bg-bark-100 px-2 py-0.5 text-[10px] font-semibold text-bark-500">
                      Unavailable
                    </span>
                  )}
                </span>

                <span className="mt-1 block text-xs text-bark-600">{method.description}</span>
              </span>
            </label>

            <div className="pl-8">
              <AnimatePresence>
                {isSelected && method.id === 'upi' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 rounded-xl border border-honey-200 bg-white p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        {upiQrUrl ? (
                          <div className="relative size-32 shrink-0 overflow-hidden rounded-lg border border-bark-100">
                            <Image
                              src={upiQrUrl}
                              alt="UPI QR code"
                              fill
                              sizes="128px"
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="grid size-32 shrink-0 place-items-center rounded-lg border border-dashed border-bark-200 text-center text-[11px] text-bark-400">
                            QR code not
                            <br />
                            uploaded yet
                          </div>
                        )}

                        <div className="min-w-0 flex-1 text-sm">
                          <p className="text-bark-600">Pay exactly</p>
                          <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-bark-900">
                            {formatCurrency(amount)}
                          </p>

                          {upiId && (
                            <p className="mt-2 text-bark-600">
                              UPI ID:{' '}
                              <span className="font-semibold text-bark-900 select-all">{upiId}</span>
                            </p>
                          )}

                          <p className="mt-2 text-xs text-bark-500">
                            After paying, copy the transaction / UTR reference from your app and
                            paste it below. We verify every payment before dispatch.
                          </p>
                        </div>
                      </div>

                      <Input
                        label="UPI transaction reference"
                        required
                        placeholder="e.g. 402913756421"
                        wrapperClassName="mt-4"
                        error={errors?.transactionReference?.message}
                        {...register('transactionReference', {
                          maxLength: { value: 120, message: 'Reference is too long' },
                        })}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
