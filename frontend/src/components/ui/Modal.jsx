'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { useScrollLock } from '@/lib/hooks';
import { cn } from '@/lib/utils/cn';

/**
 * Centred dialog with a backdrop.
 *
 * Escape closes it, a backdrop click closes it, and body scrolling is locked
 * while it is open so the page behind does not drift under the overlay.
 */
export default function Modal({ isOpen, onClose, title, description, children, className }) {
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-bark-900/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              'relative z-10 max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-[var(--shadow-lifted)] sm:max-w-lg sm:rounded-2xl',
              className
            )}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                {title && <h2 className="text-lg font-semibold text-bark-900">{title}</h2>}
                {description && <p className="mt-1 text-sm text-bark-600">{description}</p>}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="-mt-1 -mr-1 rounded-lg p-1.5 text-bark-500 transition-colors hover:bg-bark-50 hover:text-bark-800"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mt-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Destructive-action confirmation built on the same dialog. */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  isLoading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description}>
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center rounded-[var(--radius-pill)] border border-bark-200 px-6 text-sm font-semibold text-bark-700 transition-colors hover:bg-bark-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="inline-flex h-11 items-center rounded-[var(--radius-pill)] bg-[var(--color-danger)] px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isLoading ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
