'use strict';

const crypto = require('crypto');
const slugify = require('slugify');

/**
 * Human-readable, non-sequential order number: `HB-20260729-8F3A21`.
 *
 * The random block keeps order numbers unguessable, which matters because the
 * order-success page is reachable by number for guest checkouts.
 */
const generateOrderNumber = (date = new Date()) => {
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `HB-${datePart}-${randomPart}`;
};

const toSlug = (value) => slugify(String(value || ''), { lower: true, strict: true });

/**
 * Appends `-2`, `-3`, ... until `isTaken` reports the candidate as free.
 * Used for product and category slugs, which must be unique.
 */
const buildUniqueSlug = async (source, isTaken) => {
  const base = toSlug(source) || 'item';
  let candidate = base;
  let suffix = 2;

  // eslint-disable-next-line no-await-in-loop
  while (await isTaken(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

/** `HB-RAW-500`-style fallback when an admin does not supply a SKU. */
const generateSku = (name) => {
  const letters = toSlug(name).replace(/-/g, '').slice(0, 6).toUpperCase() || 'ITEM';
  return `HB-${letters}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
};

module.exports = { generateOrderNumber, toSlug, buildUniqueSlug, generateSku };
