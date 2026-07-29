import Link from 'next/link';

import { cn } from '@/lib/utils/cn';

const VARIANTS = {
  primary:
    'bg-honey-500 text-bark-900 hover:bg-honey-400 active:bg-honey-600 shadow-[var(--shadow-soft)]',
  secondary: 'bg-bark-800 text-cream-50 hover:bg-bark-700 active:bg-bark-900',
  outline:
    'border border-bark-200 bg-transparent text-bark-800 hover:bg-bark-50 active:bg-bark-100',
  ghost: 'bg-transparent text-bark-700 hover:bg-bark-50 active:bg-bark-100',
  danger: 'bg-[var(--color-danger)] text-white hover:opacity-90 active:opacity-100',
};

const SIZES = {
  sm: 'h-9 px-4 text-sm gap-1.5',
  md: 'h-11 px-6 text-sm gap-2',
  lg: 'h-13 px-8 text-base gap-2.5',
};

const BASE =
  'inline-flex items-center justify-center rounded-[var(--radius-pill)] font-semibold ' +
  'transition-[background-color,color,opacity,transform] duration-200 ' +
  'disabled:pointer-events-none disabled:opacity-55 ' +
  'active:scale-[0.98] whitespace-nowrap';

/**
 * Button primitive. Renders an anchor when `href` is supplied so navigation and
 * actions share one visual language without duplicating styles.
 *
 * Disabled links are rendered as a real `<button disabled>` because an `<a>`
 * has no disabled state and would remain keyboard-activatable.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  className,
  type = 'button',
  disabled = false,
  isLoading = false,
  loadingText,
  ...props
}) {
  const classes = cn(BASE, VARIANTS[variant] ?? VARIANTS.primary, SIZES[size] ?? SIZES.md, className);
  const isInactive = disabled || isLoading;

  if (href && !isInactive) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={isInactive} aria-busy={isLoading} {...props}>
      {isLoading ? (
        <>
          <Spinner />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
