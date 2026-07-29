import { cn } from '@/lib/utils/cn';

/**
 * Shimmering placeholder used while data loads.
 *
 * `aria-hidden` keeps the decorative block out of the accessibility tree; the
 * surrounding region should carry `aria-busy` instead so screen readers
 * announce loading once rather than per placeholder.
 */
export default function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden rounded-lg bg-bark-100/70',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.6s_infinite]',
        'after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent',
        className
      )}
    />
  );
}
