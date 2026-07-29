import Button from './Button';
import { cn } from '@/lib/utils/cn';

/**
 * Shown when a list has nothing in it. Always offers a way forward rather than
 * leaving the customer on a dead end.
 */
export default function EmptyState({
  icon = '🍯',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-bark-200 bg-white/60 px-6 py-16 text-center',
        className
      )}
    >
      <span className="text-4xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-bark-800">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-bark-600">{description}</p>}

      {actionLabel && (
        <Button href={actionHref} onClick={onAction} className="mt-6" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
