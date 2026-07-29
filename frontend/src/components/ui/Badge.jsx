import { cn } from '@/lib/utils/cn';

const TONES = {
  neutral: 'bg-bark-100 text-bark-700',
  honey: 'bg-honey-100 text-honey-800',
  success: 'bg-leaf-100 text-leaf-800',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  muted: 'bg-cream-200 text-bark-600',
};

/** Order statuses map to a fixed tone so the colour is consistent everywhere. */
export const STATUS_TONES = {
  pending: 'honey',
  confirmed: 'info',
  packed: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
  paid: 'success',
  failed: 'danger',
  refunded: 'muted',
  awaiting_verification: 'honey',
  approved: 'success',
  rejected: 'danger',
};

export default function Badge({ children, tone = 'neutral', className, size = 'md' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-pill)] font-medium capitalize',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        TONES[tone] ?? TONES.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}

/** Convenience wrapper that picks the tone from the status value itself. */
export function StatusBadge({ status, className, size }) {
  if (!status) return null;

  return (
    <Badge tone={STATUS_TONES[status] || 'neutral'} className={className} size={size}>
      {String(status).replace(/_/g, ' ')}
    </Badge>
  );
}
