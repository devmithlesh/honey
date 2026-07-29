import clsx from 'clsx';

/**
 * Conditional className joiner used by every UI primitive.
 *
 * Components accept a `className` prop that is appended last, so callers can
 * always override the defaults through normal CSS cascade ordering.
 */
export const cn = (...inputs) => clsx(inputs);
