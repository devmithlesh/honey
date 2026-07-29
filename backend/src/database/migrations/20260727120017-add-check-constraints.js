'use strict';

/**
 * Restores the guarantees that MySQL's `UNSIGNED` provided before the port to
 * Postgres, which has no unsigned integer types.
 *
 * Without these, `stock` could go negative on a concurrent oversell and
 * `rating` could be stored as 0 or 99 — the application layer checks both, but
 * the database is the only place the rule cannot be bypassed.
 */
const CHECKS = [
  // Quantities and counters that must never fall below zero.
  ['products', 'products_stock_non_negative', '"stock" >= 0'],
  ['products', 'products_low_stock_threshold_non_negative', '"low_stock_threshold" >= 0'],
  ['products', 'products_rating_count_non_negative', '"rating_count" >= 0'],
  ['products', 'products_rating_average_range', '"rating_average" >= 0 AND "rating_average" <= 5'],
  ['coupons', 'coupons_used_count_non_negative', '"used_count" >= 0'],
  ['coupons', 'coupons_usage_limit_positive', '"usage_limit" IS NULL OR "usage_limit" > 0'],
  ['coupons', 'coupons_usage_limit_per_user_positive', '"usage_limit_per_user" > 0'],
  ['categories', 'categories_sort_order_non_negative', '"sort_order" >= 0'],
  ['product_images', 'product_images_sort_order_non_negative', '"sort_order" >= 0'],

  // A line item of zero units is not an order line.
  ['order_items', 'order_items_quantity_positive', '"quantity" > 0'],

  // Ratings are a 1-5 star scale.
  ['reviews', 'reviews_rating_range', '"rating" >= 1 AND "rating" <= 5'],

  // Money is never negative, and the total must reconcile with its parts.
  ['products', 'products_price_non_negative', '"price" >= 0'],
  ['products', 'products_discount_price_valid', '"discount_price" IS NULL OR ("discount_price" >= 0 AND "discount_price" < "price")'],
  ['order_items', 'order_items_unit_price_non_negative', '"unit_price" >= 0'],
  ['order_items', 'order_items_line_total_non_negative', '"line_total" >= 0'],
  ['orders', 'orders_subtotal_non_negative', '"subtotal" >= 0'],
  ['orders', 'orders_discount_total_non_negative', '"discount_total" >= 0'],
  ['orders', 'orders_shipping_total_non_negative', '"shipping_total" >= 0'],
  ['orders', 'orders_grand_total_non_negative', '"grand_total" >= 0'],
  ['orders', 'orders_grand_total_reconciles', '"grand_total" = "subtotal" - "discount_total" + "shipping_total"'],
  ['payments', 'payments_amount_non_negative', '"amount" >= 0'],
  ['coupon_usage', 'coupon_usage_discount_non_negative', '"discount_amount" >= 0'],
  ['coupons', 'coupons_value_positive', '"value" > 0'],
  ['coupons', 'coupons_min_order_amount_non_negative', '"min_order_amount" >= 0'],

  // A percentage coupon cannot exceed 100%.
  ['coupons', 'coupons_percentage_within_range', `"type" <> 'percentage' OR "value" <= 100`],
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const [table, name, expression] of CHECKS) {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "${name}" CHECK (${expression});`
      );
    }
  },

  async down(queryInterface) {
    for (const [table, name] of CHECKS) {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${name}";`
      );
    }
  },
};
