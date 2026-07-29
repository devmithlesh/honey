const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Money values cross the API as decimal strings so no precision is lost in
 * transit; every one of them is normalised here before display.
 */
export const toNumber = (value, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const formatCurrency = (value) => currencyFormatter.format(toNumber(value));

export const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date);
};

export const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : dateTimeFormatter.format(date);
};

/**
 * Percentage saved when a product carries a discounted price.
 */
export const calculateDiscountPercent = (price, discountPrice) => {
  const base = toNumber(price);
  const discounted = toNumber(discountPrice);
  if (base <= 0 || discounted <= 0 || discounted >= base) return 0;
  return Math.round(((base - discounted) / base) * 100);
};

/**
 * Price a customer actually pays: the discounted price when one is set and
 * genuinely lower, otherwise the list price.
 */
export const getEffectivePrice = (product) => {
  const price = toNumber(product?.price);
  const discountPrice = toNumber(product?.discountPrice);
  return discountPrice > 0 && discountPrice < price ? discountPrice : price;
};

export const truncate = (text, maxLength = 120) => {
  if (typeof text !== 'string' || text.length <= maxLength) return text ?? '';
  return `${text.slice(0, maxLength).trimEnd()}…`;
};
