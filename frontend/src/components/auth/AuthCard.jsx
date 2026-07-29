'use client';

import { motion } from 'framer-motion';

/**
 * Shared shell for every credential form — heading, description and a soft
 * entrance so the panel does not appear abruptly on navigation.
 */
export default function AuthCard({ title, description, children, footer }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 text-sm text-bark-600">{description}</p>}

      <div className="mt-8">{children}</div>

      {footer && <div className="mt-6 text-center text-sm text-bark-600">{footer}</div>}
    </motion.div>
  );
}
