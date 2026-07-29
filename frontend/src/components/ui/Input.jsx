'use client';

import { forwardRef, useId } from 'react';

import { cn } from '@/lib/utils/cn';

const FIELD_BASE =
  'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-bark-800 ' +
  'placeholder:text-bark-300 transition-colors duration-200 ' +
  'focus:border-honey-400 focus:outline-none focus:ring-4 focus:ring-honey-100 ' +
  'disabled:cursor-not-allowed disabled:bg-bark-50 disabled:text-bark-400';

/**
 * Labelled form control shared by every form in the app.
 *
 * The generated id ties `<label for>` and `aria-describedby` to the field, so
 * the error text is announced by screen readers rather than only being visible.
 */
const Field = ({ id, label, error, hint, required, className, children }) => (
  <div className={cn('w-full', className)}>
    {label && (
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-bark-700">
        {label}
        {required && (
          <span className="ml-0.5 text-[var(--color-danger)]" aria-hidden="true">
            *
          </span>
        )}
      </label>
    )}

    {children}

    {hint && !error && (
      <p id={`${id}-hint`} className="mt-1.5 text-xs text-bark-500">
        {hint}
      </p>
    )}

    {error && (
      <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-[var(--color-danger)]">
        {error}
      </p>
    )}
  </div>
);

const Input = forwardRef(function Input(
  { label, error, hint, className, wrapperClassName, id, required, ...props },
  ref
) {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <Field
      id={fieldId}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(
          FIELD_BASE,
          error ? 'border-[var(--color-danger)]' : 'border-bark-200',
          className
        )}
        {...props}
      />
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className, wrapperClassName, id, required, rows = 4, ...props },
  ref
) {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <Field
      id={fieldId}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(
          FIELD_BASE,
          'resize-y',
          error ? 'border-[var(--color-danger)]' : 'border-bark-200',
          className
        )}
        {...props}
      />
    </Field>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, className, wrapperClassName, id, required, children, ...props },
  ref
) {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <Field
      id={fieldId}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(
          FIELD_BASE,
          'cursor-pointer appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-10',
          "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237d5340' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")]",
          error ? 'border-[var(--color-danger)]' : 'border-bark-200',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
});

export const Checkbox = forwardRef(function Checkbox({ label, className, id, ...props }, ref) {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <label
      htmlFor={fieldId}
      className={cn('flex cursor-pointer items-start gap-2.5 text-sm text-bark-700', className)}
    >
      <input
        ref={ref}
        id={fieldId}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-bark-300 text-honey-500 accent-honey-500"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
});

export default Input;
