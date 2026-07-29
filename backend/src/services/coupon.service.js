'use strict';

const ApiError = require('../utils/ApiError');
const couponRepository = require('../repositories/coupon.repository');

/**
 * Full redeemability check for a specific cart and customer.
 *
 * Returns the coupon plus the discount it produces, so the checkout quote and
 * the order write both use one implementation rather than two that can drift.
 */
const evaluate = async (code, subtotal, userId = null) => {
  const coupon = await couponRepository.findByCode(code);

  if (!coupon) {
    throw ApiError.notFound('This coupon code is not valid');
  }

  if (!coupon.isRedeemableNow()) {
    throw ApiError.badRequest('This coupon has expired or is no longer available');
  }

  const minimum = Number.parseFloat(coupon.minOrderAmount);
  if (minimum > 0 && subtotal < minimum) {
    throw ApiError.badRequest(
      `Add items worth ₹${(minimum - subtotal).toFixed(2)} more to use this coupon`
    );
  }

  if (userId && coupon.usageLimitPerUser > 0) {
    const used = await couponRepository.countUsageByUser(coupon.id, userId);
    if (used >= coupon.usageLimitPerUser) {
      throw ApiError.badRequest('You have already used this coupon');
    }
  }

  const discount = coupon.calculateDiscount(subtotal);
  if (discount <= 0) {
    throw ApiError.badRequest('This coupon does not apply to your cart');
  }

  return { coupon, discount };
};

/** Checkout preview — same rules, shaped for the cart UI. */
const validateForCart = async (code, subtotal, userId) => {
  const { coupon, discount } = await evaluate(code, subtotal, userId);

  return {
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: coupon.value,
    discount,
    subtotal,
    payable: Math.max(0, Math.round((subtotal - discount) * 100) / 100),
  };
};

const list = (query) => couponRepository.list(query);

const getById = async (id) => {
  const coupon = await couponRepository.findById(id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return coupon;
};

const create = async (payload) => {
  if (await couponRepository.codeExists(payload.code)) {
    throw ApiError.conflict('This coupon code already exists', [
      { field: 'code', message: 'Choose a unique coupon code' },
    ]);
  }
  return couponRepository.create(payload);
};

const update = async (id, payload) => {
  const coupon = await getById(id);

  if (payload.code && (await couponRepository.codeExists(payload.code, coupon.id))) {
    throw ApiError.conflict('This coupon code already exists', [
      { field: 'code', message: 'Choose a unique coupon code' },
    ]);
  }

  return couponRepository.update(coupon, payload);
};

const remove = async (id) => {
  const coupon = await getById(id);
  await couponRepository.destroy(coupon);
  return { deleted: true };
};

module.exports = { evaluate, validateForCart, list, getById, create, update, remove };
