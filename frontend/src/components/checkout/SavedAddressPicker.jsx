'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils/cn';

/**
 * One-tap fill from the customer's saved addresses.
 *
 * The chosen address is copied into the form fields rather than referenced by
 * id, so the customer can still edit it for this one delivery without changing
 * what is stored on their account.
 */
export default function SavedAddressPicker({ addresses = [], onSelect }) {
  const [selectedId, setSelectedId] = useState(null);

  if (addresses.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="mb-3 text-xs font-semibold tracking-wide text-bark-500 uppercase">
        Use a saved address
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {addresses.map((address) => (
          <button
            key={address.id}
            type="button"
            onClick={() => {
              setSelectedId(address.id);
              onSelect(address);
            }}
            className={cn(
              'rounded-xl border p-4 text-left transition-colors',
              selectedId === address.id
                ? 'border-honey-400 bg-honey-50'
                : 'border-bark-200 hover:border-bark-300 hover:bg-cream-50'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-bark-900">
                {address.label || address.fullName}
              </span>
              {address.isDefault && (
                <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-[10px] font-semibold text-leaf-800">
                  Default
                </span>
              )}
            </div>

            <p className="mt-1.5 text-xs leading-relaxed text-bark-600">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ''}
              <br />
              {address.city}, {address.state} {address.postalCode}
            </p>
            <p className="mt-1 text-xs text-bark-500">{address.phone}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
