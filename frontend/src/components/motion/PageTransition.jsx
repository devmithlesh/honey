'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Soft fade-and-rise applied to each route's main content.
 *
 * Deliberately short (~0.35s) and translate-only: a long or sliding transition
 * makes navigation feel slower than it is, because the content is already there
 * while the animation plays.
 */
export default function PageTransition({ children, className }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
