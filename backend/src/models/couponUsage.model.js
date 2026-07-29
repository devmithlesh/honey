'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CouponUsage extends Model {
    static associate({ Coupon, User, Order }) {
      CouponUsage.belongsTo(Coupon, { foreignKey: 'couponId', as: 'coupon' });
      CouponUsage.belongsTo(User, { foreignKey: 'userId', as: 'user' });
      CouponUsage.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
    }
  }

  CouponUsage.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      couponId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.BIGINT, allowNull: true },
      orderId: { type: DataTypes.BIGINT, allowNull: false },
      discountAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    },
    {
      sequelize,
      modelName: 'CouponUsage',
      tableName: 'coupon_usage',
      underscored: true,
      timestamps: true,
    }
  );

  return CouponUsage;
};
