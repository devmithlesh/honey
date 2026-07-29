'use strict';

const { Model, DataTypes } = require('sequelize');
const { COUPON_TYPE } = require('../constants');

module.exports = (sequelize) => {
  class Coupon extends Model {
    static associate({ Order, CouponUsage }) {
      Coupon.hasMany(Order, { foreignKey: 'couponId', as: 'orders' });
      Coupon.hasMany(CouponUsage, { foreignKey: 'couponId', as: 'usages' });
    }

    /** Window and activation checks, independent of any particular cart. */
    isRedeemableNow(now = new Date()) {
      if (!this.isActive) return false;
      if (this.startsAt && now < this.startsAt) return false;
      if (this.expiresAt && now > this.expiresAt) return false;
      if (this.usageLimit !== null && this.usedCount >= this.usageLimit) return false;
      return true;
    }

    /**
     * Discount for a given subtotal, rounded to paise. Percentage coupons
     * honour `maxDiscountAmount`, and no coupon may exceed the subtotal.
     */
    calculateDiscount(subtotal) {
      const amount = Number.parseFloat(subtotal);
      const value = Number.parseFloat(this.value);
      if (!Number.isFinite(amount) || amount <= 0) return 0;

      let discount =
        this.type === COUPON_TYPE.PERCENTAGE ? (amount * value) / 100 : value;

      if (this.type === COUPON_TYPE.PERCENTAGE && this.maxDiscountAmount !== null) {
        discount = Math.min(discount, Number.parseFloat(this.maxDiscountAmount));
      }

      return Math.round(Math.min(discount, amount) * 100) / 100;
    }
  }

  Coupon.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        // Postgres compares case-sensitively, so codes are stored uppercase and
        // every lookup uppercases its input.
        set(value) {
          this.setDataValue('code', String(value || '').trim().toUpperCase());
        },
      },
      description: { type: DataTypes.STRING(255), allowNull: true },
      type: { type: DataTypes.ENUM(...Object.values(COUPON_TYPE)), allowNull: false },
      value: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0.01 } },
      minOrderAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      maxDiscountAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      usageLimit: { type: DataTypes.INTEGER, allowNull: true },
      usageLimitPerUser: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      usedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      startsAt: { type: DataTypes.DATE, allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: 'Coupon',
      tableName: 'coupons',
      underscored: true,
      timestamps: true,
      paranoid: true,
      validate: {
        percentageWithinRange() {
          if (this.type === COUPON_TYPE.PERCENTAGE && Number.parseFloat(this.value) > 100) {
            throw new Error('A percentage coupon cannot exceed 100%');
          }
        },
        expiryAfterStart() {
          if (this.startsAt && this.expiresAt && this.expiresAt <= this.startsAt) {
            throw new Error('Expiry date must be after the start date');
          }
        },
      },
    }
  );

  return Coupon;
};
