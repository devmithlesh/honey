import Reveal from '@/components/motion/Reveal';
import { cn } from '@/lib/utils/cn';

/**
 * Shared section header (eyebrow, title, description) so every band on the
 * marketing pages shares one rhythm and type scale.
 */
export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}) {
  const isCentered = align === 'center';

  return (
    <Reveal className={cn(isCentered && 'mx-auto max-w-2xl text-center', className)}>
      {eyebrow && (
        <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-honey-100 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-honey-800 uppercase">
          {eyebrow}
        </span>
      )}

      <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">{title}</h2>

      {description && <p className="mt-4 text-base text-bark-600 sm:text-lg">{description}</p>}
    </Reveal>
  );
}
