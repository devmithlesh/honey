'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Scroll-triggered entrance animation used across the marketing pages.
 *
 * `whileInView` with `once: true` means an element animates the first time it
 * scrolls into view and then stays put — replaying on every scroll past is
 * distracting on a long page.
 *
 * When the operating system asks for reduced motion, the element renders in its
 * final state with no transform at all rather than a shortened animation.
 */
const OFFSETS = {
  up: { x: 0, y: 28 },
  down: { x: 0, y: -28 },
  left: { x: 28, y: 0 },
  right: { x: -28, y: 0 },
  none: { x: 0, y: 0 },
};

export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  className,
  as = 'div',
  amount = 0.2,
}) {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  if (prefersReducedMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const offset = OFFSETS[direction] ?? OFFSETS.up;

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Container that cascades its children in, so a grid of cards arrives as a
 * wave instead of all at once. Pair with `<RevealItem>`.
 */
export function RevealGroup({ children, className, stagger = 0.08, delay = 0, amount = 0.15 }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}
